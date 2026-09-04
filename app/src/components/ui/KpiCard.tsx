import { useState } from "react";
import { Card } from "./Card";
import type { KpiVM } from "../../lib/format";

/** The metric card used everywhere a KPI appears. The value dominates, the
 *  label is a quiet caption above it, and everything else — delta, target,
 *  trend, status — is secondary supporting context rather than another box
 *  competing for attention. Each card owns its own hover slot (unlike the
 *  big charts' page-shared useChartHover) since several cards render at
 *  once and their sparklines are independent of each other. */
export function KpiCard({ k }: { k: KpiVM }) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const n = k.sparkPoints.length;
  const sliceW = n ? k.sparkW / n : k.sparkW;
  const hovered = hoverIdx != null ? k.sparkPoints[hoverIdx] : null;

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

      <div style={{ position: "relative", marginTop: 12 }}>
        <svg viewBox={`0 0 ${k.sparkW} 30`} preserveAspectRatio="none" style={{ width: "100%", height: 28, overflow: "visible" }} onMouseLeave={() => setHoverIdx(null)}>
          <path d={k.sparkArea} fill="var(--color-accent)" fillOpacity={0.08}></path>
          <path d={k.sparkD} fill="none" stroke="var(--color-accent-700)" strokeWidth={1.5} vectorEffect="non-scaling-stroke"></path>
          {hovered && <circle cx={hovered.x} cy={hovered.y} r={2.6} fill="var(--color-accent-700)" stroke="var(--surface-primary)" strokeWidth={1}></circle>}
          {k.sparkPoints.map((_pt, i) => (
            <rect key={i} x={i * sliceW} y={0} width={sliceW} height={30} fill="currentColor" fillOpacity={0} onMouseEnter={() => setHoverIdx(i)} style={{ cursor: "crosshair" }}></rect>
          ))}
        </svg>
        {hovered && (
          <div className="sl-pop-in" style={{
            position: "absolute", bottom: "100%", left: (hovered.x / k.sparkW) * 100 + "%",
            transform: `translateX(${hovered.x > k.sparkW * 0.75 ? "-90%" : hovered.x < k.sparkW * 0.25 ? "-10%" : "-50%"})`,
            marginBottom: 6, background: "var(--surface-elevated)", border: "1px solid var(--border-standard)",
            borderRadius: "var(--radius-sm)", boxShadow: "var(--shadow-2)", padding: "6px 9px",
            fontSize: 11.5, lineHeight: 1.5, whiteSpace: "nowrap", pointerEvents: "none", zIndex: 5,
          }}>
            {hovered.label && <div className="sl-muted" style={{ fontSize: 10.5, marginBottom: 2 }}>{hovered.label}</div>}
            <div style={{ fontWeight: 600 }}>{hovered.value}</div>
          </div>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--border-subtle)" }}>
        {k.statusText ? (
          <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: k.statusColor, fontWeight: 500 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", flex: "none", background: k.statusColor }}></span>{k.statusText}
          </span>
        ) : <span />}
        <span className="sl-faint" style={{ fontSize: 11.5 }}>{k.goalText}</span>
      </div>
    </Card>
  );
}
