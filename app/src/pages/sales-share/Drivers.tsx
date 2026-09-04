import { useNavigate, useOutletContext } from "react-router-dom";
import { Card } from "../../components/ui/Card";
import { AiInsightBanner } from "../../components/ui/AiInsightBanner";
import { useUi } from "../../context/UiContext";
import { delta, deltaColor } from "../../lib/format";
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

export default function SalesShareDrivers() {
  const { sd, sh, setCategoryFilter } = useOutletContext<SalesShareContext>();
  const { toast } = useUi();
  const navigate = useNavigate();

  /* Price Index (real, per-product priceIndex averaged per category) minus
     100 -- how far each category sits above/below its own historical
     average price, distinct from Summary's per-product "Largest Price Gap"
     list (this is a category-level aggregate) and from the search-visibility
     framing this section used before Pricing Intelligence took over the tab. */
  const byIndex = sh.categories.map((c: any) => ({ ...c, pricePts: Math.round((c.priceIndex - 100) * 10) / 10 })).sort((a: any, b: any) => b.pricePts - a.pricePts);
  const above = byIndex.filter((c: any) => c.pricePts > 0).slice(0, 3);
  const below = byIndex.filter((c: any) => c.pricePts < 0).slice(-3).reverse();
  const maxAbs = Math.max(...byIndex.map((c: any) => Math.abs(c.pricePts)), 1);

  /* Real Price-tab "Subscription price" -- savings measured against each
     SKU's own current price (falling back to the snapshot price the same
     way every other pricing feature does), only over SKUs that actually
     posted a subscription price. */
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

  return (
    <>
      <Card padding="20px 22px">
        <div style={{ marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Pricing Drivers</h3>
          <div className="sl-muted" style={{ fontSize: 12.5, marginTop: 2 }}>Pricing-only signals — no repeats of the KPIs already shown on Summary</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,150px),1fr))", gap: "16px 22px", alignItems: "start" }}>
          {sd.signals.map((s: any) => (
            <div key={s.label} style={{ minWidth: 0 }}>
              <div className="sl-eyebrow">{s.label}</div>
              <div style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 22, lineHeight: 1.1, marginTop: 5 }}>{s.value}</div>
              <div style={{ fontSize: 12, color: deltaColor(s.delta) }}>{delta(s.delta, s.unit)}</div>
            </div>
          ))}
        </div>
      </Card>

      <AiInsightBanner
        action={
          <button className="btn btn-ai" onClick={() => { navigate("/sales-share/products"); toast("Pricing Intelligence filtered to " + sd.diagnosis.actionLabel.replace(/^Review /i, "").toLowerCase() + "."); }} style={{ alignSelf: "flex-start", minHeight: 32, whiteSpace: "nowrap" }}>
            {sd.diagnosis.actionLabel} →
          </button>
        }
      >
        <strong style={{ fontWeight: 600 }}>{sd.diagnosis.headline}.</strong> {sd.diagnosis.text}
      </AiInsightBanner>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,380px),1fr))", gap: "var(--app-gap)" }}>
        <Card padding="20px 22px">
          <div style={{ marginBottom: 16 }}><h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Categories priced above their average</h3><div className="sl-muted" style={{ fontSize: 12.5, marginTop: 2 }}>Price Index vs. each category's own historical average price</div></div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {above.length === 0 && <div className="sl-muted" style={{ fontSize: 12.5 }}>No category is priced above its own average this period.</div>}
            {above.map((c: any) => (
              <button key={c.category} className="sl-palette__row" onClick={() => { setCategoryFilter(c.category); toast("Products filtered to " + c.category + "."); }} style={{ flexDirection: "column", alignItems: "stretch", gap: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
                  <span style={{ fontSize: 14 }}>{c.category}</span>
                  <span style={{ fontWeight: 600, fontSize: 15, color: "var(--status-positive-fg)" }}>{delta(c.pricePts, " pts")}</span>
                </div>
                <div className="sl-progress-track"><span className="sl-progress-fill" style={{ width: Math.min(100, (Math.abs(c.pricePts) / maxAbs) * 100).toFixed(1) + "%", background: "var(--color-accent-700)" }}></span></div>
                <div className="sl-muted" style={{ fontSize: 11.5 }}>Price Index {c.priceIndex.toFixed(0)} · {c.skus} SKUs</div>
              </button>
            ))}
          </div>
        </Card>
        <Card padding="20px 22px">
          <div style={{ marginBottom: 16 }}><h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Categories priced below their average</h3><div className="sl-muted" style={{ fontSize: 12.5, marginTop: 2 }}>Price Index vs. each category's own historical average price</div></div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {below.length === 0 && <div className="sl-muted" style={{ fontSize: 12.5 }}>No category is priced below its own average this period.</div>}
            {below.map((c: any) => (
              <button key={c.category} className="sl-palette__row" onClick={() => { setCategoryFilter(c.category); toast("Products filtered to " + c.category + "."); }} style={{ flexDirection: "column", alignItems: "stretch", gap: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
                  <span style={{ fontSize: 14 }}>{c.category}</span>
                  <span style={{ fontWeight: 600, fontSize: 15, color: "var(--status-negative-fg)" }}>{delta(c.pricePts, " pts")}</span>
                </div>
                <div className="sl-progress-track"><span className="sl-progress-fill" style={{ width: Math.min(100, (Math.abs(c.pricePts) / maxAbs) * 100).toFixed(1) + "%", background: "var(--fill-track-strong)" }}></span></div>
                <div className="sl-muted" style={{ fontSize: 11.5 }}>Price Index {c.priceIndex.toFixed(0)} · {c.skus} SKUs</div>
              </button>
            ))}
          </div>
        </Card>
      </div>

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
    </>
  );
}
