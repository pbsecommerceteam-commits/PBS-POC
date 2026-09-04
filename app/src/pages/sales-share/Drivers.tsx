import { useNavigate, useOutletContext } from "react-router-dom";
import { Card } from "../../components/ui/Card";
import { useUi } from "../../context/UiContext";
import { catalog, retailers, CROSS_RETAILER_MATCH } from "../../data/mockData";
import type { Product } from "../../models/types";
import type { SalesShareContext } from "./Layout";

const avg = (vals: number[]) => vals.length ? vals.reduce((a, v) => a + v, 0) / vals.length : null;

/* The real crawled "Coupon value" field comes in two genuinely different
   shapes depending on retailer -- Amazon posts a computed dollar amount
   plus percentage ("4.22 (53%)"), Petco posts a bare percentage with no
   dollar breakdown ("35", meaning "35% off", confirmed against the raw
   Price tab -- the number doesn't match any (list-current)/list
   calculation, so it's a real, separate coupon percentage, not a dollar
   figure). Parsed rather than guessed at so "Average Coupon Value" only
   ever averages SKUs that actually posted a dollar figure. */
function parseCoupon(raw: string): { dollar: number | null; pct: number | null } | null {
  const withDollar = raw.match(/^([\d.]+)\s*\(([\d.]+)%\)$/);
  if (withDollar) return { dollar: parseFloat(withDollar[1]), pct: parseFloat(withDollar[2]) };
  const pctOnly = raw.match(/^([\d.]+)%?$/);
  if (pctOnly) return { dollar: null, pct: parseFloat(pctOnly[1]) };
  return null;
}

const retailerName = (id: string) => retailers.find((r) => r.id === id)?.name ?? id;

/* Genuine cross-retailer product matches (same brand, >=45% name overlap,
   see CROSS_RETAILER_MATCH in mockData.ts). Deliberately one-hop only --
   each anchor id's own declared matches (exactly the same lookup
   ProductDetail's retailerPerformance already uses) -- rather than
   transitively chaining through other products' unrelated matches, which
   can silently conflate two different near-duplicate SKUs that each
   happen to fuzzy-match the same third listing. Reads the full catalog
   rather than the page-scoped sd.products -- a "same product, different
   retailer" comparison is meaningless once narrowed to a single retailer,
   so this ignores the retailer filter by design (still honors the
   category filter below). Clusters are deduped by their member-id set so
   a symmetric pair (A matches B, B matches A) is only reported once. */
function buildRetailerPriceSpread(categoryFilter: string) {
  const catalogById = new Map(catalog.map((c) => [c.id, c] as const));
  const seen = new Set<string>();
  const results: Array<{ name: string; lowest: number; lowestRetailer: string; lowestId: string; highest: number; highestRetailer: string }> = [];

  Object.entries(CROSS_RETAILER_MATCH).forEach(([anchorId, matches]) => {
    const memberIds = Array.from(new Set([anchorId, ...Object.values(matches)]));
    const dedupeKey = memberIds.slice().sort().join(",");
    if (seen.has(dedupeKey)) return;
    seen.add(dedupeKey);

    const items = memberIds.map((id) => catalogById.get(id)).filter((it): it is NonNullable<typeof it> => !!it);
    const scoped = categoryFilter ? items.filter((it) => it.category === categoryFilter) : items;
    const priced = scoped
      .map((it) => ({ item: it, eff: it.currentPrice ?? it.price }))
      .filter((x) => x.eff != null && x.eff > 0) as Array<{ item: (typeof catalog)[number]; eff: number }>;
    if (priced.length < 2) return;
    const lowest = priced.reduce((a, b) => (b.eff < a.eff ? b : a));
    const highest = priced.reduce((a, b) => (b.eff > a.eff ? b : a));
    if (lowest.item.id === highest.item.id) return;
    results.push({
      name: scoped[0].name,
      lowest: lowest.eff, lowestRetailer: retailerName(lowest.item.retailer), lowestId: lowest.item.id,
      highest: highest.eff, highestRetailer: retailerName(highest.item.retailer),
    });
  });

  return results
    .map((r) => ({ ...r, spreadPct: ((r.highest - r.lowest) / r.lowest) * 100 }))
    .sort((a, b) => b.spreadPct - a.spreadPct);
}

