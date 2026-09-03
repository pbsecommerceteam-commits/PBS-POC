import { useNavigate, useOutletContext } from "react-router-dom";
import { Card } from "../../components/ui/Card";
import { AiInsightBanner } from "../../components/ui/AiInsightBanner";
import { useUi } from "../../context/UiContext";
import { delta, deltaColor } from "../../lib/format";
import type { SalesShareContext } from "./Layout";

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
    </>
  );
}
