"""
Shelfline data-pipeline: Excel source -> app/src/data/mockData.ts static tables.

Reads the Content / Price / Share Of Search tabs of the source workbook, groups
every row by its real "Company" column (Perfality's original Sep 2022 crawl,
plus any other client's data added under its own Company name in the same
template), processes each company independently using its own real observed
crawl dates as that company's "weeks" -- there is no shared, hardcoded date
grid any more -- and prints the generated TypeScript for the static block of
mockData.ts (retailers/companies through REAL_ROLLUP_WEEKLY, plus categories
and keywordSet) to stdout.

Usage:
    python build_mock_data.py <path-to-xlsx> [path-to-map-price-xlsx] > generated_block.ts

The optional second argument is a separate MAP (Minimum Advertised Price)
reference workbook -- MAP is a brand policy value, not something the crawl
itself observes, so it's supplied as its own file rather than a tab on the
main workbook (or as this workbook's own MAP Price tab; both are read the
same way, see load_map_price()). Omitting it leaves every product's mapPrice
honestly null rather than fabricated.

Also writes a JSON debug dump (build_debug.json, next to the output) with every
intermediate table, for spot-checking derived numbers against the raw workbook
before the generated block is spliced into mockData.ts.

This script is the auditable record of exactly how each company's real crawl
(Content / Price / Share Of Search) was turned into the catalog and REAL_*
tables consumed by app/src/data/mockData.ts. Re-run it whenever a source
workbook is refreshed or a new company's data is added; the static block it
prints is meant to be reviewed, then pasted in.

Depends on `openpyxl` and `ftfy` (``pip install ftfy`` -- used to repair mojibake
in crawled text fields, see `fix_mojibake` below).
"""

import sys
import json
import re
from collections import defaultdict, Counter
from datetime import datetime, timedelta

import openpyxl
import ftfy

# Crawled text (title/description/bullets/ingredients) sometimes has mojibake
# baked into the source workbook itself -- e.g. "TetraÂ®" for
# "Tetra®" -- from a prior UTF-8-saved-as/read-as-Windows-1252 step
# upstream of this pipeline, not something openpyxl introduces. Repaired at
# the point every string is emitted (see ts_str below) so it can never
# reappear as new fields are added. Applied only to the non-ASCII runs
# themselves (not whole strings) and with quote-curling/line-break/etc.
# normalization disabled, so genuinely-correct text (real accented brand
# names, deliberate curly quotes) is left untouched -- verified against the
# full 117-SKU catalog before this was added.
_MOJIBAKE_RUN = re.compile(r"[^\x00-\x7f]+")
_MOJIBAKE_CONFIG = ftfy.TextFixerConfig(
    unescape_html=False,
    remove_terminal_escapes=False,
    fix_encoding=True,
    restore_byte_a0=True,
    replace_lossy_sequences=True,
    decode_inconsistent_utf8=True,
    fix_c1_controls=True,
    fix_latin_ligatures=False,
    fix_character_width=False,
    uncurl_quotes=False,
    fix_line_breaks=False,
    fix_surrogates=True,
    remove_control_chars=False,
    normalization=None,
)


def fix_mojibake(text):
    if not text:
        return text
    return _MOJIBAKE_RUN.sub(lambda m: ftfy.fix_text(m.group(0), config=_MOJIBAKE_CONFIG), text)

# ── retailer / category normalization ──────────────────────────────────────
# Retailer codes are shared globally across every company (the same "r1"
# means Amazon.com whichever company's product it's attached to) -- only the
# catalog id (company + retailer + native id) is company-scoped, see
# make_pid() below.

SITE_TO_CODE = {
    "amazon.com": "r1",
    "chewy.com": "r2",
    "walmart.com": "r3",
    "homedepot.com": "r4",
    "petsmart.com": "r5",
    "lowes.com": "r6",
    "petco.com": "r7",
    # Added for Ancestry's multi-country Amazon presence -- real distinct
    # marketplaces, not a normalization of amazon.com.
    "amazon.com.au": "r8",
    "amazon.co.uk": "r9",
    "amazon.nl": "r10",
    "amazon.pl": "r11",
    "amazon.se": "r12",
    "amazon.ca": "r13",
    "amazon.es": "r14",
    "amazon.de": "r15",
}

RETAILER_NAMES = {
    "r1": "Amazon.com",
    "r2": "Chewy",
    "r3": "Walmart",
    "r4": "The Home Depot",
    "r5": "PetSmart",
    "r6": "Lowe's",
    "r7": "Petco",
    "r8": "Amazon Australia",
    "r9": "Amazon UK",
    "r10": "Amazon Netherlands",
    "r11": "Amazon Poland",
    "r12": "Amazon Sweden",
    "r13": "Amazon Canada",
    "r14": "Amazon Spain",
    "r15": "Amazon Germany",
}

CATEGORY_NORMALIZE = {
    "PET": "GPC",
    "H&G": "HG",
    "GPC": "GPC",
    "HPC": "HPC",
    "HG": "HG",
}

OOS_MARKERS = (
    "out of stock", "unavailable", "temporarily out",
    # "Url Failed" (222 rows across 4 of the new companies) is a crawl
    # failure, not an observed stock status -- the retailer's page was
    # never actually reached that day. Was previously falling through to
    # "in stock" by default (it matches none of the markers above), which
    # silently inflated every affected company's real Stock Availability
    # and Buy Box Ownership numbers. Treated the same way the user's own
    # reference calculation treats it: counted as not-in-stock, not
    # excluded from the denominator.
    "url failed",
)
DEFAULT_COMPANY = "Perfality"

# A company's own listing is sometimes won by a seller name that's neither
# the retailer's own name (Amazon.com, Walmart, ...) nor a raw "You" --
# it's the company/brand's own storefront name on that marketplace (e.g.
# Ancestry selling as "AncestryDNA" on Amazon rather than "Ships from and
# sold by Amazon.com"). Matched in is_own_seller() below alongside the
# existing retailer-name check, normalized the same way (norm_seller), so
# these don't get miscounted as a genuine 3rd-party buy-box loss. Supplied
# directly by each client -- add here as new companies confirm their own
# storefront seller name(s), never guessed.
OWN_SELLER_NAMES = {
    "Ancestry": ["AncestryDNA", "AncestryDNA Official"],
    "MAXSTONE": ["MAX + STONE"],
    "STYLECRAFT": ["STYLECRAFT"],
}


def norm_site(s):
    if not s:
        return None
    return str(s).strip().lower()


def site_code(s):
    return SITE_TO_CODE.get(norm_site(s))


def norm_seller(s):
    if not s:
        return ""
    return re.sub(r"[^a-z0-9]", "", str(s).lower())