export default function SalesShareDrivers() {
  const { sd, categoryFilter, setCategoryFilter } = useOutletContext<SalesShareContext>();
  const { toast } = useUi();
  const navigate = useNavigate();

  /* Discount % / $ = List Price vs. Effective Price (Current Price, falling
     back to the snapshot price the same way every other pricing feature
     does), only over SKUs that actually posted a list price. */
  const withList = (sd.products as Product[]).filter((p) => p.listPrice != null && p.listPrice > 0);
  const discounts = withList.map((p) => {
    const eff = p.currentPrice ?? p.price;
    const dollarOff = p.listPrice! - eff;
    return { p, eff, dollarOff, pctOff: (dollarOff / p.listPrice!) * 100 };
  });
  const avgDiscountPct = avg(discounts.map((d) => d.pctOff));
  const avgDiscountDollar = avg(discounts.map((d) => d.dollarOff));

  /* Real Price-tab "Subscription price" -- savings measured against each
     SKU's own current price, only over SKUs that actually posted a
     subscription price. */
  const withSub = (sd.products as Product[]).filter((p) => p.subscriptionPrice != null);
  const subSavings = withSub.map((p) => {
    const eff = p.currentPrice ?? p.price;
    const dollarSaved = eff - p.subscriptionPrice!;
    return { dollarSaved, pctSaved: eff > 0 ? (dollarSaved / eff) * 100 : 0 };
  });
  const avgSubPrice = avg(withSub.map((p) => p.subscriptionPrice!));
  const avgSubSavingsDollar = avg(subSavings.map((s) => s.dollarSaved));
  const avgSubSavingsPct = avg(subSavings.map((s) => s.pctSaved));

  /* Real Price-tab "Coupon value" -- see parseCoupon() above for why
     dollar and percentage are tracked separately rather than assumed
     present together. "Highest coupon" and the products behind it are by
     percentage (the only figure every real coupon entry actually has). */
  const coupons = (sd.products as Product[])
    .map((p) => ({ p, parsed: p.couponValue ? parseCoupon(p.couponValue) : null }))
    .filter((c): c is { p: Product; parsed: { dollar: number | null; pct: number | null } } => !!c.parsed && c.parsed.pct != null);
  const withCouponDollar = coupons.filter((c) => c.parsed.dollar != null);
  const avgCouponDollar = avg(withCouponDollar.map((c) => c.parsed.dollar!));
  const avgCouponPct = avg(coupons.map((c) => c.parsed.pct!));
  const maxCouponPct = coupons.length ? Math.max(...coupons.map((c) => c.parsed.pct!)) : null;
  const topCoupons = maxCouponPct != null ? coupons.filter((c) => c.parsed.pct === maxCouponPct) : [];

  const priceSpread = buildRetailerPriceSpread(categoryFilter).slice(0, 8);

  const largestDiscounts = discounts
    .filter((d) => d.pctOff > 0)
    .sort((a, b) => b.pctOff - a.pctOff)
    .slice(0, 8);

  /* Category-level average list/current price -- distinct from Summary's
     per-product "Largest Price Gap" list (this is a category-level
     aggregate) and from the Price-Index-points framing this section used
     before it was repointed to a discount framing. */
  const categoryIds = Array.from(new Set((sd.products as Product[]).map((p) => p.category)));
  const categoryDiscounts = categoryIds
    .map((cat) => {
      const prods = (sd.products as Product[]).filter((p) => p.category === cat && p.listPrice != null && p.listPrice! > 0);
      const avgList = avg(prods.map((p) => p.listPrice!));
      const avgCurrent = avg(prods.map((p) => p.currentPrice ?? p.price));
      const discountPct = avgList != null && avgCurrent != null ? ((avgList - avgCurrent) / avgList) * 100 : null;
      return { category: cat, avgList, avgCurrent, discountPct, skus: prods.length };
    })
    .filter((c): c is { category: string; avgList: number; avgCurrent: number; discountPct: number; skus: number } => c.discountPct != null);
  const highestDiscountCats = categoryDiscounts.slice().sort((a, b) => b.discountPct - a.discountPct).slice(0, 3);
  const lowestDiscountCats = categoryDiscounts.slice().sort((a, b) => a.discountPct - b.discountPct).slice(0, 3);

  return (
    <>
      <Card padding="20px 22px">
        <div style={{ marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Discount &amp; Savings Overview</h3>
          <div className="sl-muted" style={{ fontSize: 12.5, marginTop: 2 }}>Real Price-tab fields — no repeats of the KPIs already shown on Summary</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,160px),1fr))", gap: 16 }}>
          <div>
            <div className="sl-muted" style={{ fontSize: 12.5 }}>Average Discount %</div>
            <div style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 24, marginTop: 4, color: avgDiscountPct != null && avgDiscountPct > 0 ? "var(--status-positive-fg)" : "inherit" }}>{avgDiscountPct != null ? avgDiscountPct.toFixed(1) + "%" : "—"}</div>
            <div className="sl-faint" style={{ fontSize: 11.5, marginTop: 4 }}>vs. List Price, {withList.length} of {sd.products.length} SKUs</div>
          </div>
          <div>
            <div className="sl-muted" style={{ fontSize: 12.5 }}>Average Discount $</div>
            <div style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 24, marginTop: 4, color: avgDiscountDollar != null && avgDiscountDollar > 0 ? "var(--status-positive-fg)" : "inherit" }}>{avgDiscountDollar != null ? "$" + avgDiscountDollar.toFixed(2) : "—"}</div>
            <div className="sl-faint" style={{ fontSize: 11.5, marginTop: 4 }}>vs. List Price</div>
          </div>
          <div>
            <div className="sl-muted" style={{ fontSize: 12.5 }}>Subscription Savings %</div>
            <div style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 24, marginTop: 4, color: avgSubSavingsPct != null && avgSubSavingsPct > 0 ? "var(--status-positive-fg)" : "inherit" }}>{avgSubSavingsPct != null ? avgSubSavingsPct.toFixed(1) + "%" : "—"}</div>
            <div className="sl-faint" style={{ fontSize: 11.5, marginTop: 4 }}>Subscription vs. Current Price, {withSub.length} SKUs</div>
          </div>
          <div>
            <div className="sl-muted" style={{ fontSize: 12.5 }}>Coupon Savings %</div>
            <div style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 24, marginTop: 4, color: avgCouponPct != null && avgCouponPct > 0 ? "var(--status-positive-fg)" : "inherit" }}>{avgCouponPct != null ? avgCouponPct.toFixed(1) + "%" : "—"}</div>
            <div className="sl-faint" style={{ fontSize: 11.5, marginTop: 4 }}>Coupon-enabled products, {coupons.length} SKUs</div>
          </div>
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,380px),1fr))", gap: "var(--app-gap)" }}>
        <Card padding="20px 22px">
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Subscription Price Analysis</h3>
          <div className="sl-muted" style={{ fontSize: 12.5, marginTop: 2, marginBottom: 16 }}>Real Price-tab "Subscription price" vs. each SKU's own current price</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 16 }}>
            <div>
              <div className="sl-muted" style={{ fontSize: 12.5 }}>Average Subscription Price</div>
              <div style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 24, marginTop: 4 }}>{avgSubPrice != null ? "$" + avgSubPrice.toFixed(2) : "—"}</div>
              <div className="sl-faint" style={{ fontSize: 11.5, marginTop: 4 }}>{withSub.length} of {sd.products.length} SKUs</div>
            </div>
            <div>
              <div className="sl-muted" style={{ fontSize: 12.5 }}>Average Subscription Savings $</div>
              <div style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 24, marginTop: 4, color: avgSubSavingsDollar != null && avgSubSavingsDollar > 0 ? "var(--status-positive-fg)" : "inherit" }}>{avgSubSavingsDollar != null ? "$" + avgSubSavingsDollar.toFixed(2) : "—"}</div>
              <div className="sl-faint" style={{ fontSize: 11.5, marginTop: 4 }}>vs. current price</div>
            </div>
            <div>
              <div className="sl-muted" style={{ fontSize: 12.5 }}>Average Subscription Savings %</div>
              <div style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 24, marginTop: 4, color: avgSubSavingsPct != null && avgSubSavingsPct > 0 ? "var(--status-positive-fg)" : "inherit" }}>{avgSubSavingsPct != null ? avgSubSavingsPct.toFixed(1) + "%" : "—"}</div>
              <div className="sl-faint" style={{ fontSize: 11.5, marginTop: 4 }}>vs. current price</div>
            </div>
          </div>
        </Card>
        <Card padding="20px 22px">
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Coupon Price Impact</h3>
          <div className="sl-muted" style={{ fontSize: 12.5, marginTop: 2, marginBottom: 16 }}>Real Price-tab "Coupon value" -- exactly as posted by each retailer</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 16 }}>
            <div>
              <div className="sl-muted" style={{ fontSize: 12.5 }}>Average Coupon Value</div>
              <div style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 24, marginTop: 4 }}>{avgCouponDollar != null ? "$" + avgCouponDollar.toFixed(2) : "—"}</div>
              <div className="sl-faint" style={{ fontSize: 11.5, marginTop: 4 }}>{withCouponDollar.length} SKUs posted a dollar amount</div>
            </div>
            <div>
              <div className="sl-muted" style={{ fontSize: 12.5 }}>Average Coupon %</div>
              <div style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 24, marginTop: 4 }}>{avgCouponPct != null ? avgCouponPct.toFixed(1) + "%" : "—"}</div>
              <div className="sl-faint" style={{ fontSize: 11.5, marginTop: 4 }}>{coupons.length} of {sd.products.length} SKUs carry a coupon</div>
            </div>
            <div>
              <div className="sl-muted" style={{ fontSize: 12.5 }}>Highest Coupon</div>
              <div style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 24, marginTop: 4 }}>{maxCouponPct != null ? maxCouponPct.toFixed(0) + "%" : "—"}</div>
              <div className="sl-faint" style={{ fontSize: 11.5, marginTop: 4 }}>{topCoupons.length ? topCoupons.length + " SKU" + (topCoupons.length > 1 ? "s" : "") + " tied" : "No coupons in scope"}</div>
            </div>
          </div>
          {topCoupons.length > 0 && (
            <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--border-subtle)" }}>
              <div className="sl-muted" style={{ fontSize: 12.5, marginBottom: 8 }}>Products with highest coupon value</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {topCoupons.map(({ p }) => (
                  <button key={p.id} className="sl-palette__row" onClick={() => navigate("/product/" + p.id)} style={{ justifyContent: "space-between" }}>
                    <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 12.5 }}>{p.name}</span>
                    <span className="sl-muted" style={{ flex: "none", fontSize: 11.5 }}>{p.retailerName}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      <Card padding="20px 22px">
        <div style={{ marginBottom: 14 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Retailer Price Spread</h3>
          <div className="sl-muted" style={{ fontSize: 12.5, marginTop: 2 }}>Same product compared across every retailer it's genuinely matched at — ignores the retailer filter by design</div>
        </div>
        {priceSpread.length === 0 ? (
          <div className="sl-muted" style={{ fontSize: 12.5 }}>No cross-retailer matched products in scope.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="sl-table">
              <thead><tr>
                <th style={{ textAlign: "left" }}>Product</th>
                <th style={{ textAlign: "right" }}>Lowest</th>
                <th style={{ textAlign: "right" }}>Highest</th>
                <th style={{ textAlign: "right" }}>Price Spread</th>
              </tr></thead>
              <tbody>
                {priceSpread.map((r) => (
                  <tr className="sl-row is-clickable" key={r.name + r.lowestId} onClick={() => navigate("/product/" + r.lowestId)}>
                    <td><div className="sl-table-name">{r.name}</div></td>
                    <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>${r.lowest.toFixed(2)} <span className="sl-faint">({r.lowestRetailer})</span></td>
                    <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>${r.highest.toFixed(2)} <span className="sl-faint">({r.highestRetailer})</span></td>
                    <td style={{ textAlign: "right", fontWeight: 600, color: "var(--status-positive-fg)" }}>{r.spreadPct.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card padding="20px 22px">
        <div style={{ marginBottom: 14 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Largest Discounted Products</h3>
          <div className="sl-muted" style={{ fontSize: 12.5, marginTop: 2 }}>Products with the largest markdown from List Price in scope</div>
        </div>
        {largestDiscounts.length === 0 ? (
          <div className="sl-muted" style={{ fontSize: 12.5 }}>No discounted products in scope.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="sl-table">
              <thead><tr>
                <th style={{ textAlign: "left" }}>Product</th>
                <th style={{ textAlign: "right" }}>List Price</th>
                <th style={{ textAlign: "right" }}>Current Price</th>
                <th style={{ textAlign: "right" }}>Discount</th>
              </tr></thead>
              <tbody>
                {largestDiscounts.map(({ p, eff, pctOff }) => (
                  <tr className="sl-row is-clickable" key={p.id} onClick={() => navigate("/product/" + p.id)}>
                    <td><div className="sl-table-name">{p.name}</div></td>
                    <td style={{ textAlign: "right" }}>${p.listPrice!.toFixed(2)}</td>
                    <td style={{ textAlign: "right" }}>${eff.toFixed(2)}</td>
                    <td style={{ textAlign: "right", fontWeight: 600, color: "var(--status-positive-fg)" }}>{pctOff.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,380px),1fr))", gap: "var(--app-gap)" }}>
        <Card padding="20px 22px">
          <div style={{ marginBottom: 14 }}><h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Categories with Highest Price Discounts</h3><div className="sl-muted" style={{ fontSize: 12.5, marginTop: 2 }}>Average discount from List Price, by category</div></div>
          {highestDiscountCats.length === 0 ? (
            <div className="sl-muted" style={{ fontSize: 12.5 }}>No category discount data in scope.</div>
          ) : (
            <table className="sl-table">
              <thead><tr>
                <th style={{ textAlign: "left" }}>Category</th>
                <th style={{ textAlign: "right" }}>Avg List Price</th>
                <th style={{ textAlign: "right" }}>Avg Current Price</th>
                <th style={{ textAlign: "right" }}>Discount</th>
              </tr></thead>
              <tbody>
                {highestDiscountCats.map((c) => (
                  <tr className={"sl-row is-clickable" + (categoryFilter === c.category ? " is-selected" : "")} key={c.category} onClick={() => { const sel = categoryFilter === c.category; setCategoryFilter(sel ? "" : c.category); toast(sel ? "Category filter cleared." : c.category + " — Pricing Intelligence."); }}>
                    <td><div className="sl-table-name">{c.category}</div></td>
                    <td style={{ textAlign: "right" }}>${c.avgList.toFixed(2)}</td>
                    <td style={{ textAlign: "right" }}>${c.avgCurrent.toFixed(2)}</td>
                    <td style={{ textAlign: "right", fontWeight: 600, color: "var(--status-positive-fg)" }}>{c.discountPct.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
        <Card padding="20px 22px">
          <div style={{ marginBottom: 14 }}><h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Categories with Lowest Price Discounts</h3><div className="sl-muted" style={{ fontSize: 12.5, marginTop: 2 }}>Average discount from List Price, by category</div></div>
          {lowestDiscountCats.length === 0 ? (
            <div className="sl-muted" style={{ fontSize: 12.5 }}>No category discount data in scope.</div>
          ) : (
            <table className="sl-table">
              <thead><tr>
                <th style={{ textAlign: "left" }}>Category</th>
                <th style={{ textAlign: "right" }}>Avg List Price</th>
                <th style={{ textAlign: "right" }}>Avg Current Price</th>
                <th style={{ textAlign: "right" }}>Discount</th>
              </tr></thead>
              <tbody>
                {lowestDiscountCats.map((c) => (
                  <tr className={"sl-row is-clickable" + (categoryFilter === c.category ? " is-selected" : "")} key={c.category} onClick={() => { const sel = categoryFilter === c.category; setCategoryFilter(sel ? "" : c.category); toast(sel ? "Category filter cleared." : c.category + " — Pricing Intelligence."); }}>
                    <td><div className="sl-table-name">{c.category}</div></td>
                    <td style={{ textAlign: "right" }}>${c.avgList.toFixed(2)}</td>
                    <td style={{ textAlign: "right" }}>${c.avgCurrent.toFixed(2)}</td>
                    <td style={{ textAlign: "right", fontWeight: 600, color: "var(--status-negative-fg)" }}>{c.discountPct.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </>
  );
}
