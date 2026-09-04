"""
Shelfline data-pipeline: Excel source -> app/src/data/mockData.ts static tables.

Reads the three tabs of the source workbook (Content / Price / Share Of Search),
cleans and normalizes them, derives every "real data" table the app consumes, and
prints the generated TypeScript for the static block of mockData.ts (retailers
through REAL_ROLLUP_WEEKLY, plus categories and keywordSet) to stdout.

Usage:
    python build_mock_data.py <path-to-xlsx> > generated_block.ts

Also writes a JSON debug dump (build_debug.json, next to the output) with every
intermediate table, for spot-checking derived numbers against the raw workbook
before the generated block is spliced into mockData.ts.

This script is the auditable record of exactly how the September 2022 crawl
(Content / Price / Share Of Search) was turned into the catalog and REAL_* tables
consumed by app/src/data/mockData.ts. Re-run it whenever the source workbook is
refreshed; the static block it prints is meant to be reviewed, then pasted in.
"""

import sys
import json
import re
from collections import defaultdict, Counter
from datetime import datetime, timedelta

import openpyxl

# ── retailer / category normalization ──────────────────────────────────────

SITE_TO_CODE = {
    "amazon.com": "r1",
    "chewy.com": "r2",
    "walmart.com": "r3",
    "homedepot.com": "r4",
    "petsmart.com": "r5",
    "lowes.com": "r6",
    "petco.com": "r7",
}

RETAILER_NAMES = {
    "r1": "Amazon.com",
    "r2": "Chewy",
    "r3": "Walmart",
    "r4": "The Home Depot",
    "r5": "PetSmart",
    "r6": "Lowe's",
    "r7": "Petco",
}

CATEGORY_NORMALIZE = {
    "PET": "GPC",
    "H&G": "HG",
    "GPC": "GPC",
    "HPC": "HPC",
    "HG": "HG",
}

CONTENT_WEEKS = ["2022-09-01", "2022-09-08", "2022-09-15", "2022-09-22", "2022-09-29"]
REAL_WEEK_LABELS = ["Sep 1", "Sep 8", "Sep 15", "Sep 22", "Sep 29"]
SOS_WEEKS = ["2022-09-08", "2022-09-15", "2022-09-22", "2022-09-29"]
REAL_SOS_WEEK_LABELS = ["Sep 8", "Sep 15", "Sep 22", "Sep 29"]

OOS_MARKERS = ("out of stock", "unavailable", "temporarily out")


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


def is_own_seller(seller, site_code_):
    """Home Depot & Lowe's buy-box-seller fields are store/location names, not
    real marketplace competitors (verified against the raw data) -- treat any
    seller on those two retailers as self."""
    if site_code_ in ("r4", "r6"):
        return True
    if not seller:
        return False
    ns = norm_seller(seller)
    site_name = norm_seller(RETAILER_NAMES[site_code_])
    site_domain = norm_seller([k for k, v in SITE_TO_CODE.items() if v == site_code_][0])
    return ns == site_name or ns == site_domain or site_name in ns or ns in site_name


def date_key(d):
    if isinstance(d, datetime):
        return d.strftime("%Y-%m-%d")
    return str(d)[:10]


def load_sheet(wb, name):
    ws = wb[name]
    headers = None
    rows = []
    for i, row in enumerate(ws.iter_rows(values_only=True)):
        if i == 0:
            headers = row
            continue
        rows.append(dict(zip(headers, row)))
    return rows


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