def is_own_seller(seller, site_code_, company=None):
    """Home Depot & Lowe's buy-box-seller fields are store/location names, not
    real marketplace competitors (verified against the raw data) -- treat any
    seller on those two retailers as self. Otherwise self if the seller name
    is the retailer's own name/domain (a 1P "sold by Amazon.com"-style
    listing) OR one of this company's own known storefront names on that
    marketplace (see OWN_SELLER_NAMES) -- a company selling under its own
    brand name is still us, not a 3rd-party competitor."""
    if site_code_ in ("r4", "r6"):
        return True
    if not seller:
        return False
    ns = norm_seller(seller)
    site_name = norm_seller(RETAILER_NAMES[site_code_])
    site_domain = norm_seller([k for k, v in SITE_TO_CODE.items() if v == site_code_][0])
    if ns == site_name or ns == site_domain or site_name in ns or ns in site_name:
        return True
    for alias in OWN_SELLER_NAMES.get(company, []):
        na = norm_seller(alias)
        if ns == na or na in ns:
            return True
    return False


def date_key(d):
    if isinstance(d, datetime):
        return d.strftime("%Y-%m-%d")
    return str(d)[:10]


def norm_company(v):
    """Every tab's Company column, defaulted to Perfality (the original
    source workbook predates this column entirely, so an absent/blank value
    there is honestly Perfality's own data, not a fourth "unknown" company)."""
    s = str(v).strip() if v is not None else ""
    return s or DEFAULT_COMPANY


def company_slug(name):
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-") or "company"


def make_pid(company, code, native_id):
    """Perfality keeps its original, unprefixed id format (r1-B000...) --
    every hardcoded reference to a real Perfality product elsewhere in this
    codebase (sample notifications, etc.) depends on that exact shape, and
    real per-retailer native ids (ASINs etc.) are globally unique in
    practice, so there's no real collision risk to guard against for it.
    Every other company gets its slug prefixed on, both to guarantee
    uniqueness and to make "which company is this row" legible from the id
    alone."""
    if company == DEFAULT_COMPANY:
        return f"{code}-{native_id}"
    return f"{company_slug(company)}-{code}-{native_id}"


def load_sheet(wb, name):
    if name not in wb.sheetnames:
        return []
    ws = wb[name]
    headers = None
    rows = []
    for i, row in enumerate(ws.iter_rows(values_only=True)):
        if i == 0:
            headers = row
            continue
        if row is None or all(c is None for c in row):
            continue
        rows.append(dict(zip(headers, row)))
    return rows


def load_map_price(path):
    """Loads the MAP (Minimum Advertised Price) reference table -- a
    workbook (or, now, this same workbook's own MAP Price tab) the user
    supplies alongside the main crawl (MAP is a brand-set policy value, not
    something the crawl itself observes). Scans every sheet for one whose
    header row contains a "Map Price" column (rather than hardcoding a sheet
    name/position), so a differently-shaped file doesn't break this.
    Returns company -> site_code -> {str(native retailer id): map price},
    skipping any row with no retailer site/id match or a blank MAP price (a
    real "no MAP set for this SKU", not a fabricated 0). A sheet with no
    Company column (the original standalone MAP workbook predates it) is
    treated as entirely Perfality's data."""
    wb = openpyxl.load_workbook(path, data_only=True, read_only=True)
    out = defaultdict(lambda: defaultdict(dict))
    for ws in wb.worksheets:
        rows_iter = ws.iter_rows(values_only=True)
        header = None
        for row in rows_iter:
            if row and any(c is not None for c in row):
                header = row
                break
        if not header:
            continue
        header_norm = [str(h).strip().lower() if h is not None else "" for h in header]
        if "map price" not in header_norm:
            continue
        site_i = next((i for i, h in enumerate(header_norm) if h == "retailer site"), None)
        id_i = next((i for i, h in enumerate(header_norm) if h == "retailer id"), None)
        company_i = next((i for i, h in enumerate(header_norm) if h == "company"), None)
        map_i = header_norm.index("map price")
        if site_i is None or id_i is None:
            continue
        for row in rows_iter:
            if row is None or all(c is None for c in row):
                continue
            code = site_code(row[site_i])
            native = row[id_i]
            if not code or native is None:
                continue
            mp = row[map_i]
            if isinstance(mp, (int, float)):
                company = norm_company(row[company_i]) if company_i is not None else DEFAULT_COMPANY
                out[company][code][str(native)] = float(mp)
    return out


def is_in_stock(status):
    if status is None:
        return None
    s = str(status).lower()
    return not any(marker in s for marker in OOS_MARKERS)


def fill_series(series, hard_default=None):
    """Forward-fill, then back-fill, any None gaps in a per-week series (a
    product with no crawl data at all in an early week still needs a number
    for every point on a real chart). If every point is None (a genuine
    "never observed" product -- e.g. zero reviews the whole month), every
    point becomes hard_default instead, which must be an honest value for
    the field (0 for reviews/rating), never a fabricated one."""
    out = list(series)
    last = None
    for i in range(len(out)):
        if out[i] is None:
            out[i] = last
        else:
            last = out[i]
    nxt = None
    for i in range(len(out) - 1, -1, -1):
        if out[i] is None:
            out[i] = nxt
        else:
            nxt = out[i]
    if all(v is None for v in out) and hard_default is not None:
        out = [hard_default] * len(out)
    return out


def token_set(name):
    words = re.findall(r"[a-z0-9]+", (name or "").lower())
    return set(w for w in words if len(w) > 2)


def get_any(row, *names):
    """Reads the first present column out of several possible header
    spellings. The original Sep 2022 source workbook predates the import
    template's renames (SPB Url -> Url, Category name -> Category/account
    name, Vendor stock no -> SKU), so this script has to keep reading that
    file unchanged while also accepting a fresh upload built on the new
    template -- tried in order, first non-None wins."""
    for n in names:
        v = row.get(n)
        if v is not None:
            return v
    return None


def other_sellers(row, limit=10):
    """Parses the import template's "Other Seller N Name"/"Other Seller N
    Price" pairs (N=1..limit) into a compact list -- real competing sellers
    on a listing beyond whoever holds the buy box. Empty/blank wherever a
    crawl never captured this, an honest gap, not a fabricated seller list."""
    out = []
    for i in range(1, limit + 1):
        name = row.get(f"Other Seller {i} Name")
        if not name:
            continue
        price = row.get(f"Other Seller {i} Price")
        out.append({"name": str(name), "price": float(price) if isinstance(price, (int, float)) else None})
    return out


def week_label(dk):
    """"2022-09-08" -> "Sep 8". Used for both weekly- and daily-cadence
    companies alike -- the label is just a friendly rendering of the real
    observed date, not tied to any assumption about how far apart dates are."""
    d = datetime.fromisoformat(dk)
    return d.strftime("%b ") + str(d.day)


