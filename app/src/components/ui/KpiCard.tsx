import { Card } from "./Card";
import type { KpiVM } from "../../lib/format";

/** The metric card used everywhere a KPI appears. The value dominates, the
 *  label is a quiet caption above it, and everything else — delta, target,
 *  trend, status — is secondary supporting context rather than another box
 *  competing for attention. */
export function KpiCard({ k }: { k: KpiVM }) {
  return (
    <Card padding="18px 20px" style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <div className="sl-muted" style={{ fontSize: 12.5 }}>{k.label}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 4 }}>
        <span style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 32, lineHeight: 1, color: "var(--text-display)", letterSpacing: "-.01em" }}>{k.valueText}</span>
        {k.unit && <span className="sl-muted" style={{ fontSize: 14 }}>{k.unit}</span>}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6, fontSize: 12.5 }}>
        <span style={{ color: k.deltaColor, fontWeight: 600 }}>{k.deltaText}</span>
        <span className="sl-faint">vs previous period</span>
      </div>

      <svg viewBox="0 0 130 30" preserveAspectRatio="none" style={{ width: "100%", height: 28, marginTop: 12, overflow: "visible" }}>
        <path d={k.sparkArea} fill="var(--color-accent)" fillOpacity={0.08}></path>
        <path d={k.sparkD} fill="none" stroke="var(--color-accent-700)" strokeWidth={1.5} vectorEffect="non-scaling-stroke"></path>
      </svg>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--border-subtle)" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: k.statusColor, fontWeight: 500 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", flex: "none", background: k.statusColor }}></span>{k.statusText}
        </span>
        <span className="sl-faint" style={{ fontSize: 11.5 }}>{k.goalText}</span>
      </div>
    </Card>
  );
}
