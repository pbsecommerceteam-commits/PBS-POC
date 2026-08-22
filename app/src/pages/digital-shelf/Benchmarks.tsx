import { useNavigate, useOutletContext } from "react-router-dom";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { pct, delta, deltaColor } from "../../lib/format";
import type { DigitalShelfContext } from "./Layout";

export default function DigitalShelfBenchmarks() {
  const { sh } = useOutletContext<DigitalShelfContext>();
  const navigate = useNavigate();

  const pr = sh.pricing;
  const priceRows = [
    { label: "Your average price", value: pr.own, kind: "own" },
    { label: "Category average", value: pr.categoryAvg, kind: "cat" },
    { label: "Lowest competitor — " + pr.lowest.name, value: pr.lowest.price, kind: "low" },
    { label: "Highest competitor — " + pr.highest.name, value: pr.highest.price, kind: "high" },
  ];
  const pmax = Math.max(...priceRows.map((r) => r.value)) * 1.08;
  const attention = sh.availability.attention;

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(380px,1fr))", gap: "var(--app-gap)" }}>
        <Card padding="20px 22px">
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
            <div><h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Price intelligence</h3><div className="sl-muted" style={{ fontSize: 12.5, marginTop: 2 }}>Your shelf price against the category and tracked rivals</div></div>
            <Badge tone={pr.verdict === "inline" ? "positive" : "warning"}>{pr.verdict === "above" ? "Above category" : pr.verdict === "below" ? "Below category" : "In line"}</Badge>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {priceRows.map((r) => (
              <div key={r.label}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 12.5, marginBottom: 5 }}>
                  <span className="sl-muted" style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.label}</span>
                  <span style={{ fontWeight: r.kind === "own" ? 600 : 400 }}>${r.value.toFixed(2)}</span>
                </div>
                <div className="sl-progress-track" style={{ height: 6 }}>
                  <span className="sl-progress-fill" style={{ width: ((r.value / pmax) * 100).toFixed(1) + "%", background: r.kind === "own" ? "var(--color-accent-700)" : r.kind === "cat" ? "var(--color-accent-400)" : "var(--fill-track-strong)" }}></span>
                </div>
              </div>
            ))}
          </div>
          <div className="sl-muted" style={{ fontSize: 12.5, lineHeight: 1.55, marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--border-subtle)" }}>
            {pr.verdict === "above" ? `Your portfolio is priced ${Math.abs(pr.gap).toFixed(1)}% above the category average — index ${pr.index.toFixed(1)}.`
              : pr.verdict === "below" ? `Your portfolio is priced ${Math.abs(pr.gap).toFixed(1)}% below the category average — index ${pr.index.toFixed(1)}.`
              : `Your portfolio is within 5% of the category average — index ${pr.index.toFixed(1)}.`}
          </div>
        </Card>

        <Card padding="20px 22px">
          <div style={{ marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Availability</h3>
            <div className="sl-muted" style={{ fontSize: 12.5, marginTop: 2 }}>
              {sh.availability.belowThreshold === 1 ? "1 SKU is below the 90% availability threshold" : `${sh.availability.belowThreshold} SKUs are below the 90% availability threshold`} · {sh.availability.belowTarget === 1 ? "1 retailer is below the 95% service target" : `${sh.availability.belowTarget} retailers are below the 95% service target`}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {sh.availability.byRetailer.map((r: any) => {
              const t = Math.max(1, r.inStock + r.low + r.oos);
              return (
                <div key={r.name}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 12.5, marginBottom: 5 }}>
                    <span>{r.name}</span>
                    <span style={{ fontWeight: 600, color: r.rate >= 95 ? "var(--status-positive-fg)" : "var(--status-neutral-fg)" }}>{pct(r.rate)}</span>
                  </div>
                  <div style={{ display: "flex", height: 6, gap: 1, borderRadius: "var(--radius-pill)", overflow: "hidden" }}>
                    <span style={{ width: ((r.inStock / t) * 100).toFixed(1) + "%", background: "var(--status-positive-fg)" }}></span>
                    <span style={{ width: ((r.low / t) * 100).toFixed(1) + "%", background: "var(--status-warning-fg)" }}></span>
                    <span style={{ width: ((r.oos / t) * 100).toFixed(1) + "%", background: "var(--status-critical-fg)" }}></span>
                  </div>
                  <div className="sl-table-sub">{r.inStock} in stock · {r.low} low · {r.oos} out</div>
                </div>
              );
            })}
          </div>
          {attention.length > 0 && (
            <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--border-subtle)" }}>
              <div className="sl-eyebrow" style={{ marginBottom: 6 }}>Needs attention</div>
              {attention.map((p: any) => (
                <button key={p.id} className="sl-palette__row" onClick={() => navigate("/product/" + p.id)} style={{ padding: "6px 0", justifyContent: "space-between" }}>
                  <span style={{ minWidth: 0, textAlign: "left" }}>
                    <span style={{ display: "block", fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</span>
                    <span className="sl-muted" style={{ fontSize: 11.5 }}>{p.retailerName} · {p.status}</span>
                  </span>
                  <span style={{ fontWeight: 600, color: p.inStockRate < 90 ? "var(--status-critical-fg)" : "inherit" }}>{pct(p.inStockRate)}</span>
                </button>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card padding="20px 22px">
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 16 }}>
          <div><h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Content health</h3><div className="sl-muted" style={{ fontSize: 12.5, marginTop: 2 }}>{sh.contentHealth.components[0]?.name} is costing the most points</div></div>
          <div style={{ textAlign: "right" }}><div className="sl-eyebrow">Overall content score</div><div style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 24, marginTop: 2 }}>{sh.contentHealth.overall}/100</div></div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 14 }}>
          {sh.contentHealth.components.slice().sort((a: any, b: any) => b.lost - a.lost).map((c: any) => (
            <Card key={c.id} padding="14px 16px">
              <div className="sl-eyebrow">{c.name}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 6 }}>
                <span style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 24 }}>{c.score}%</span>
                <span style={{ fontSize: 12, color: deltaColor(c.delta) }}>{delta(c.delta, " pts")}</span>
              </div>
              <div className="sl-progress-track" style={{ margin: "10px 0 8px" }}>
                <span className="sl-progress-fill" style={{ width: c.score + "%", background: c.score >= 90 ? "var(--color-accent-700)" : c.score >= 75 ? "var(--color-accent-500)" : "var(--color-accent-300)" }}></span>
              </div>
              <div className="sl-muted" style={{ fontSize: 12, lineHeight: 1.45 }}>{c.hint}</div>
              <div style={{ fontSize: 11.5, marginTop: 5, color: c.lost >= 4 ? "var(--status-negative-fg)" : "var(--text-faint)" }}>−{c.lost.toFixed(1)} pts of score</div>
            </Card>
          ))}
        </div>
      </Card>
    </>
  );
}