def bucket_end(weeks, wi):
    """The exclusive end date of the wi'th bucket in a per-company weeks
    list -- the next week's start when there is one, otherwise the last
    observed gap extrapolated one more step. Generalizes the old hardcoded
    "+7 days past Sep 29" to any cadence: a daily-crawl company's final
    bucket is exactly 1 day wide, not artificially widened to a week."""
    if wi + 1 < len(weeks):
        return weeks[wi + 1]
    if len(weeks) >= 2:
        gap = (datetime.fromisoformat(weeks[-1]) - datetime.fromisoformat(weeks[-2])).days
    else:
        gap = 7
    return date_key(datetime.fromisoformat(weeks[-1]) + timedelta(days=max(gap, 1)))


def content_completeness(row):
    # 9 equally-weighted (~11.1% each) pass/fail checks -- score is simply
    # (number passing / 9) * 100. Every check reads directly from a raw
    # crawled field (title/bullet/description text, Rating, No of
    # videos). Character counts (title/description/bullet length) are
    # computed here from the text itself rather than read from a
    # separate "No of chars" column -- those columns were always just
    # len(text) anyway, so this drops them from the import template as
    # redundant, script-derivable data instead of something to fill in
    # by hand every crawl.
    title = row.get("Title") or ""
    title_len = len(title)
    check_title = bool(title) and title_len <= 75

    n_images = row.get("No of images") or 0
    check_images = n_images >= 7

    n_videos = row.get("No of videos") or 0
    check_video = n_videos >= 1

    n_bullets = row.get("No of bullets") or 0
    check_bullet_count = n_bullets >= 5

    bullets = [row.get(f"Bullet {i}") for i in range(1, 11)]
    bullets = [b for b in bullets if b]
    bullet_lengths = [len(b) for b in bullets]
    check_bullet_caps = bool(bullets) and all(b[:1].isupper() for b in bullets)
    check_bullet_length = bool(bullet_lengths) and all(150 <= bl <= 200 for bl in bullet_lengths)

    desc = row.get("Product description") or ""
    desc_len = len(desc)
    check_description = bool(desc) and 200 <= desc_len <= 2000

    rating = row.get("Rating")
    check_rating = rating is not None and rating >= 4.0

    enhanced = str(row.get("Enhanced content") or "").strip().lower() == "yes"
    check_enhanced = enhanced

    checks = {
        "title": check_title, "images": check_images, "video": check_video, "bulletCount": check_bullet_count,
        "bulletCaps": check_bullet_caps, "bulletLength": check_bullet_length,
        "description": check_description, "rating": check_rating, "enhanced": check_enhanced,
    }
    score = int(sum(checks.values()) / len(checks) * 100 + 0.5)
    return score, checks


def price_value(row):
    v = row.get("Current price")
    if v is None:
        v = row.get("List everyday price")
    return v