def main():
    path = sys.argv[1]
    wb = openpyxl.load_workbook(path, data_only=True, read_only=True)

    content_rows = load_sheet(wb, "Content")
    price_rows = load_sheet(wb, "Price")
    sos_rows = load_sheet(wb, "Share Of Search")

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
    excluded_price_only = sorted(product_keys_price - product_keys_content)

    def price_value(row):
        v = row.get("Current price")
        if v is None:
            v = row.get("List everyday price")
        return v

    def content_completeness(row):
        # 8 equally-weighted (12.5% each) pass/fail checks -- score is simply
        # (number passing / 8) * 100. Every check reads directly from a raw
        # crawled field (including per-bullet text/length, e.g. "Bullet 3",
        # "Bullet 3 length", and Rating -- fields the previous continuous
        # 0-100-per-component rubric never used).
        title = row.get("Title") or ""
        title_len = row.get("Title no of chars") or 0
        check_title = bool(title) and title_len <= 75

        n_images = row.get("No of images") or 0
        check_images = n_images >= 5

        n_bullets = row.get("No of bullets") or 0
        check_bullet_count = n_bullets >= 5

        bullets = [row.get(f"Bullet {i}") for i in range(1, 11)]
        bullets = [b for b in bullets if b]
        bullet_lengths = [row.get(f"Bullet {i} length") for i in range(1, 11) if row.get(f"Bullet {i}")]
        check_bullet_caps = bool(bullets) and all(b[:1].isupper() for b in bullets)
        check_bullet_length = bool(bullet_lengths) and all(
            bl is not None and 150 <= bl <= 200 for bl in bullet_lengths
        )

        desc = row.get("Product description") or ""
        desc_len = row.get("Description no of chars") or 0
        check_description = bool(desc) and 200 <= desc_len <= 2000

        rating = row.get("Rating")
        check_rating = rating is not None and rating >= 4.0

        enhanced = str(row.get("Enhanced content") or "").strip().lower() == "yes"
        check_enhanced = enhanced

        checks = {
            "title": check_title, "images": check_images, "bulletCount": check_bullet_count,
            "bulletCaps": check_bullet_caps, "bulletLength": check_bullet_length,
            "description": check_description, "rating": check_rating, "enhanced": check_enhanced,
        }
        score = int(sum(checks.values()) / len(checks) * 100 + 0.5)
        return score, checks

    # ── build catalog + REAL_PRODUCT_WEEKLY ─────────────────────────────────
    catalog = []
    real_product_weekly = {}
    component_bucket_totals = defaultdict(list)
    # pid -> (code, native_id) with native_id in its ORIGINAL type (int or
    # str, whatever the Excel cell held) -- pid itself is always a string
    # ("r6-1165507"), so re-deriving native_id by splitting that string would
    # silently coerce an int id to a str and break price_by_product lookups
    # (dict keys are typed tuples). Used by the REAL_ROLLUP_WEEKLY pooling
    # below to look back up each scope's raw daily rows correctly.
    pid_to_key = {}

    content_score_by_week = {}  # pid -> {week: score}
    # pre-fill (raw, with None gaps) rating/reviews series -- used only for
    # portfolio/retailer rollup averaging, so a product with no genuine
    # rating never drags the average toward 0. The 0-defaulted version below
    # is for that *product's own* chart series only, where a number is
    # required and 0 is the honest value for "never reviewed".
    raw_rating_by_product = {}

    for (code, native_id), weeks in content_by_product.items():
        latest_dk = max(weeks.keys())
        latest = weeks[latest_dk]
        pid = f"{code}-{native_id}"
        pid_to_key[pid] = (code, native_id)

        content_score, checks = content_completeness(latest)
        for b, v in checks.items():
            component_bucket_totals[b].append(v)
        content_checks_failed = [k for k, v in checks.items() if not v]

        week_scores = {}
        for wk in CONTENT_WEEKS:
            row = weeks.get(wk)
            if row is None:
                avail = sorted(weeks.keys())
                nearest = min(avail, key=lambda d: abs((datetime.fromisoformat(d) - datetime.fromisoformat(wk)).days))
                row = weeks[nearest]
            score, _ = content_completeness(row)
            week_scores[wk] = score
        content_score_by_week[pid] = week_scores

        # rating/reviews real weekly series straight from Content tab
        rating_series, reviews_series = [], []
        for wk in CONTENT_WEEKS:
            row = weeks.get(wk)
            if row is None:
                # carry nearest available week's value forward/back
                avail = sorted(weeks.keys())
                nearest = min(avail, key=lambda d: abs((datetime.fromisoformat(d) - datetime.fromisoformat(wk)).days))
                row = weeks[nearest]
            rating_series.append(row.get("Rating"))
            reviews_series.append(row.get("Total reviews"))
        raw_rating_by_product[pid] = list(rating_series)

        # price / stockRate / buyBoxRate weekly series bucketed from daily Price rows
        prows = price_by_product.get((code, native_id), [])
        price_series, stock_series, buybox_series = [], [], []
        # Last-Observation-Carried-Forward for weeks with no crawl rows at all
        # (a handful of products have gaps -- e.g. only Sep 1-2 + Sep 24-25) so
        # the real per-week series never contains a null/undefined point that
        # would break a trend chart. Defaults (100% in-stock, buy box held)
        # only apply before the first observed row.
        last_known_price, last_known_stock, last_known_buybox = None, 100.0, 100.0
        for wi, wk_start in enumerate(CONTENT_WEEKS):
            wk_end = CONTENT_WEEKS[wi + 1] if wi + 1 < len(CONTENT_WEEKS) else "2022-10-06"
            bucket = [r for r in prows if wk_start <= date_key(r.get("Crawl date")) < wk_end]
            if bucket:
                # only overwrite the carried-forward price on a genuinely
                # observed (non-null) value -- a bucket whose rows all have a
                # null price (e.g. went OOS mid-week with no price posted)
                # must not blank out a still-valid earlier price.
                non_null_in_bucket = [price_value(r) for r in bucket if price_value(r) is not None]
                if non_null_in_bucket:
                    last_known_price = non_null_in_bucket[-1]
                pv = last_known_price
                in_stock_flags = [is_in_stock(r.get("Stock status")) for r in bucket]
                in_stock_flags = [f for f in in_stock_flags if f is not None]
                if in_stock_flags:
                    last_known_stock = round(100.0 * sum(in_stock_flags) / len(in_stock_flags), 1)
                stock_rate = last_known_stock
                own_flags = [is_own_seller(r.get("Buy box seller"), code) for r in bucket]
                if own_flags:
                    last_known_buybox = round(100.0 * sum(own_flags) / len(own_flags))
                buybox_rate = last_known_buybox
            else:
                pv = last_known_price
                stock_rate = last_known_stock
                buybox_rate = last_known_buybox
            price_series.append(pv)
            stock_series.append(stock_rate)
            buybox_series.append(buybox_rate)

        real_product_weekly[pid] = {
            # rating/reviews: hard-default 0 only if literally never observed
            # (e.g. a brand-new listing with no reviews yet) -- an honest
            # value for that field, not a fabrication.
            "rating": fill_series(rating_series, hard_default=0),
            "reviews": fill_series(reviews_series, hard_default=0),
            # price: no honest single-series default exists (see the
            # retailer+category peer-average fallback applied to catalog
            # price below, which price_series is reconciled against there).
            "price": fill_series(price_series),
            "stockRate": fill_series(stock_series, hard_default=100.0),
            "buyBoxRate": fill_series(buybox_series, hard_default=100.0),
            # Real per-week Content Completeness score (the same 8-check
            # rubric, evaluated against that week's own Content-tab row) --
            # lets the client compute a genuine "score improved/declined
            # since Sep 1" without inventing a delta.
            "content": [week_scores[wk] for wk in CONTENT_WEEKS],
        }

        cat = CATEGORY_NORMALIZE.get(latest.get("Category name"), latest.get("Category name"))
        all_prices = [price_value(r) for r in prows if price_value(r) is not None]
        stock_flags_all = [f for f in (is_in_stock(r.get("Stock status")) for r in prows) if f is not None]
        buybox_flags_all = [is_own_seller(r.get("Buy box seller"), code) for r in prows]
        price_change_pct = None
        if len(all_prices) >= 2 and all_prices[0]:
            price_change_pct = round(((all_prices[-1] - all_prices[0]) / all_prices[0]) * 100, 1)

        # List/Current/Subscription price as distinct raw fields (Price tab
        # columns "List everyday price" / "Current price" / "Subscription
        # price"), from the most recent Price-tab row -- unlike `price`
        # above (which falls back List->Current and is what every other
        # feature in the app reads), these three are kept separate and
        # unfallback'd so a UI can show all three when they genuinely
        # differ, and null (not 0) when a field was never posted.
        latest_price_row = prows[-1] if prows else None
        list_price = latest_price_row.get("List everyday price") if latest_price_row else None
        current_price = latest_price_row.get("Current price") if latest_price_row else None
        subscription_price = latest_price_row.get("Subscription price") if latest_price_row else None
        # Three more raw Price-tab fields from that same latest row, rounding
        # out all 14 real Price-tab columns (excluding Crawl date) somewhere
        # in the model -- "Spb url" is a genuine direct link to the crawled
        # listing page; "Stock status" is the literal crawled availability
        # sentence (e.g. "Only 1 left in stock - order soon."), distinct from
        # the derived 3-bucket stockStatus every other feature reads; "Coupon
        # value" is the retailer's own posted discount, dollar amount and
        # percentage together (e.g. "4.22 (53%)"), exactly as crawled.
        spb_url = latest_price_row.get("Spb url") if latest_price_row else None
        stock_status_raw = latest_price_row.get("Stock status") if latest_price_row else None
        coupon_value = latest_price_row.get("Coupon value") if latest_price_row else None

        # Raw Content-tab fields (same "latest" row content_completeness()
        # already reads its checks from), surfaced individually so a UI can
        # show e.g. "Bullet Points: 7" rather than only the derived
        # pass/fail check -- these were previously computed and discarded.
        title_length = latest.get("Title no of chars") or 0
        image_count = latest.get("No of images") or 0
        bullet_count = latest.get("No of bullets") or 0
        description_length = latest.get("Description no of chars") or 0
        enhanced_content = str(latest.get("Enhanced content") or "").strip().lower() == "yes"
        # The real front-of-listing product photo, hotlinked straight from
        # the retailer's own CDN (e.g. images-na.ssl-images-amazon.com,
        # i5.walmartimages.com) -- present on all 585 Content-tab rows this
        # crawl. Lets the UI show the actual crawled photo instead of only
        # the initials-avatar fallback for SKUs with no local copy under
        # public/product-images/.
        image_url = latest.get("Front image") or None

        # Further raw Content-tab fields -- "relevant" here means real,
        # reasonably dense across the 117 SKUs, and semantically legible on
        # its own. Deliberately NOT included: Rank 1-4/Category 1-4 (their
        # relationship to the retailer's own taxonomy is ambiguous in the
        # source data and risks misrepresenting what the number means).
        retailer_id = latest.get("Retailer id")
        vendor_stock_no = latest.get("Vendor stock no")
        site_category = latest.get("Site category")
        buy_box_seller_raw = latest.get("Buy box seller")
        buy_box_shipper_raw = latest.get("Buy box shipper")
        video_count = latest.get("No of videos") or 0
        question_count = latest.get("No of questions") or 0
        has_360_image = bool(latest.get("Image 360"))
        has_ingredients = bool(latest.get("Ingredients list"))

        # The actual crawled text behind title_length/bullet_count/
        # description_length/has_ingredients above -- those stayed
        # measurements-only in the first pass; a UI wanting to show the real
        # copy (not just its length) needs these too.
        description_text = latest.get("Product description") or None
        bullets_text = [latest.get(f"Bullet {i}") for i in range(1, 11)]
        bullets_text = [b for b in bullets_text if b]
        ingredients_text = latest.get("Ingredients list") or None

        # 22 Varient label/value pairs -- observed to be the *other* pack-
        # size/color/style options the retailer lists alongside this SKU
        # (e.g. label "size", values "4.52 Lb" / "7.06 Oz" / "1 Oz" across
        # pairs 1-4 for one product), not a per-product attribute table.
        # 86 of 117 SKUs have none at all; kept as one aggregated list
        # (count + "label: value" strings) rather than 22 separate sparse
        # columns.
        variations = []
        for i in range(1, 23):
            v_label = latest.get(f"Varient label {i}")
            v_value = latest.get(f"Varient value {i}")
            if v_label or v_value:
                # A handful of source rows already have a trailing colon on
                # the label itself ("Size:") -- strip it so it isn't doubled.
                label_clean = str(v_label or "Variant").strip().rstrip(":")
                variations.append(f"{label_clean}: {v_value or 'n/a'}")

        catalog.append({
            "id": pid,
            "name": latest.get("Title"),
            "brand": latest.get("Brand"),
            "category": cat,
            "retailer": code,
            "rank": None,  # filled below
            "price": round(all_prices[-1], 2) if all_prices else None,
            # Average selling price across every observed daily row this
            # month -- used only for Price Index (product's own ASP divided
            # by its peer group's average ASP), never for the "current
            # price" shown on product cards/tables. Averaging each side of
            # that ratio over the same period avoids comparing one
            # product's stale end-of-month snapshot against peers' ASPs
            # (or vice versa), the same day-count-consistency principle as
            # REAL_ROLLUP_WEEKLY's pooling.
            "avgSellingPrice": round(sum(all_prices) / len(all_prices), 2) if all_prices else None,
            "rating": latest.get("Rating"),
            "reviews": latest.get("Total reviews"),
            "content": content_score,
            "stockBias": round(sum(stock_flags_all) / len(stock_flags_all), 2) if stock_flags_all else 1.0,
            "buyBoxRate": round(sum(buybox_flags_all) / len(buybox_flags_all), 2) if buybox_flags_all else 1.0,
            "priceChangePct": price_change_pct if price_change_pct is not None else 0.0,
            "priceGroup": f"{code}::{cat}",
            "listPrice": round(list_price, 2) if list_price is not None else None,
            "currentPrice": round(current_price, 2) if current_price is not None else None,
            "subscriptionPrice": round(subscription_price, 2) if subscription_price is not None else None,
            "spbUrl": spb_url,
            "stockStatusRaw": stock_status_raw,
            "couponValue": coupon_value,
            # Ids of the 8 real content checks (see content_completeness)
            # this product currently FAILS -- empty list means all 8 pass.
            "contentChecks": content_checks_failed,
            "titleLength": title_length,
            "imageUrl": image_url,
            "imageCount": image_count,
            "bulletCount": bullet_count,
            "descriptionLength": description_length,
            "enhancedContent": enhanced_content,
            "retailerId": retailer_id,
            "vendorStockNo": vendor_stock_no,
            "siteCategory": site_category,
            "buyBoxSeller": buy_box_seller_raw,
            "buyBoxShipper": buy_box_shipper_raw,
            "videoCount": video_count,
            "questionCount": question_count,
            "has360Image": has_360_image,
            "hasIngredients": has_ingredients,
            "descriptionText": description_text,
            "bulletsText": bullets_text,
            "ingredientsText": ingredients_text,
            "variations": variations,
        })

    # rank = position within (retailer, category) ordered by reviews desc
    groups = defaultdict(list)
    for p in catalog:
        groups[(p["retailer"], p["category"])].append(p)
    for key, plist in groups.items():
        plist.sort(key=lambda p: -(p["reviews"] or 0))
        for i, p in enumerate(plist):
            p["rank"] = i + 1

    catalog.sort(key=lambda p: (p["retailer"], p["category"], p["rank"]))

    # A handful of products were out-of-stock/unavailable for the entire
    # crawl month, so no price was ever observed (list AND current price both
    # null on every daily row). Fall back to the retailer+category peer
    # average -- computed only from products with a genuine observed price --
    # rather than writing a fabricated or zero price. Flagged explicitly here
    # and in the validation report.
    priceless_ids = [p["id"] for p in catalog if p["price"] is None]
    peer_avg = defaultdict(list)
    for p in catalog:
        if p["price"] is not None:
            peer_avg[p["priceGroup"]].append(p["price"])
    for p in catalog:
        if p["price"] is None:
            group_prices = peer_avg.get(p["priceGroup"])
            p["price"] = round(sum(group_prices) / len(group_prices), 2) if group_prices else None
            # Keep the per-week REAL series internally consistent with the
            # catalog price fallback above, rather than embedding nulls that
            # would show as chart gaps -- these SKUs were unavailable (no
            # price posted) for the entire crawl month.
            if p["price"] is not None and p["id"] in real_product_weekly:
                real_product_weekly[p["id"]]["price"] = [p["price"]] * 5
        if p["avgSellingPrice"] is None:
            # Same peer-average fallback, applied to ASP for the same reason.
            p["avgSellingPrice"] = p["price"]

    # ── REAL_ROLLUP_WEEKLY (portfolio + per retailer) ───────────────────────
    def avg(vals):
        vals = [v for v in vals if v is not None]
        return round(sum(vals) / len(vals), 2) if vals else None

    # stockRate/buyBoxRate are *rates over a day count that varies week to
    # week* (the final real week is only Sep 29-30, 2 days, vs. 7 for the
    # others; a handful of products also have date gaps). Averaging each
    # product's already-computed weekly percentage -- unweighted -- is only
    # correct within a single week (every product in a retailer shares that
    # week's day count). Combining *across* weeks (which the date-range
    # filter does) requires pooling the raw counts (sum in-stock rows / sum
    # total rows), never averaging the percentages themselves -- e.g. a week
    # with 8.41% over 119 rows and a week with 0% over 34 rows do not average
    # to their midpoint; they pool to 10 in-stock rows out of 153. Computed
    # directly from the raw daily Price rows (not from real_product_weekly's
    # per-product series, and not using LOCF-filled values) so the weekly
    # percentage AND the weight behind it both come from genuine observations
    # only. rating/content are unaffected -- every product contributes
    # exactly one real observation per week either way, so equal-weight
    # averaging is already correct for those two.
    # A handful of Petco SKUs are crawled for price/stock but were never
    # given a Content-tab row (no name/category/images -- see
    # excluded_price_only above), so they can't appear in the catalog or
    # feed content/rating. But they ARE genuine stock-status observations:
    # a manual filter of the raw Price tab naturally includes them, so
    # Availability/Buy Box pooling below includes them too (grouped by
    # retailer code) even though `ids`/`id_pairs` (content/rating's scope)
    # deliberately does not.
    price_only_by_code = defaultdict(list)
    for code, native_id in excluded_price_only:
        price_only_by_code[code].append((code, native_id))

    real_rollup_weekly = {}
    for scope in ["portfolio"] + list(RETAILER_NAMES.keys()):
        ids = [pid for pid in real_product_weekly if scope == "portfolio" or pid.startswith(scope + "-")]
        if not ids:
            continue
        id_pairs = [pid_to_key[pid] for pid in ids]
        stock_id_pairs = id_pairs + (
            [pair for pairs in price_only_by_code.values() for pair in pairs]
            if scope == "portfolio" else price_only_by_code[scope]
        )

        stockRate, buyBoxRate, stockWeight, buyBoxWeight, rating, content = [], [], [], [], [], []
        stockRateSum, buyBoxRateSum = [], []
        avgPrice, avgPriceWeight, avgPriceSum = [], [], []
        for wi, wk_start in enumerate(CONTENT_WEEKS):
            wk_end = CONTENT_WEEKS[wi + 1] if wi + 1 < len(CONTENT_WEEKS) else "2022-10-06"
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
                    # Buy Box Ownership's denominator is every tracked row
                    # (matching the "out of 900" framing of the metric --
                    # every observed listing-day is an opportunity), but the
                    # numerator only counts a row as "owned" when the
                    # listing was both in stock AND we held the buy box that
                    # day -- an out-of-stock day can never count as owned,
                    # since there's no buy box to hold while unavailable.
                    buybox_d += 1
                    buybox_n += 1 if (flag and is_own_seller(r.get("Buy box seller"), code)) else 0
                    # Average Price -- pooled the same way as stockRate/buyBoxRate
                    # above: every raw daily row (Current price, falling back to
                    # List everyday price) is one equally-weighted observation.
                    # Averaging each product's own average price first, THEN
                    # averaging those per-product numbers, is the same "average
                    # of averages" error as the original stockRate bug -- a
                    # product crawled on more days would be silently
                    # under/over-weighted relative to one crawled on fewer.
                    pv = price_value(r)
                    if pv is not None:
                        price_sum += pv
                        price_n += 1
            # weight 0 means "no genuine observation this week" -- excluded
            # from any pooled sum automatically, but the rate itself still
            # needs a number (TS type is number[], not (number|null)[]), so
            # carry the previous week's rate forward for display continuity
            # only, same convention as fill_series() elsewhere in this file.
            stockRate.append(round(100.0 * in_stock_n / total_n, 2) if total_n else (stockRate[-1] if stockRate else 100.0))
            stockWeight.append(total_n)
            stockRateSum.append(in_stock_n)
            buyBoxRate.append(round(100.0 * buybox_n / buybox_d, 2) if buybox_d else (buyBoxRate[-1] if buyBoxRate else 100.0))
            buyBoxWeight.append(buybox_d)
            buyBoxRateSum.append(buybox_n)
            rating.append(avg([raw_rating_by_product[i][wi] for i in ids if i in raw_rating_by_product]))
            avgPrice.append(round(price_sum / price_n, 2) if price_n else (avgPrice[-1] if avgPrice else 0.0))
            avgPriceWeight.append(price_n)
            # Raw (unrounded) dollar sum behind avgPrice this week -- pooling
            # multiple weeks from this (sum of sums / sum of counts) is exact,
            # unlike reconstructing from the already-rounded-to-cents avgPrice
            # above (round(a)*w_a + round(b)*w_b, pooled, can drift a cent
            # from the true flat average once the per-week roundings don't
            # cancel out). avgPrice itself is kept for single-week display
            # (the "4w" period and the weekly trend chart).
            avgPriceSum.append(round(price_sum, 4))
        for wi in range(5):
            wk = CONTENT_WEEKS[wi]
            content.append(avg([content_score_by_week[i][wk] for i in ids if i in content_score_by_week]))
        real_rollup_weekly[scope] = {
            "stockRate": stockRate, "buyBoxRate": buyBoxRate, "rating": rating, "content": content,
            "stockRateWeight": stockWeight, "buyBoxRateWeight": buyBoxWeight,
            # Raw (unrounded) in-stock/buy-box-owned counts behind stockRate/
            # buyBoxRate this week -- same reason avgPriceSum exists: pooling
            # multiple weeks by summing these raw counts (sum of sums / sum of
            # counts) is exact, unlike reconstructing from the already-
            # rounded-to-2-decimals stockRate/buyBoxRate above, which can
            # drift once the per-week roundings don't cancel out.
            "stockRateSum": stockRateSum, "buyBoxRateSum": buyBoxRateSum,
            "avgPrice": avgPrice, "avgPriceWeight": avgPriceWeight, "avgPriceSum": avgPriceSum,
        }

    # ── RETAILER_BIAS ────────────────────────────────────────────────────────
    portfolio_avg = {k: avg(real_rollup_weekly["portfolio"][k]) for k in ["stockRate", "buyBoxRate", "rating", "content"]}

    # ── REAL_SOS_WEEKLY: keyword-coverage % per site per week, + portfolio ──
    sos_by_site_week = defaultdict(lambda: defaultdict(list))  # site_code -> week -> [has_result bool per keyword row]
    keywords_seen = set()
    for r in sos_rows:
        code = site_code(r.get("site"))
        if not code:
            continue
        wk = date_key(r.get("Crawl_date"))
        if wk not in SOS_WEEKS:
            continue
        keywords_seen.add(r.get("keyword"))
        has_result = r.get("Url_1") is not None
        sos_by_site_week[code][wk].append(has_result)

    real_sos_weekly = {}
    for code in RETAILER_NAMES:
        series = []
        for wk in SOS_WEEKS:
            flags = sos_by_site_week.get(code, {}).get(wk, [])
            series.append(round(100.0 * sum(flags) / len(flags), 1) if flags else 0.0)
        real_sos_weekly[code] = series
    real_sos_weekly["portfolio"] = [
        round(sum(real_sos_weekly[c][wi] for c in RETAILER_NAMES) / len(RETAILER_NAMES), 1)
        for wi in range(4)
    ]

    bias = {}
    for code in RETAILER_NAMES:
        r_avg = {k: avg(real_rollup_weekly[code][k]) for k in ["stockRate", "buyBoxRate", "rating", "content"]} if code in real_rollup_weekly else {}
        sos_avg_r = avg(real_sos_weekly[code])
        sos_avg_p = avg(real_sos_weekly["portfolio"])
        bias[code] = {
            "sos": round((sos_avg_r or 0) - (sos_avg_p or 0), 1),
            "stock": round((r_avg.get("stockRate") or 0) - (portfolio_avg["stockRate"] or 0), 1),
            "rating": round((r_avg.get("rating") or 0) - (portfolio_avg["rating"] or 0), 2),
            "content": round((r_avg.get("content") or 0) - (portfolio_avg["content"] or 0), 1),
        }

    # ── REAL_BUYBOX_COMPETITOR ───────────────────────────────────────────────
    real_buybox_competitor = {}
    for (code, native_id), prows in price_by_product.items():
        if (code, native_id) not in content_by_product:
            continue
        if code in ("r4", "r6"):
            continue
        pid = f"{code}-{native_id}"
        # Only counts as a genuine loss on a day the listing was itself in
        # stock -- a 3P seller's name in the Buy Box Seller field while our
        # own listing was out of stock isn't a contested buy box we lost,
        # since there was no buy box on our (unavailable) listing that day.
        non_self = [
            str(r.get("Buy box seller")) for r in prows
            if r.get("Buy box seller") and not is_own_seller(r.get("Buy box seller"), code) and is_in_stock(r.get("Stock status"))
        ]
        if not non_self:
            continue
        top_seller, days_won = Counter(non_self).most_common(1)[0]
        real_buybox_competitor[pid] = {"seller": top_seller, "daysWon": days_won}

    # ── CROSS_RETAILER_MATCH ─────────────────────────────────────────────────
    by_brand = defaultdict(list)
    for p in catalog:
        if p["brand"]:
            by_brand[str(p["brand"]).strip().lower()].append(p)
    cross_retailer_match = defaultdict(dict)
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
                    cross_retailer_match[a["id"]][b["retailer"]] = b["id"]
                    cross_retailer_match[b["id"]][a["retailer"]] = a["id"]

    # ── keywordSet (real terms, illustrative volume/ownRank) ────────────────
    keyword_terms = sorted(keywords_seen)

    # ═══════════════════════════════════════════════════════════════════════
    # emit TypeScript
    # ═══════════════════════════════════════════════════════════════════════
    out = []
    out.append("export const retailers = [")
    out.append('  { id: "all", name: "All retailers" },')
    for code in RETAILER_NAMES:
        out.append(f'  {{ id: "{code}", name: "{RETAILER_NAMES[code]}" }},')
    out.append("];")
    out.append("")

    def ts_str(v):
        if v is None:
            return "null"
        return json.dumps(str(v))

    def ts_num(v, default=0):
        if v is None:
            return str(default)
        return json.dumps(v)

    def ts_num_or_null(v):
        # Unlike ts_num's default-substitution, a genuinely absent price
        # field (e.g. no subscription price was ever posted) must stay
        # null, not 0 -- 0 would read as "free", a fabricated value.
        if v is None:
            return "null"
        return json.dumps(v)

    def ts_bool(v):
        return "true" if v else "false"

    out.append("export const catalog = [")
    for p in catalog:
        out.append(
            "  { id: %s, name: %s, brand: %s, category: %s, retailer: %s, rank: %s, price: %s, avgSellingPrice: %s, rating: %s, reviews: %s, content: %s, stockBias: %s, buyBoxRate: %s, priceChangePct: %s, priceGroup: %s, listPrice: %s, currentPrice: %s, subscriptionPrice: %s, spbUrl: %s, stockStatusRaw: %s, couponValue: %s, contentChecks: %s, titleLength: %s, imageUrl: %s, imageCount: %s, bulletCount: %s, descriptionLength: %s, enhancedContent: %s, retailerId: %s, vendorStockNo: %s, siteCategory: %s, buyBoxSeller: %s, buyBoxShipper: %s, videoCount: %s, questionCount: %s, has360Image: %s, hasIngredients: %s, descriptionText: %s, bulletsText: %s, ingredientsText: %s, variations: %s },"
            % (
                ts_str(p["id"]), ts_str(p["name"]), ts_str(p["brand"]), ts_str(p["category"]), ts_str(p["retailer"]),
                ts_num(p["rank"], 1), ts_num(p["price"], 0), ts_num(p["avgSellingPrice"], p["price"] or 0),
                ts_num(p["rating"], 0), ts_num(p["reviews"], 0),
                ts_num(p["content"], 0), ts_num(p["stockBias"], 1.0), ts_num(p["buyBoxRate"], 1.0),
                ts_num(p["priceChangePct"], 0.0), ts_str(p["priceGroup"]),
                ts_num_or_null(p["listPrice"]), ts_num_or_null(p["currentPrice"]), ts_num_or_null(p["subscriptionPrice"]),
                ts_str(p["spbUrl"]), ts_str(p["stockStatusRaw"]), ts_str(p["couponValue"]),
                json.dumps(p["contentChecks"]),
                ts_num(p["titleLength"], 0), ts_str(p["imageUrl"]), ts_num(p["imageCount"], 0), ts_num(p["bulletCount"], 0),
                ts_num(p["descriptionLength"], 0), ts_bool(p["enhancedContent"]),
                ts_str(p["retailerId"]), ts_str(p["vendorStockNo"]), ts_str(p["siteCategory"]),
                ts_str(p["buyBoxSeller"]), ts_str(p["buyBoxShipper"]),
                ts_num(p["videoCount"], 0), ts_num(p["questionCount"], 0),
                ts_bool(p["has360Image"]), ts_bool(p["hasIngredients"]),
                ts_str(p["descriptionText"]), json.dumps(p["bulletsText"]), ts_str(p["ingredientsText"]),
                json.dumps(p["variations"]),
            )
        )
    out.append("];")
    out.append("")

    out.append("export const categories = " + json.dumps(["GPC", "HPC", "HG"]) + ";")
    out.append("")

    out.append("export const keywordSet = [")
    for i, term in enumerate(keyword_terms, 1):
        out.append(f'  {{ id: "k{i}", term: {json.dumps(term)}, volume: 0, ownRank: 0 }}, // volume/ownRank illustrative -- no traffic data in source')
    out.append("];")
    out.append("")

    out.append(f"export const REAL_WEEK_LABELS = {json.dumps(REAL_WEEK_LABELS)};")
    out.append(f"export const REAL_SOS_WEEK_LABELS = {json.dumps(REAL_SOS_WEEK_LABELS)};")
    out.append("")

    out.append("export const REAL_PRODUCT_WEEKLY: Record<string, {")
    out.append("  rating: number[]; reviews: number[]; price: number[]; stockRate: number[]; buyBoxRate: number[]; content: number[];")
    out.append("}> = {")
    for pid, v in real_product_weekly.items():
        out.append(f'  {json.dumps(pid)}: {{ rating: {json.dumps(v["rating"])}, reviews: {json.dumps(v["reviews"])}, price: {json.dumps(v["price"])}, stockRate: {json.dumps(v["stockRate"])}, buyBoxRate: {json.dumps(v["buyBoxRate"])}, content: {json.dumps(v["content"])} }},')
    out.append("};")
    out.append("")

    out.append("export const REAL_SOS_WEEKLY: Record<string, number[]> = {")
    for k, v in real_sos_weekly.items():
        out.append(f"  {json.dumps(k)}: {json.dumps(v)},")
    out.append("};")
    out.append("")

    out.append("export const REAL_BUYBOX_COMPETITOR: Record<string, { seller: string; daysWon: number }> = {")
    for pid, v in real_buybox_competitor.items():
        out.append(f'  {json.dumps(pid)}: {{ seller: {json.dumps(v["seller"])}, daysWon: {v["daysWon"]} }},')
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
    out.append("  /* raw daily-row counts behind stockRate/buyBoxRate/avgPrice that week --")
    out.append("     pool (sum numerator / sum denominator), never average, when combining")
    out.append("     multiple weeks (e.g. for a custom date range); see the comment above")
    out.append("     this table's construction in build_mock_data.py for why. avgPriceSum is")
    out.append("     the raw (unrounded) dollar total behind avgPrice that week -- pool")
    out.append("     avgPriceSum/avgPriceWeight across weeks for an exact result; pooling the")
    out.append("     already-rounded-to-cents avgPrice instead can drift a cent from the true")
    out.append("     flat average once per-week roundings don't cancel out. */")
    out.append("  stockRateWeight: number[]; buyBoxRateWeight: number[]; avgPriceWeight: number[]; avgPriceSum: number[];")
    out.append("  /* Raw (unrounded) in-stock/buy-box-owned counts behind stockRate/")
    out.append("     buyBoxRate that week -- same reasoning as avgPriceSum above: pool")
    out.append("     stockRateSum/stockRateWeight (or buyBoxRateSum/buyBoxRateWeight) across")
    out.append("     weeks for an exact rate, never reconstruct from the already-rounded")
    out.append("     stockRate/buyBoxRate percentages. */")
    out.append("  stockRateSum: number[]; buyBoxRateSum: number[];")
    out.append("}> = {")
    for scope, v in real_rollup_weekly.items():
        out.append(
            f'  {json.dumps(scope)}: {{ stockRate: {json.dumps(v["stockRate"])}, buyBoxRate: {json.dumps(v["buyBoxRate"])}, '
            f'rating: {json.dumps(v["rating"])}, content: {json.dumps(v["content"])}, avgPrice: {json.dumps(v["avgPrice"])}, '
            f'stockRateWeight: {json.dumps(v["stockRateWeight"])}, buyBoxRateWeight: {json.dumps(v["buyBoxRateWeight"])}, '
            f'avgPriceWeight: {json.dumps(v["avgPriceWeight"])}, avgPriceSum: {json.dumps(v["avgPriceSum"])}, '
            f'stockRateSum: {json.dumps(v["stockRateSum"])}, buyBoxRateSum: {json.dumps(v["buyBoxRateSum"])} }},'
        )
    out.append("};")
    out.append("")

    out.append("const RETAILER_BIAS: Record<string, { sos: number; stock: number; rating: number; content: number }> = {")
    out.append('  all: { sos: 0, stock: 0, rating: 0, content: 0 },')
    for code, b in bias.items():
        out.append(f'  {json.dumps(code)}: {{ sos: {b["sos"]}, stock: {b["stock"]}, rating: {b["rating"]}, content: {b["content"]} }}, // {RETAILER_NAMES[code]}')
    out.append("};")

    print("\n".join(out))

    # ── debug dump ────────────────────────────────────────────────────────
    debug = {
        "counts": {
            "content_products": len(content_by_product),
            "price_products": len(price_by_product),
            "catalog_size": len(catalog),
            "price_only_excluded": [f"{c}-{n}" for c, n in excluded_price_only],
        },
        "component_bucket_averages": {b: avg(v) for b, v in component_bucket_totals.items()},
        "sample_catalog_rows": catalog[:10],
        "real_rollup_weekly": real_rollup_weekly,
        "real_sos_weekly": real_sos_weekly,
        "bias": bias,
        "buybox_competitor_count": len(real_buybox_competitor),
        "cross_retailer_match_count": len(cross_retailer_match),
        "keyword_terms": keyword_terms,
        "priceless_ids_using_peer_avg_fallback": priceless_ids,
        "still_null_after_fallback": [p["id"] for p in catalog if p["price"] is None],
    }
    with open("build_debug.json", "w", encoding="utf-8") as f:
        json.dump(debug, f, indent=2, default=str)


if __name__ == "__main__":
    main()
