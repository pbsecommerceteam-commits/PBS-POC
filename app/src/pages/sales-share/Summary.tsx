import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { KpiCard } from "../../components/ui/KpiCard";
import { ChartCard } from "../../components/charts/ChartCard";
import { Card } from "../../components/ui/Card";
import { Badge, growthTone } from "../../components/ui/Badge";
import { useFilters } from "../../context/FiltersContext";
import { useUi } from "../../context/UiContext";
import { useChartHover } from "../../hooks/useChartHover";
import { lineChart, spark } from "../../lib/charts";
import { kpiCard, pct, money } from "../../lib/format";
import type { SalesShareContext } from "./Layout";

export default function SalesShareSummary() {
  const { sd, categoryFilter, setCategoryFilter } = useOutletContext<SalesShareContext>();
  const { setRetailer, retailer } = useFilters();
  const { toast } = useUi();
  const { hover, onEnter, onLeave } = useChartHover();
  const [salesMode, setSalesMode] = useState<"sales" | "units" | "growth">("sales");
  const [catSort, setCatSort] = useState({ key: "sales", dir: "desc" as "asc" | "desc" });
  const [bubbleHover, setBubbleHover] = useState<string | null>(null);

  const trendFooter = [
    { label: "Sales this period", value: money(sd.totals.sales), color: "var(--status-positive-fg)" },
    { label: "Previous period", value: money(sd.totals.previous), color: "inherit" },
    { label: "Growth", value: (sd.totals.growth >= 0 ? "+" : "−") + Math.abs(sd.totals.growth).toFixed(1) + "%", color: sd.totals.growth >= 0 ? "var(--status-positive-fg)" : "var(--status-negative-fg)" },
    { label: "Units sold", value: sd.totals.units.toLocaleString(), color: "inherit" },
  ];
  const t = sd.trend;
  const modes = (["sales", "units", "growth"] as const).map((m) => ({ label: { sales: "Sales", units: "Units", growth: "Growth" }[m], cls: salesMode === m ? "btn-primary" : "btn-secondary", go: () => setSalesMode(m) }));
  let trendChart;
  if (salesMode === "growth") {
    const lo = Math.min(...t.growth, 0) - 2, hi = Math.max(...t.growth, 0) + 2;
    trendChart = lineChart({ id: "sales-growth", title: "Sales Trend", subtitle: "Period-on-period growth across the selected period",
      labels: t.labels, lo, hi, ticks: [lo, (lo + hi) / 2, hi], fmt: (v) => v.toFixed(1) + "%", hideLegend: true,
      series: [{ name: "Growth", values: t.growth }], target: 0, modes, span: "auto", footer: trendFooter }, hover, onEnter);
  } else {
    const vals = salesMode === "units" ? t.units : t.sales;
    const prev = salesMode === "units" ? t.units.map((v: number) => Math.round(v / (1 + sd.totals.growth / 100))) : t.previous;
    const hi = Math.max(...vals, ...prev) * 1.12;
    const fmt = salesMode === "units" ? (v: number) => Math.round(v).toLocaleString() : money;
    trendChart = lineChart({ id: "sales-" + salesMode, title: "Sales Trend",
      subtitle: salesMode === "units" ? "Estimated units across the selected period" : "Estimated sales across the selected period",
      labels: t.labels, lo: 0, hi, ticks: [0, hi / 3, (hi / 3) * 2, hi], fmt,
      series: [{ name: salesMode === "units" ? "Units" : "Sales", values: vals }], previous: prev, modes, span: "auto", footer: trendFooter }, hover, onEnter);
  }
  const shareChart = lineChart({ id: "sales-share", title: "Market Share", subtitle: "Your share of the tracked category against rival portfolios",
    labels: sd.share.labels, lo: 0, hi: 45, ticks: [0, 15, 30, 45], fmt: (v) => v.toFixed(1) + "%",
    series: [{ name: sd.share.own.name, values: sd.share.own.values }].concat(sd.share.rivals.map((r: any) => ({ name: r.name, values: r.values }))).concat([{ name: "All other brands", values: sd.share.otherValues }]),
    footer: sd.share.rows.map((r: any) => ({ label: `${r.rank}. ${r.name}`, value: pct(r.current), color: r.own ? "var(--status-positive-fg)" : "inherit" })) }, hover, onEnter);

  const catSortFn = (k: string) => setCatSort((s) => ({ key: k, dir: s.key === k && s.dir === "desc" ? "asc" : "desc" }));
  const byGrowth = sd.categories.slice().sort((a: any, b: any) => b.growth - a.growth);
  const bySize = sd.categories.slice().sort((a: any, b: any) => b.sales - a.sales);
  const fastest = byGrowth[0], largest = bySize[0], declining = byGrowth[byGrowth.length - 1];
  const sortedCategories = sd.categories.slice().sort((a: any, b: any) => {
    const dir = catSort.dir === "asc" ? 1 : -1;
    return (catSort.key === "category" ? a.category.localeCompare(b.category) : a[catSort.key] - b[catSort.key]) * dir;
  });

  const mx = { W: 640, H: 360, L: 52, R: 18, T: 18, B: 40 };
  const xs = sd.matrix.map((m: any) => m.x), ys = sd.matrix.map((m: any) => m.y);
  const xLo = Math.min(0, Math.min(...xs) - 4), xHi = Math.max(...xs) + 6;
  const yLo = Math.min(...ys) - 4, yHi = Math.max(...ys) + 4;
  const px = (v: number) => mx.L + (mx.W - mx.L - mx.R) * ((v - xLo) / (xHi - xLo || 1));
  const py = (v: number) => mx.T + (mx.H - mx.T - mx.B) * (1 - (v - yLo) / (yHi - yLo || 1));
  const maxSize = Math.max(...sd.matrix.map((m: any) => m.size), 1);
  const midX = px(28), midY = py(sd.growthBaseline);
  const hovered = sd.matrix.find((m: any) => m.label === bubbleHover);

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,238px),1fr))", gap: "var(--app-gap)" }}>
        {sd.kpis.map((k: any) => <KpiCard key={k.id} k={kpiCard(k, spark)} />)}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,430px),1fr))", gap: "var(--app-gap)" }}>
        <ChartCard c={trendChart} onLeave={onLeave} />
        <ChartCard c={shareChart} onLeave={onLeave} />
      </div>

      <section>
        <div style={{ marginBottom: 14 }}><h2 style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>Sales performance by retailer</h2><div className="sl-muted" style={{ fontSize: 13, marginTop: 2 }}>Select a retailer to scope the page to that account</div></div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,250px),1fr))", gap: "var(--app-gap)" }}>
          {sd.retailers.map((r: any) => {
            const active = retailer === r.id;
            const maxRetailerSales = Math.max(...sd.retailers.map((x: any) => x.sales), 1);
            return (
              <Card key={r.id} interactive selected={active} padding="16px 18px" onClick={() => { if (!active) { setRetailer(r.id); toast("Sales scoped to " + r.name + "."); } }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                  <span style={{ fontWeight: 500, fontSize: 14.5 }}>{r.name}</span>
                  <Badge tone={growthTone(r.status)}>{r.status}</Badge>
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 8 }}>
                  <span style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 22 }}>{money(r.sales)}</span>
                  <span style={{ fontSize: 13, color: r.growth >= 0 ? "var(--status-positive-fg)" : "var(--status-negative-fg)" }}>{(r.growth >= 0 ? "+" : "−") + Math.abs(r.growth).toFixed(1) + "%"}</span>
                </div>
                <div className="sl-progress-track" style={{ margin: "12px 0 10px" }}><span className="sl-progress-fill" style={{ width: ((r.sales / maxRetailerSales) * 100).toFixed(1) + "%" }}></span></div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 11.5 }} className="sl-muted"><span>{pct(r.share)} share</span><span>{pct(r.contribution)} of sales</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 11.5, marginTop: 3 }} className="sl-muted"><span>{r.units.toLocaleString()} units</span><span>avg ${r.avgPrice.toFixed(2)}</span></div>
              </Card>
            );
          })}
        </div>
      </section>

      <Card padding="20px 22px 10px">
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 16 }}>
          <div><h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Sales by category</h3><div className="sl-muted" style={{ fontSize: 12.5, marginTop: 2 }}>Sort any column; select a category to scope the page</div></div>
          <div style={{ display: "flex", gap: 22, flexWrap: "wrap" }}>
            {[["Fastest growing", fastest.category, "+" + fastest.growth.toFixed(1) + "%"], ["Largest", largest.category, money(largest.sales)], ["Declining", declining.category, (declining.growth >= 0 ? "+" : "−") + Math.abs(declining.growth).toFixed(1) + "%"]].map(([l, v, s]) => (
              <div key={l as string} style={{ minWidth: 0 }}><div className="sl-eyebrow">{l}</div><div style={{ fontWeight: 600, fontSize: 14, marginTop: 2 }}>{v}</div><div className="sl-muted" style={{ fontSize: 11.5 }}>{s}</div></div>
            ))}
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="sl-table">
            <thead><tr>
              {[["category", "Category", "left", 170], ["sales", "Sales", "right"], ["growth", "Growth", "right"], ["share", "Share", "right"], ["contribution", "Contribution", "right", 150], ["avgPrice", "Avg price", "right"]].map(([k, label, align, mw]) => (
                <th key={k as string} className={"is-sortable" + (catSort.key === k ? " is-sorted" : "")} style={{ textAlign: align as any, minWidth: mw as number }} onClick={() => catSortFn(k as string)}>{label}{catSort.key === k && <span className="sl-sort-caret">{catSort.dir === "asc" ? "▲" : "▼"}</span>}</th>
              ))}
            </tr></thead>
            <tbody>
              {sortedCategories.map((c: any) => {
                const selected = categoryFilter === c.category;
                const flag = c.category === fastest.category ? "Fastest growing" : c.category === largest.category ? "Largest" : c.category === declining.category ? "Declining" : "";
                return (
                  <tr className={"sl-row is-clickable" + (selected ? " is-selected" : "")} key={c.category} onClick={() => { setCategoryFilter(selected ? "" : c.category); toast(selected ? "Category filter cleared." : c.category + " — Sales & Share."); }}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}><span className="sl-table-name">{c.category}</span>{flag && <Badge tone="outline">{flag}</Badge>}</div>
                      <div className="sl-table-sub">{c.skus} SKUs</div>
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 600 }}>{money(c.sales)}</td>
                    <td style={{ textAlign: "right", color: c.growth >= 0 ? "var(--status-positive-fg)" : "var(--status-negative-fg)" }}>{(c.growth >= 0 ? "+" : "−") + Math.abs(c.growth).toFixed(1) + "%"}</td>
                    <td style={{ textAlign: "right" }}>{pct(c.share)}</td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 9, justifyContent: "flex-end" }}><span className="sl-progress-track" style={{ width: 64 }}><span className="sl-progress-fill" style={{ width: c.contribution.toFixed(1) + "%" }}></span></span><span>{pct(c.contribution)}</span></div>
                    </td>
                    <td style={{ textAlign: "right" }}>${c.avgPrice.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Card padding="20px 22px 14px">
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 14 }}>
          <div><h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Growth vs share</h3><div className="sl-muted" style={{ fontSize: 12.5, marginTop: 2 }}>Bubble size is category sales — select one to scope the page</div></div>
          <div className="sl-faint" style={{ fontSize: 12 }}>Hover a bubble for detail</div>
        </div>
        <div style={{ position: "relative" }}>
          <svg viewBox="0 0 640 360" style={{ width: "100%", height: "auto", display: "block", fontFamily: "var(--font-body)" }}>
            <line x1={mx.L} x2={mx.W - mx.R} y1={midY} y2={midY} stroke="var(--border-subtle)" strokeWidth={1}></line>
            <line x1={midX} x2={midX} y1={mx.T} y2={mx.H - mx.B} stroke="var(--border-subtle)" strokeWidth={1}></line>
            <text x={330} y={358} textAnchor="middle" fontSize={10.5} letterSpacing={1.4} fill="var(--text-faint)">MARKET SHARE</text>
            <text x={14} y={190} textAnchor="middle" fontSize={10.5} letterSpacing={1.4} fill="var(--text-faint)" transform="rotate(-90 14 190)">SALES GROWTH</text>
            {[
              { label: "Leaders", sub: "High share · high growth", x: midX + 10, y: mx.T + 15, sy: mx.T + 28, anchor: "start" },
              { label: "Emerging", sub: "Low share · high growth", x: mx.L + 8, y: mx.T + 15, sy: mx.T + 28, anchor: "start" },
              { label: "Defend", sub: "High share · low growth", x: mx.W - mx.R - 8, y: mx.H - mx.B - 22, sy: mx.H - mx.B - 9, anchor: "end" },
              { label: "At risk", sub: "Low share · low growth", x: mx.L + 8, y: mx.H - mx.B - 22, sy: mx.H - mx.B - 9, anchor: "start" },
            ].map((q) => (
              <g key={q.label}><text x={q.x} y={q.y} textAnchor={q.anchor as any} fontSize={11} letterSpacing={1.2} fill="var(--text-muted)">{q.label}</text><text x={q.x} y={q.sy} textAnchor={q.anchor as any} fontSize={10} fill="var(--text-faint)">{q.sub}</text></g>
            ))}
            {[yLo, sd.growthBaseline, yHi].map((v, i) => <text key={i} x={44} y={py(v) + 4} textAnchor="end" fontSize={11} fill="var(--text-faint)">{v.toFixed(1)}%</text>)}
            {[xLo, (xLo + xHi) / 2, xHi].map((v, i) => <text key={i} x={px(v)} y={348} textAnchor="middle" fontSize={11} fill="var(--text-faint)">{v.toFixed(0)}%</text>)}
            {sd.matrix.map((m: any) => {
              const on = bubbleHover === m.label || categoryFilter === m.label;
              const r = 11 + (m.size / maxSize) * 17;
              return (
                <g key={m.label} onClick={() => { const isOn = categoryFilter === m.label; setCategoryFilter(isOn ? "" : m.label); toast(isOn ? "Category filter cleared." : m.label + " — " + m.quadrant + " quadrant."); }} onMouseEnter={() => setBubbleHover(m.label)} onMouseLeave={() => setBubbleHover(null)} style={{ cursor: "pointer" }}>
                  <circle cx={px(m.x)} cy={py(m.y)} r={r} fill={categoryFilter === m.label ? "var(--color-accent-700)" : on ? "color-mix(in srgb, var(--color-accent) 42%, transparent)" : "color-mix(in srgb, var(--color-accent) 20%, transparent)"} stroke="var(--color-accent-700)" strokeWidth={1.2}></circle>
                  <text x={px(m.x)} y={py(m.y) - (15 + (m.size / maxSize) * 17)} textAnchor="middle" fontSize={11.5} fill="var(--text-primary)">{m.label}</text>
                </g>
              );
            })}
          </svg>
          {hovered && (
            <div className="sl-panel sl-pop-in" style={{ position: "absolute", left: ((px(hovered.x) / 640) * 100).toFixed(2) + "%", top: ((py(hovered.y) / 360) * 100).toFixed(2) + "%", transform: `translateX(${px(hovered.x) > 440 ? "-102%" : "8px"})`, padding: "10px 12px", minWidth: 170, pointerEvents: "none", zIndex: 5 }}>
              <div style={{ fontWeight: 600, fontSize: 13.5, marginBottom: 5 }}>{hovered.label}</div>
              {[["Quadrant", hovered.quadrant], ["Market share", pct(hovered.x)], ["Sales growth", (hovered.y >= 0 ? "+" : "−") + Math.abs(hovered.y).toFixed(1) + "%"], ["Sales", money(hovered.size)], ["Contribution", pct(hovered.contribution)]].map(([n, v]) => (
                <div key={n} style={{ display: "flex", justifyContent: "space-between", gap: 16, fontSize: 12, lineHeight: 1.55 }}><span className="sl-muted">{n}</span><span style={{ fontWeight: 600 }}>{v}</span></div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </>
  );
}