def process_company(company, content_rows, price_rows, sos_rows, map_price_by_site):
    """Runs the full real-data pipeline for one company's own rows in
    isolation -- its own retailers, its own real observed crawl dates as its
    "weeks" (no shared hardcoded date grid), its own category/account
    values, its own cross-retailer matching. Returns every per-company
    structure the caller folds into the combined multi-company TS output.
    Verified to reproduce Perfality's original single-company output
    byte-for-byte (see the diff check run after this refactor)."""
    # ── index Content rows by (retailer_code, native_id) ────────────────────
    content_by_product = defaultdict(dict)  # (code, native_id) -> {date_key: row}
    for r in content_rows:
        code = site_code(r.get("Retailer site"))
        if not code:
            continue
        native_id = r.get("Retailer id")
        dk = date_key(r.get("Crawl date"))
        content_by_product[(code, native_id)][dk] = r

    # ── index Price rows by (retailer_code, native_id) ──────────────────────
    price_by_product = defaultdict(list)
    for r in price_rows:
        code = site_code(r.get("Retailer site"))
        if not code:
            continue
        native_id = r.get("Retailer id")
        price_by_product[(code, native_id)].append(r)
    for k in price_by_product:
        price_by_product[k].sort(key=lambda r: date_key(r.get("Crawl date")))
        # de-duplicate same-date crawl rows (a handful of Petco products have
        # 2 rows for the same day) -- keep the last one per date.
        by_date = {}
        for r in price_by_product[k]:
            by_date[date_key(r.get("Crawl date"))] = r
        price_by_product[k] = [by_date[d] for d in sorted(by_date.keys())]

    product_keys_content = set(content_by_product.keys())
    product_keys_price = set(price_by_product.keys())
    excluded_price_only = sorted(product_keys_price - product_keys_content, key=lambda t: (t[0], str(t[1])))

    # This company's own real "weeks" -- the sorted distinct Content-tab
    # crawl dates it actually has, whatever their cadence (Perfality's
    # original 5 Sep-2022 Mondays, or a new company's 13 consecutive daily
    # snapshots). Verified to exactly reproduce Perfality's previously
    # hardcoded CONTENT_WEEKS/SOS_WEEKS constants.
    content_weeks = sorted({dk for weeks in content_by_product.values() for dk in weeks})
    sos_weeks = sorted({date_key(r.get("Crawl_date")) for r in sos_rows}) if sos_rows else []
    week_labels = [week_label(wk) for wk in content_weeks]
    sos_week_labels = [week_label(wk) for wk in sos_weeks]

    # ── build catalog + REAL_PRODUCT_WEEKLY ─────────────────────────────────
    catalog = []
    real_product_weekly = {}
    real_price_timeline = {}
    real_buybox_timeline = {}
    component_bucket_totals = defaultdict(list)
    pid_to_key = {}
    content_score_by_week = {}  # pid -> {week: score}
    raw_rating_by_product = {}

    pid_to_category = {}
    for (code, native_id), weeks in content_by_product.items():
        latest_dk = max(weeks.keys())
        latest = weeks[latest_dk]
        pid = make_pid(company, code, native_id)
        pid_to_key[pid] = (code, native_id)

        content_score, checks = content_completeness(latest)
        for b, v in checks.items():
            component_bucket_totals[b].append(v)
        content_checks_failed = [k for k, v in checks.items() if not v]

        week_scores = {}
        for wk in content_weeks:
            row = weeks.get(wk)
            if row is None:
                avail = sorted(weeks.keys())
                nearest = min(avail, key=lambda d: abs((datetime.fromisoformat(d) - datetime.fromisoformat(wk)).days))
                row = weeks[nearest]
            score, _ = content_completeness(row)
            week_scores[wk] = score
        content_score_by_week[pid] = week_scores

        rating_series, reviews_series = [], []
        for wk in content_weeks:
            row = weeks.get(wk)
            if row is None:
                avail = sorted(weeks.keys())
                nearest = min(avail, key=lambda d: abs((datetime.fromisoformat(d) - datetime.fromisoformat(wk)).days))
                row = weeks[nearest]
            rating_series.append(row.get("Rating"))
            reviews_series.append(row.get("Total reviews"))
        raw_rating_by_product[pid] = list(rating_series)

        prows = price_by_product.get((code, native_id), [])

        real_price_timeline[pid] = [
            {"date": date_key(r.get("Crawl date")), "price": round(price_value(r), 2)}
            for r in prows if price_value(r) is not None
        ]
        if code not in ("r4", "r6"):
            real_buybox_timeline[pid] = [
                {"date": date_key(r.get("Crawl date")),
                 "holder": "You" if is_own_seller(r.get("Buy box seller"), code, company) else str(r.get("Buy box seller"))}
                for r in prows
                if is_in_stock(r.get("Stock status")) and r.get("Buy box seller")
            ]

        price_series, stock_series, buybox_series = [], [], []
        last_known_price, last_known_stock, last_known_buybox = None, 100.0, 100.0
        for wi, wk_start in enumerate(content_weeks):
            wk_end = bucket_end(content_weeks, wi)
            bucket = [r for r in prows if wk_start <= date_key(r.get("Crawl date")) < wk_end]
            if bucket:
                non_null_in_bucket = [price_value(r) for r in bucket if price_value(r) is not None]
                if non_null_in_bucket:
                    last_known_price = non_null_in_bucket[-1]
                pv = last_known_price
                in_stock_flags = [is_in_stock(r.get("Stock status")) for r in bucket]
                in_stock_flags = [f for f in in_stock_flags if f is not None]
                if in_stock_flags:
                    last_known_stock = round(100.0 * sum(in_stock_flags) / len(in_stock_flags), 1)
                stock_rate = last_known_stock
                owned_flags = [
                    1 if (is_in_stock(r.get("Stock status")) and is_own_seller(r.get("Buy box seller"), code, company)) else 0
                    for r in bucket
                ]
                if bucket:
                    last_known_buybox = round(100.0 * sum(owned_flags) / len(bucket))
                buybox_rate = last_known_buybox
            else:
                pv = last_known_price
                stock_rate = last_known_stock
                buybox_rate = last_known_buybox
            price_series.append(pv)
            stock_series.append(stock_rate)
            buybox_series.append(buybox_rate)

        real_product_weekly[pid] = {
            "rating": fill_series(rating_series, hard_default=0),
            "reviews": fill_series(reviews_series, hard_default=0),
            "price": fill_series(price_series),
            "stockRate": fill_series(stock_series, hard_default=100.0),
            "buyBoxRate": fill_series(buybox_series, hard_default=100.0),
            "content": [week_scores[wk] for wk in content_weeks],
        }

        cat_name = get_any(latest, "Category/account name", "Category name")
        cat = CATEGORY_NORMALIZE.get(cat_name, cat_name)
        pid_to_category[pid] = cat
        all_prices = [price_value(r) for r in prows if price_value(r) is not None]
        stock_flags_all = [f for f in (is_in_stock(r.get("Stock status")) for r in prows) if f is not None]
        buybox_flags_all = [
            bool(is_in_stock(r.get("Stock status")) and is_own_seller(r.get("Buy box seller"), code, company))
            for r in prows
        ]
        price_change_pct = None
        if len(all_prices) >= 2 and all_prices[0]:
            price_change_pct = round(((all_prices[-1] - all_prices[0]) / all_prices[0]) * 100, 1)

        latest_price_row = prows[-1] if prows else None
        list_price = latest_price_row.get("List everyday price") if latest_price_row else None
        current_price = latest_price_row.get("Current price") if latest_price_row else None
        subscription_price = latest_price_row.get("Subscription price") if latest_price_row else None
        url = get_any(latest_price_row, "Url", "Spb url") if latest_price_row else None
        stock_status_raw = latest_price_row.get("Stock status") if latest_price_row else None
        coupon_value = latest_price_row.get("Coupon value") if latest_price_row else None
        other_sellers_list = other_sellers(latest_price_row) if latest_price_row else []

        title_length = len(latest.get("Title") or "")
        image_count = latest.get("No of images") or 0
        bullet_count = latest.get("No of bullets") or 0
        description_length = len(latest.get("Product description") or "")
        enhanced_content = str(latest.get("Enhanced content") or "").strip().lower() == "yes"
        image_url = latest.get("Front image") or None

        retailer_id = latest.get("Retailer id")
        map_price = map_price_by_site.get(code, {}).get(str(native_id))
        sku = get_any(latest, "SKU", "Vendor stock no")
        site_category = latest.get("Site category")
        buy_box_seller_raw = latest.get("Buy box seller")
        buy_box_shipper_raw = latest.get("Buy box shipper")
        video_count = latest.get("No of videos") or 0
        question_count = latest.get("No of questions") or 0
        has_360_image = bool(latest.get("Image 360"))

        description_text = latest.get("Product description") or None
        bullets_text = [latest.get(f"Bullet {i}") for i in range(1, 11)]
        bullets_text = [b for b in bullets_text if b]

        variations = []
        for i in range(1, 23):
            v_label = latest.get(f"Varient label {i}")
            v_value = latest.get(f"Varient value {i}")
            if v_label or v_value:
                label_clean = str(v_label or "Variant").strip().rstrip(":")
                variations.append(f"{label_clean}: {v_value or 'n/a'}")

        catalog.append({
            "id": pid,
            "company": company,
            "name": latest.get("Title"),
            "brand": latest.get("Brand"),
            "category": cat,
            "retailer": code,
            "rank": None,  # filled below
            "price": round(all_prices[-1], 2) if all_prices else None,
            "avgSellingPrice": round(sum(all_prices) / len(all_prices), 2) if all_prices else None,
            "rating": latest.get("Rating"),
            "reviews": latest.get("Total reviews"),
            "content": content_score,
            "stockBias": round(sum(stock_flags_all) / len(stock_flags_all), 2) if stock_flags_all else 1.0,
            "buyBoxRate": round(sum(buybox_flags_all) / len(buybox_flags_all), 2) if buybox_flags_all else 1.0,
            "priceChangePct": price_change_pct if price_change_pct is not None else 0.0,
            "priceGroup": f"{company}::{code}::{cat}",
            "listPrice": round(list_price, 2) if list_price is not None else None,
            "currentPrice": round(current_price, 2) if current_price is not None else None,
            "subscriptionPrice": round(subscription_price, 2) if subscription_price is not None else None,
            "mapPrice": round(map_price, 2) if map_price is not None else None,
            "url": url,
            "stockStatusRaw": stock_status_raw,
            "couponValue": coupon_value,
            "otherSellers": other_sellers_list,
            "contentChecks": content_checks_failed,
            "titleLength": title_length,
            "imageUrl": image_url,
            "imageCount": image_count,
            "bulletCount": bullet_count,
            "descriptionLength": description_length,
            "enhancedContent": enhanced_content,
            "retailerId": retailer_id,
            "sku": sku,
            "siteCategory": site_category,
            "buyBoxSeller": buy_box_seller_raw,
            "buyBoxShipper": buy_box_shipper_raw,
            "videoCount": video_count,
            "questionCount": question_count,
            "has360Image": has_360_image,
            "descriptionText": description_text,
            "bulletsText": bullets_text,
            "variations": variations,
        })

    # rank = position within (retailer, category) ordered by reviews desc --
    # scoped to this company's own catalog only (this function only ever
    # sees one company's rows), so two companies never compete for rank #1.
    groups = defaultdict(list)
    for p in catalog:
        groups[(p["retailer"], p["category"])].append(p)
    for key, plist in groups.items():
        plist.sort(key=lambda p: -(p["reviews"] or 0))
        for i, p in enumerate(plist):
            p["rank"] = i + 1

    catalog.sort(key=lambda p: (p["retailer"], p["category"], p["rank"]))

    # A SKU with zero priced crawl rows across the whole period keeps price
    # (and avgSellingPrice) honestly null -- never backfilled with a peer-
    # group or company-wide average. That average is a real number about
    # OTHER products, not this one, and showed up in the UI indistinguishable
    # from an actually-observed price (a client audit caught exactly this:
    # a $0-priced SKU with no Current/List price on the source sheet at all
    # was rendered with a specific dollar figure and no indication it was
    # estimated). The frontend is responsible for rendering null as "--",
    # the same convention already used for listPrice/currentPrice/mapPrice.
    priceless_ids = [p["id"] for p in catalog if p["price"] is None]
    for p in catalog:
        if p["avgSellingPrice"] is None:
            p["avgSellingPrice"] = p["price"]

    # ── REAL_ROLLUP_WEEKLY (portfolio + per retailer, this company only) ────
    def avg(vals):
        vals = [v for v in vals if v is not None]
        return round(sum(vals) / len(vals), 2) if vals else None

    price_only_by_code = defaultdict(list)
    for code, native_id in excluded_price_only:
        price_only_by_code[code].append((code, native_id))

    company_retailers = sorted({p["retailer"] for p in catalog} | set(price_only_by_code.keys()))
    company_categories = sorted({c for c in pid_to_category.values() if c})

    def compute_rollup(ids, stock_id_pairs):
        """Same real per-day-row pooling regardless of scope -- raw
        Stock status / Buy box seller / price rows within each bucket
        window, summed and weighted exactly like the portfolio/retailer
        rollup always has. Reused below for the category-scoped rollups so
        a category filter pools the same real day-level rows a client's
        own pivot table would, not an unweighted average of already-
        summarized per-product numbers."""
        stockRate, buyBoxRate, stockWeight, buyBoxWeight, rating, content = [], [], [], [], [], []
        stockRateSum, buyBoxRateSum = [], []
        avgPrice, avgPriceWeight, avgPriceSum = [], [], []
        for wi, wk_start in enumerate(content_weeks):
            wk_end = bucket_end(content_weeks, wi)
            in_stock_n, total_n, buybox_n, buybox_d = 0, 0, 0, 0
            price_sum, price_n = 0.0, 0
            for code, native_id in stock_id_pairs:
                for r in price_by_product.get((code, native_id), []):
                    if not (wk_start <= date_key(r.get("Crawl date")) < wk_end):
                        continue
                    flag = is_in_stock(r.get("Stock status"))
                    if flag is not None:
                        total_n += 1
                        in_stock_n += 1 if flag else 0
                    buybox_d += 1
                    buybox_n += 1 if (flag and is_own_seller(r.get("Buy box seller"), code, company)) else 0
                    pv = price_value(r)
                    if pv is not None:
                        price_sum += pv
                        price_n += 1
            stockRate.append(round(100.0 * in_stock_n / total_n, 2) if total_n else (stockRate[-1] if stockRate else 100.0))
            stockWeight.append(total_n)
            stockRateSum.append(in_stock_n)
            buyBoxRate.append(round(100.0 * buybox_n / buybox_d, 2) if buybox_d else (buyBoxRate[-1] if buyBoxRate else 100.0))
            buyBoxWeight.append(buybox_d)
            buyBoxRateSum.append(buybox_n)
            rating.append(avg([raw_rating_by_product[i][wi] for i in ids if i in raw_rating_by_product]))
            avgPrice.append(round(price_sum / price_n, 2) if price_n else (avgPrice[-1] if avgPrice else 0.0))
            avgPriceWeight.append(price_n)
            avgPriceSum.append(round(price_sum, 4))
        for wi in range(len(content_weeks)):
            wk = content_weeks[wi]
            content.append(avg([content_score_by_week[i][wk] for i in ids if i in content_score_by_week]))
        return {
            "stockRate": stockRate, "buyBoxRate": buyBoxRate, "rating": rating, "content": content,
            "stockRateWeight": stockWeight, "buyBoxRateWeight": buyBoxWeight,
            "stockRateSum": stockRateSum, "buyBoxRateSum": buyBoxRateSum,
            "avgPrice": avgPrice, "avgPriceWeight": avgPriceWeight, "avgPriceSum": avgPriceSum,
        }

    real_rollup_weekly = {}
    for scope in ["portfolio"] + company_retailers:
        ids = [pid for pid in real_product_weekly if scope == "portfolio" or pid_to_key[pid][0] == scope]
        if not ids:
            continue
        id_pairs = [pid_to_key[pid] for pid in ids]
        stock_id_pairs = id_pairs + (
            [pair for pairs in price_only_by_code.values() for pair in pairs]
            if scope == "portfolio" else price_only_by_code[scope]
        )
        real_rollup_weekly[scope] = compute_rollup(ids, stock_id_pairs)

        # Category-scoped rollup, keyed "<scope>::<category>" -- same real
        # per-day pooling as above, restricted to this scope's own real
        # category values. Fills the gap the category/brand/SKU real*
        # functions in mockData.ts fall through on (no category dimension
        # in the plain per-scope table above): a category filter used to
        # fall back to an unweighted average of per-product snapshots (or
        # worse, synthetic jitter), which didn't match a client's own
        # pivot-table calculation the way the un-filtered rows already did.
        # No price-only SKUs here -- they have no known category.
        for cat in company_categories:
            cat_ids = [pid for pid in ids if pid_to_category.get(pid) == cat]
            if not cat_ids:
                continue
            cat_pairs = [pid_to_key[pid] for pid in cat_ids]
            real_rollup_weekly[scope + "::" + cat] = compute_rollup(cat_ids, cat_pairs)

    portfolio_avg = {k: avg(real_rollup_weekly["portfolio"][k]) for k in ["stockRate", "buyBoxRate", "rating", "content"]} if "portfolio" in real_rollup_weekly else {}

    # ── REAL_SOS_WEEKLY: this company's own share of each keyword's results ──
    retailer_id_to_pid = defaultdict(dict)
    for p in catalog:
        if p["retailerId"]:
            retailer_id_to_pid[p["retailer"]][str(p["retailerId"])] = p["id"]

    SOS_URL_SLOTS = 65
    sos_matched_by_site_week = defaultdict(lambda: defaultdict(int))
    sos_total_by_site_week = defaultdict(lambda: defaultdict(int))
    real_keyword_match = defaultdict(set)
    keywords_seen = set()
    for r in sos_rows:
        code = site_code(r.get("site"))
        if not code:
            continue
        wk = date_key(r.get("Crawl_date"))
        if wk not in sos_weeks:
            continue
        kw = r.get("keyword")
        keywords_seen.add(kw)
        id_map = retailer_id_to_pid.get(code, {})
        matched = 0
        total = 0
        for n in range(1, SOS_URL_SLOTS + 1):
            u = r.get(f"Url_{n}")
            if u is None:
                continue
            total += 1
            u_str = str(u)
            for rid, pid in id_map.items():
                if rid in u_str:
                    matched += 1
                    real_keyword_match[pid].add(kw)
                    break
        sos_matched_by_site_week[code][wk] += matched
        sos_total_by_site_week[code][wk] += total

    real_sos_weekly = {}
    for code in company_retailers:
        pct, matched_list, total_list = [], [], []
        for wk in sos_weeks:
            m = sos_matched_by_site_week.get(code, {}).get(wk, 0)
            t = sos_total_by_site_week.get(code, {}).get(wk, 0)
            pct.append(round(100.0 * m / t, 1) if t else 0.0)
            matched_list.append(m)
            total_list.append(t)
        real_sos_weekly[code] = {"sos": pct, "sosSum": matched_list, "sosWeight": total_list}

    if sos_weeks:
        portfolio_matched = [sum(real_sos_weekly[c]["sosSum"][wi] for c in company_retailers) for wi in range(len(sos_weeks))]
        portfolio_total = [sum(real_sos_weekly[c]["sosWeight"][wi] for c in company_retailers) for wi in range(len(sos_weeks))]
        real_sos_weekly["portfolio"] = {
            "sos": [round(100.0 * m / t, 1) if t else 0.0 for m, t in zip(portfolio_matched, portfolio_total)],
            "sosSum": portfolio_matched,
            "sosWeight": portfolio_total,
        }

    bias = {}
    for code in company_retailers:
        r_avg = {k: avg(real_rollup_weekly[code][k]) for k in ["stockRate", "buyBoxRate", "rating", "content"]} if code in real_rollup_weekly else {}
        sos_avg_r = avg(real_sos_weekly[code]["sos"]) if code in real_sos_weekly else None
        sos_avg_p = avg(real_sos_weekly["portfolio"]["sos"]) if "portfolio" in real_sos_weekly else None
        bias[code] = {
            "sos": round((sos_avg_r or 0) - (sos_avg_p or 0), 2),
            "stock": round((r_avg.get("stockRate") or 0) - (portfolio_avg.get("stockRate") or 0), 1),
            "rating": round((r_avg.get("rating") or 0) - (portfolio_avg.get("rating") or 0), 2),
            "content": round((r_avg.get("content") or 0) - (portfolio_avg.get("content") or 0), 1),
        }

    # ── REAL_BUYBOX_COMPETITOR ───────────────────────────────────────────────
    real_buybox_competitor = {}
    for (code, native_id), prows in price_by_product.items():
        if (code, native_id) not in content_by_product:
            continue
        if code in ("r4", "r6"):
            continue
        pid = make_pid(company, code, native_id)
        non_self = [
            str(r.get("Buy box seller")) for r in prows
            if r.get("Buy box seller") and not is_own_seller(r.get("Buy box seller"), code, company) and is_in_stock(r.get("Stock status"))
        ]
        if not non_self:
            continue
        top_seller, days_won = Counter(non_self).most_common(1)[0]
        real_buybox_competitor[pid] = {"seller": top_seller, "daysWon": days_won}

    # ── CROSS_RETAILER_MATCH (within this company's own catalog only) ───────
    cross_retailer_match = defaultdict(dict)
    by_sku = defaultdict(list)
    for p in catalog:
        if p.get("sku"):
            by_sku[str(p["sku"]).strip().lower()].append(p)
    for sku, plist in by_sku.items():
        for i in range(len(plist)):
            for j in range(i + 1, len(plist)):
                a, b = plist[i], plist[j]
                if a["retailer"] == b["retailer"]:
                    continue
                cross_retailer_match[a["id"]][b["retailer"]] = b["id"]
                cross_retailer_match[b["id"]][a["retailer"]] = a["id"]

    by_brand = defaultdict(list)
    for p in catalog:
        if p["brand"]:
            by_brand[str(p["brand"]).strip().lower()].append(p)
    candidates = []
    for brand, plist in by_brand.items():
        for i in range(len(plist)):
            for j in range(i + 1, len(plist)):
                a, b = plist[i], plist[j]
                if a["retailer"] == b["retailer"]:
                    continue
                ta, tb = token_set(a["name"]), token_set(b["name"])
                if not ta or not tb:
                    continue
                overlap = len(ta & tb) / max(1, min(len(ta), len(tb)))
                if overlap >= 0.45:
                    candidates.append((overlap, a, b))
    candidates.sort(key=lambda c: -c[0])
    for overlap, a, b in candidates:
        if b["retailer"] not in cross_retailer_match.get(a["id"], {}) and a["retailer"] not in cross_retailer_match.get(b["id"], {}):
            cross_retailer_match[a["id"]][b["retailer"]] = b["id"]
            cross_retailer_match[b["id"]][a["retailer"]] = a["id"]

    return {
        "catalog": catalog,
        "real_product_weekly": real_product_weekly,
        "real_price_timeline": real_price_timeline,
        "real_buybox_timeline": real_buybox_timeline,
        "real_keyword_match": real_keyword_match,
        "real_buybox_competitor": real_buybox_competitor,
        "cross_retailer_match": cross_retailer_match,
        "real_rollup_weekly": real_rollup_weekly,
        "real_sos_weekly": real_sos_weekly,
        "bias": bias,
        "week_labels": week_labels,
        "sos_week_labels": sos_week_labels,
        "content_weeks": content_weeks,
        "sos_weeks": sos_weeks,
        "keywords_seen": keywords_seen,
        "retailers": company_retailers,
        "debug": {
            "content_products": len(content_by_product),
            "price_products": len(price_by_product),
            "catalog_size": len(catalog),
            "price_only_excluded": [f"{c}-{n}" for c, n in excluded_price_only],
            "component_bucket_averages": {b: avg(v) for b, v in component_bucket_totals.items()},
            "content_weeks": content_weeks,
            "sos_weeks": sos_weeks,
            "buybox_competitor_count": len(real_buybox_competitor),
            "cross_retailer_match_count": len(cross_retailer_match),
            "priceless_ids": priceless_ids,
        },
    }


