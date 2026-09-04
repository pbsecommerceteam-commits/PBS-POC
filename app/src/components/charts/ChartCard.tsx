import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import type { ChartConfig } from "../../lib/charts";

/** Renders either a line or a bar chart from one config shape — the config
 *  builders (lineChart/barChart in lib/charts.ts) leave `series`/`bars`
 *  empty for the chart type they don't produce. The chart math is untouched
 *  from the original prototype; only the chrome around it — title block,
 *  mode switch, grid, tooltip, legend, footer — is redesigned. */
export function ChartCard({ c, onLeave, onExportCsv }: { c: ChartConfig; onLeave: () => void; onExportCsv?: () => void }) {
  return (
    <Card padding="20px 22px 16px" style={{ position: "relative", gridColumn: c.span }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 16 }}>
        <div>
          <h4 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>{c.title}</h4>
          {c.subtitle && <div className="sl-muted" style={{ fontSize: 12.5, marginTop: 2 }}>{c.subtitle}</div>}
        </div>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
          {c.legend.map((s) => (
            <div key={s.name} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
              <span style={{ width: 12, height: 0, borderTop: `2px ${s.legendStyle} ${s.color}` }}></span>
              <span className="sl-muted">{s.name}</span>
              <span style={{ fontWeight: 600 }}>{s.last}</span>
            </div>
          ))}
          {c.badge && <Badge tone="outline">{c.badge}</Badge>}
          {c.modes.length > 0 && (
            <div className="sl-tabs">
              {c.modes.map((m) => (
                <button key={m.label} type="button" className={"sl-tab" + (m.cls === "btn-primary" ? " is-active" : "")} onClick={m.go}>{m.label}</button>
              ))}
            </div>
          )}
          {onExportCsv && (
            <button type="button" className="btn btn-ghost" onClick={onExportCsv} style={{ fontSize: 12, padding: "5px 10px", minHeight: "auto" }}>
              ⬇ Export
            </button>
          )}
        </div>
      </div>
      <svg viewBox="0 0 880 262" onMouseLeave={onLeave} style={{ width: "100%", height: "auto", display: "block", fontFamily: "var(--font-body)" }}>
        {c.yTicks.map((t, i) => (
          <g key={i}>
            <line x1={48} x2={866} y1={t.y} y2={t.y} stroke="var(--border-subtle)" strokeWidth={1}></line>
            <text x={40} y={t.ty} textAnchor="end" fontSize={11} fill="var(--text-faint)">{t.label}</text>
          </g>
        ))}
        {c.bars.map((b, i) => (
          <rect key={i} x={b.x} y={b.y} width={b.w} height={b.h} rx={2} fill={b.fill}></rect>
        ))}
        {c.series.map((s, i) => (
          <g key={i}>
            <path d={s.area} fill="var(--color-accent)" fillOpacity={0.07}></path>
            <path d={s.d} fill="none" stroke={s.color} strokeWidth={s.width} strokeDasharray={s.dash} strokeLinejoin="round" strokeLinecap="round"></path>
          </g>
        ))}
        {c.targetY && <line x1={48} x2={866} y1={c.targetY} y2={c.targetY} stroke="var(--color-accent-700)" strokeWidth={1.2} strokeDasharray="4 4"></line>}
        {c.guideX && <line x1={c.guideX} x2={c.guideX} y1={14} y2={232} stroke="var(--border-strong)" strokeWidth={1}></line>}
        {c.points.map((p, i) => (
          <circle key={i} cx={p.cx} cy={p.cy} r={p.r} fill="var(--surface-elevated)" stroke="var(--color-accent-800)" strokeWidth={1.6}></circle>
        ))}
        {c.xTicks.map((t, i) => (
          <text key={i} x={t.x} y={256} textAnchor="middle" fontSize={11} fill="var(--text-faint)">{t.label}</text>
        ))}
        {c.hits.map((h, i) => (
          <rect key={i} x={h.x} y={14} width={h.w} height={218} fill="currentColor" fillOpacity={0} onMouseEnter={h.enter} style={{ cursor: "crosshair" }}></rect>
        ))}
      </svg>
      {c.tip && (
        <div className="sl-pop-in" style={{ position: "absolute", top: c.tip.top, left: c.tip.left, transform: `translateX(${c.tip.shift})`, background: "var(--surface-elevated)", border: "1px solid var(--border-standard)", borderRadius: "var(--radius-sm)", boxShadow: "var(--shadow-2)", padding: "10px 12px", minWidth: 150, pointerEvents: "none", zIndex: 5 }}>
          <div style={{ fontWeight: 600, fontSize: 12.5, marginBottom: 5 }}>{c.tip.label}</div>
          {c.tip.rows.map((r, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, fontSize: 12, lineHeight: 1.6 }}>
              <span className="sl-muted">{r.name}</span>
              <span style={{ fontWeight: 600 }}>{r.value}</span>
            </div>
          ))}
        </div>
      )}
      {c.hasFooter && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12, marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--border-subtle)" }}>
          {c.footer.map((f, i) => (
            <div key={i} style={{ minWidth: 0 }}>
              <div className="sl-muted" style={{ fontSize: 11.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{f.label}</div>
              <div style={{ fontWeight: 600, fontSize: 15, color: f.color, marginTop: 2 }}>{f.value}</div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