def main():
    path = sys.argv[1]
    wb = openpyxl.load_workbook(path, data_only=True, read_only=True)
    # Optional second workbook (or this file's own MAP Price tab) -- a real
    # MAP reference table, per-company. Absent, every product's mapPrice is
    # honestly null rather than fabricated.
    map_price_by_company = load_map_price(sys.argv[2]) if len(sys.argv) > 2 else load_map_price(path)

    content_rows = load_sheet(wb, "Content")
    price_rows = load_sheet(wb, "Price")
    sos_rows = load_sheet(wb, "Share Of Search")

    content_by_company = defaultdict(list)
    for r in content_rows:
        content_by_company[norm_company(r.get("Company"))].append(r)
    price_by_company = defaultdict(list)
    for r in price_rows:
        price_by_company[norm_company(r.get("Company"))].append(r)
    sos_by_company = defaultdict(list)
    for r in sos_rows:
        sos_by_company[norm_company(r.get("Company"))].append(r)

    companies = sorted(set(content_by_company) | set(price_by_company))

    catalog = []
    real_product_weekly = {}
    real_price_timeline = {}
    real_buybox_timeline = {}
    real_keyword_match = {}
    real_buybox_competitor = {}
    cross_retailer_match = {}
    week_labels_by_company = {}
    sos_week_labels_by_company = {}
    week_dates_by_company = {}
    sos_week_dates_by_company = {}
    rollup_weekly = {}       # "company::scope" -> {...}
    sos_weekly = {}          # "company::scope" -> {...}
    bias_by_key = {}         # "company::retailerCode" -> {...}
    keyword_terms = set()
    company_retailers_map = {}  # company -> [retailer codes]
    debug_per_company = {}

    for company in companies:
        result = process_company(
            company,
            content_by_company.get(company, []),
            price_by_company.get(company, []),
            sos_by_company.get(company, []),
            map_price_by_company.get(company, {}),
        )
        catalog.extend(result["catalog"])
        real_product_weekly.update(result["real_product_weekly"])
        real_price_timeline.update(result["real_price_timeline"])
        real_buybox_timeline.update(result["real_buybox_timeline"])
        real_keyword_match.update(result["real_keyword_match"])
        real_buybox_competitor.update(result["real_buybox_competitor"])
        cross_retailer_match.update(result["cross_retailer_match"])
        week_labels_by_company[company] = result["week_labels"]
        sos_week_labels_by_company[company] = result["sos_week_labels"]
        week_dates_by_company[company] = result["content_weeks"]
        sos_week_dates_by_company[company] = result["sos_weeks"]
        for scope, v in result["real_rollup_weekly"].items():
            rollup_weekly[f"{company}::{scope}"] = v
        for scope, v in result["real_sos_weekly"].items():
            sos_weekly[f"{company}::{scope}"] = v
        for code, v in result["bias"].items():
            bias_by_key[f"{company}::{code}"] = v
        keyword_terms |= result["keywords_seen"]
        company_retailers_map[company] = result["retailers"]
        debug_per_company[company] = result["debug"]

    keyword_terms = sorted(keyword_terms)
    all_retailer_codes = sorted({code for codes in company_retailers_map.values() for code in codes})

    # ═══════════════════════════════════════════════════════════════════════
    # emit TypeScript
    # ═══════════════════════════════════════════════════════════════════════
    out = []
    out.append("export const companies = " + json.dumps(companies) + ";")
    out.append("")

    out.append("export const retailers = [")
    out.append('  { id: "all", name: "All retailers" },')
    for code in all_retailer_codes:
        out.append(f'  {{ id: "{code}", name: "{RETAILER_NAMES[code]}" }},')
    out.append("];")
    out.append("")

    def ts_str(v):
        if v is None:
            return "null"
        return json.dumps(fix_mojibake(str(v)))

    def ts_num(v, default=0):
        if v is None:
            return str(default)
        return json.dumps(v)

    def ts_num_or_null(v):
        if v is None:
            return "null"
        return json.dumps(v)

    def ts_bool(v):
        return "true" if v else "false"

    def ts_str_list(v):
        return json.dumps([fix_mojibake(s) for s in v])

    def ts_other_sellers(v):
        return json.dumps([{"name": fix_mojibake(s["name"]), "price": s["price"]} for s in v])

    out.append("export const catalog = [")
    for p in catalog:
        out.append(
            "  { id: %s, company: %s, name: %s, brand: %s, category: %s, retailer: %s, rank: %s, price: %s, avgSellingPrice: %s, rating: %s, reviews: %s, content: %s, stockBias: %s, buyBoxRate: %s, priceChangePct: %s, priceGroup: %s, listPrice: %s, currentPrice: %s, subscriptionPrice: %s, mapPrice: %s, url: %s, stockStatusRaw: %s, couponValue: %s, otherSellers: %s, contentChecks: %s, titleLength: %s, imageUrl: %s, imageCount: %s, bulletCount: %s, descriptionLength: %s, enhancedContent: %s, retailerId: %s, sku: %s, siteCategory: %s, buyBoxSeller: %s, buyBoxShipper: %s, videoCount: %s, questionCount: %s, has360Image: %s, descriptionText: %s, bulletsText: %s, variations: %s },"
            % (
                ts_str(p["id"]), ts_str(p["company"]), ts_str(p["name"]), ts_str(p["brand"]), ts_str(p["category"]), ts_str(p["retailer"]),
                ts_num(p["rank"], 1), ts_num_or_null(p["price"]), ts_num_or_null(p["avgSellingPrice"]),
                ts_num(p["rating"], 0), ts_num(p["reviews"], 0),
                ts_num(p["content"], 0), ts_num(p["stockBias"], 1.0), ts_num(p["buyBoxRate"], 1.0),
                ts_num(p["priceChangePct"], 0.0), ts_str(p["priceGroup"]),
                ts_num_or_null(p["listPrice"]), ts_num_or_null(p["currentPrice"]), ts_num_or_null(p["subscriptionPrice"]),
                ts_num_or_null(p["mapPrice"]),
                ts_str(p["url"]), ts_str(p["stockStatusRaw"]), ts_str(p["couponValue"]), ts_other_sellers(p["otherSellers"]),
                json.dumps(p["contentChecks"]),
                ts_num(p["titleLength"], 0), ts_str(p["imageUrl"]), ts_num(p["imageCount"], 0), ts_num(p["bulletCount"], 0),
                ts_num(p["descriptionLength"], 0), ts_bool(p["enhancedContent"]),
                ts_str(p["retailerId"]), ts_str(p["sku"]), ts_str(p["siteCategory"]),
                ts_str(p["buyBoxSeller"]), ts_str(p["buyBoxShipper"]),
                ts_num(p["videoCount"], 0), ts_num(p["questionCount"], 0),
                ts_bool(p["has360Image"]),
                ts_str(p["descriptionText"]), ts_str_list(p["bulletsText"]),
                ts_str_list(p["variations"]),
            )
        )
    out.append("];")
    out.append("")

    out.append("export const keywordSet = [")
    for i, term in enumerate(keyword_terms, 1):
        out.append(f'  {{ id: "k{i}", term: {json.dumps(term)}, volume: 0, ownRank: 0 }}, // volume/ownRank illustrative -- no traffic data in source')
    out.append("];")
    out.append("")

    out.append("export const REAL_WEEK_LABELS: Record<string, string[]> = {")
    for company, labels in week_labels_by_company.items():
        out.append(f'  {json.dumps(company)}: {json.dumps(labels)},')
    out.append("};")
    out.append("export const REAL_SOS_WEEK_LABELS: Record<string, string[]> = {")
    for company, labels in sos_week_labels_by_company.items():
        out.append(f'  {json.dumps(company)}: {json.dumps(labels)},')
    out.append("};")
    out.append("")

    # Raw ISO dates behind the labels above, per company -- used by the
    # custom date-range picker to match a user-selected window against this
    # company's own genuinely-real crawl dates (matchRangeWeeks in
    # mockData.ts), never a shared/hardcoded date list.
    out.append("export const REAL_WEEK_DATES: Record<string, string[]> = {")
    for company, dates in week_dates_by_company.items():
        out.append(f'  {json.dumps(company)}: {json.dumps(dates)},')
    out.append("};")
    out.append("export const REAL_SOS_WEEK_DATES: Record<string, string[]> = {")
    for company, dates in sos_week_dates_by_company.items():
        out.append(f'  {json.dumps(company)}: {json.dumps(dates)},')
    out.append("};")
    out.append("")

    out.append("export const REAL_PRODUCT_WEEKLY: Record<string, {")
    out.append("  rating: number[]; reviews: number[]; price: (number | null)[]; stockRate: number[]; buyBoxRate: number[]; content: number[];")
    out.append("}> = {")
    for pid, v in real_product_weekly.items():
        out.append(f'  {json.dumps(pid)}: {{ rating: {json.dumps(v["rating"])}, reviews: {json.dumps(v["reviews"])}, price: {json.dumps(v["price"])}, stockRate: {json.dumps(v["stockRate"])}, buyBoxRate: {json.dumps(v["buyBoxRate"])}, content: {json.dumps(v["content"])} }},')
    out.append("};")
    out.append("")

    out.append("export const REAL_SOS_WEEKLY: Record<string, {")
    out.append("  sos: number[];")
    out.append("  /* Raw matched-result-count / total-result-count behind sos that week --")
    out.append("     pool (sum numerator / sum denominator), never average, when combining")
    out.append("     multiple weeks, same reasoning as REAL_ROLLUP_WEEKLY's stockRateSum.")
    out.append("     Keyed \"company::scope\" (scope = \"portfolio\" or a retailer code). */")
    out.append("  sosSum: number[]; sosWeight: number[];")
    out.append("}> = {")
    for k, v in sos_weekly.items():
        out.append(f'  {json.dumps(k)}: {{ sos: {json.dumps(v["sos"])}, sosSum: {json.dumps(v["sosSum"])}, sosWeight: {json.dumps(v["sosWeight"])} }},')
    out.append("};")
    out.append("")

    out.append("export const REAL_KEYWORD_MATCH: Record<string, string[]> = {")
    for pid, kws in real_keyword_match.items():
        out.append(f'  {json.dumps(pid)}: {json.dumps(sorted(kws))},')
    out.append("};")
    out.append("")

    out.append("export const REAL_BUYBOX_COMPETITOR: Record<string, { seller: string; daysWon: number }> = {")
    for pid, v in real_buybox_competitor.items():
        out.append(f'  {json.dumps(pid)}: {{ seller: {json.dumps(fix_mojibake(v["seller"]))}, daysWon: {v["daysWon"]} }},')
    out.append("};")
    out.append("")

    out.append("export const REAL_PRICE_TIMELINE: Record<string, Array<{ date: string; price: number }>> = {")
    for pid, entries in real_price_timeline.items():
        if not entries:
            continue
        out.append(f'  {json.dumps(pid)}: {json.dumps(entries)},')
    out.append("};")
    out.append("")

    out.append("export const REAL_BUYBOX_TIMELINE: Record<string, Array<{ date: string; holder: string }>> = {")
    for pid, entries in real_buybox_timeline.items():
        if not entries:
            continue
        out.append(f'  {json.dumps(pid)}: {json.dumps([{"date": e["date"], "holder": fix_mojibake(e["holder"])} for e in entries])},')
    out.append("};")
    out.append("")

    out.append("export const CROSS_RETAILER_MATCH: Record<string, Record<string, string>> = {")
    for pid, m in cross_retailer_match.items():
        inner = ", ".join(f'{json.dumps(rc)}: {json.dumps(other)}' for rc, other in m.items())
        out.append(f'  {json.dumps(pid)}: {{ {inner} }},')
    out.append("};")
    out.append("")

    out.append("export const REAL_ROLLUP_WEEKLY: Record<string, {")
    out.append("  stockRate: number[]; buyBoxRate: number[]; rating: number[]; content: number[]; avgPrice: number[];")
    out.append("  stockRateWeight: number[]; buyBoxRateWeight: number[]; avgPriceWeight: number[]; avgPriceSum: number[];")
    out.append("  stockRateSum: number[]; buyBoxRateSum: number[];")
    out.append("}> = {")
    for scope, v in rollup_weekly.items():
        out.append(
            f'  {json.dumps(scope)}: {{ stockRate: {json.dumps(v["stockRate"])}, buyBoxRate: {json.dumps(v["buyBoxRate"])}, '
            f'rating: {json.dumps(v["rating"])}, content: {json.dumps(v["content"])}, avgPrice: {json.dumps(v["avgPrice"])}, '
            f'stockRateWeight: {json.dumps(v["stockRateWeight"])}, buyBoxRateWeight: {json.dumps(v["buyBoxRateWeight"])}, '
            f'avgPriceWeight: {json.dumps(v["avgPriceWeight"])}, avgPriceSum: {json.dumps(v["avgPriceSum"])}, '
            f'stockRateSum: {json.dumps(v["stockRateSum"])}, buyBoxRateSum: {json.dumps(v["buyBoxRateSum"])} }},'
        )
    out.append("};")
    out.append("")

    out.append("export const RETAILER_BIAS: Record<string, { sos: number; stock: number; rating: number; content: number }> = {")
    for company in companies:
        out.append(f'  {json.dumps(company + "::all")}: {{ sos: 0, stock: 0, rating: 0, content: 0 }},')
    for key, b in bias_by_key.items():
        out.append(f'  {json.dumps(key)}: {{ sos: {b["sos"]}, stock: {b["stock"]}, rating: {b["rating"]}, content: {b["content"]} }},')
    out.append("};")

    print("\n".join(out))

    # ── debug dump ────────────────────────────────────────────────────────
    debug = {"companies": companies, "per_company": debug_per_company}
    with open("build_debug.json", "w", encoding="utf-8") as f:
        json.dump(debug, f, indent=2, default=str)


if __name__ == "__main__":
    main()
