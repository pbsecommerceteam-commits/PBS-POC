import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { KpiCard } from "../../components/ui/KpiCard";
import { ChartCard } from "../../components/charts/ChartCard";
import { Card } from "../../components/ui/Card";
import { useFilters } from "../../context/FiltersContext";
import { useUi } from "../../context/UiContext";
import { useChartHover } from "../../hooks/useChartHover";
import { lineChart, barChart, spark } from "../../lib/charts";
import { kpiCard, pct, delta, deltaColor } from "../../lib/format";
import type { SalesShareContext } from "./Layout";

type TrendMetric = "sos" | "pidx" | "instock" | "buybox";

const TREND_CONFIG: Record<TrendMetric, { lo: number; hi: number; ticks: number[]; fmt: (v: number) => string; label: string }> = {
  sos: { lo: 0, hi: 105, ticks: [0, 20, 40, 60, 80, 100], fmt: (v) => v.toFixed(1) + "%", label: "Search Visibility" },
  pidx: { lo: 90, hi: 112, ticks: [90, 100, 110], fmt: (v) => v.toFixed(1), label: "Price Index" },
  instock: { lo: 85, hi: 100, ticks: [85, 90, 95, 100], fmt: (v) => v.toFixed(1) + "%", label: "Availability" },
  buybox: { lo: 40, hi: 100, ticks: [40, 60, 80, 100], fmt: (v) => v.toFixed(0) + "%", label: "Buy Box" },
};

export default function SalesShareSummary() {
  const { sh, categoryFilter, setCategoryFilter } = useOutletContext<SalesShareContext>();
  const { setRetailer, retailer } = useFilters();
  const { toast } = useUi();
  const { hover, onEnter, onLeave } = useChartHover();
  const [trendMode, setTrendMode] = useState<TrendMetric>("sos");
  const [catSort, setCatSort] = useState({ key: "overall", dir: "desc" as "asc" | "desc" });

  const findKpi = (id: string) => sh.kpis.find((k: any) => k.id === id);
  const kpiIds = ["sos", "pidx", "instock", "buybox"];

  const modes = (Object.keys(TREND_CONFIG) as TrendMetric[]).map((m) => ({
    label: TREND_CONFIG[m].label, cls: trendMode === m ? "btn-primary" : "btn-secondary", go: () => setTrendMode(m),
  }));
  const activeKpi = findKpi(trendMode);
  const cfg = TREND_CONFIG[trendMode];
  const trendChart = lineChart({
    id: "perf-trend-" + trendMode, title: "Performance Trend",
    subtitle: cfg.label + " across the selected period",
    labels: sh.labels, lo: cfg.lo, hi: cfg.hi, ticks: cfg.ticks, fmt: cfg.fmt, hideLegend: true,
    series: [{ name: cfg.label, values: activeKpi.spark }],
    target: activeKpi.target, modes, span: "1 / -1",
    footer: [
      { label: cfg.label + " now", value: cfg.fmt(activeKpi.value), color: "var(--status-positive-fg)" },
      { label: "Previous period", value: cfg.fmt(activeKpi.value - activeKpi.delta), color: "inherit" },
      { label: "Change", value: delta(activeKpi.delta, " pts"), color: deltaColor(activeKpi.delta) },
    ],
  }, hover, onEnter);

  const retailerChart = barChart({
    id: "perf-retailer-vis", title: "Retailer Comparison", subtitle: "Search visibility at each monitored retailer",
    labels: sh.retailers.map((r: any) => r.name), values: sh.retailers.map((r: any) => r.visibility),
    valueName: "Visibility", lo: 0, hi: 60, ticks: [0, 15, 30, 45, 60], fmt: (v) => v.toFixed(1) + "%", target: 40,
    fill: (v) => (v >= 40 ? "var(--status-positive-fg)" : "var(--color-accent-300)"),
  }, hover, onEnter);

  const catSortFn = (k: string) => setCatSort((s) => ({ key: k, dir: s.key === k && s.dir === "desc" ? "asc" : "desc" }));
  const sortedCategories = sh.categories.slice().sort((a: any, b: any) => {
    const dir = catSort.dir === "asc" ? 1 : -1;
    return (catSort.key === "category" ? a.category.localeCompare(b.category) : a[catSort.key] - b[catSort.key]) * dir;
  });

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,238px),1fr))", gap: "var(--app-gap)" }}>
        {kpiIds.map((id) => <KpiCard key={id} k={kpiCard(findKpi(id), spark)} />)}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,430px),1fr))", gap: "var(--app-gap)" }}>
        <ChartCard c={trendChart} onLeave={onLeave} />
        <ChartCard c={retailerChart} onLeave={onLeave} />
      </div>

      <section>
        <div style={{ marginBottom: 14 }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>Retailer performance</h2>
          <div className="sl-muted" style={{ fontSize: 13, marginTop: 2 }}>Select a retailer to scope the page to that account</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,250px),1fr))", gap: "var(--app-gap)" }}>
          {sh.retailers.map((r: any) => {
            const active = retailer === r.id;
            return (
              <Card key={r.id} interactive selected={active} padding="16px 18px" onClick={() => { if (!active) { setRetailer(r.id); toast("Scoped to " + r.name + "."); } }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                  <span style={{ fontWeight: 500, fontSize: 14.5 }}>{r.name}</span>
                  <span style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 22 }}>{r.shelfScore}</span>
                </div>
                <div className="sl-progress-track" style={{ margin: "12px 0 10px" }}><span className="sl-progress-fill" style={{ width: r.shelfScore + "%" }}></span></div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {[["Search visibility", pct(r.visibility)], ["Availability", pct(r.availability)], ["Price index", r.priceIndex.toFixed(1)], ["Content completeness", String(r.content)], ["Rating", r.rating.toFixed(2)], ["Buy box presence", r.buyBoxPresence + "%"]].map(([l, v]) => (
                    <div key={l} style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 12.5 }}><span className="sl-muted">{l}</span><span>{v}</span></div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      <Card padding="20px 22px 10px">
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 16 }}>
          <div><h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Category performance</h3><div className="sl-muted" style={{ fontSize: 12.5, marginTop: 2 }}>Sort any column; select a category to scope the page</div></div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="sl-table">
            <thead><tr>
              {[["category", "Category", "left", 170], ["visibility", "Search visibility", "right"], ["availability", "Availability", "right"], ["priceIndex", "Price index", "right"], ["content", "Content completeness", "right"], ["rating", "Rating", "right"], ["overall", "Shelf score", "right", 130]].map(([k, label, align, mw]) => (
                <th key={k as string} className={"is-sortable" + (catSort.key === k ? " is-sorted" : "")} style={{ textAlign: align as any, minWidth: mw as number }} onClick={() => catSortFn(k as string)}>{label}{catSort.key === k && <span className="sl-sort-caret">{catSort.dir === "asc" ? "▲" : "▼"}</span>}</th>
              ))}
            </tr></thead>
            <tbody>
              {sortedCategories.map((c: any) => {
                const selected = categoryFilter === c.category;
                return (
                  <tr className={"sl-row is-clickable" + (selected ? " is-selected" : "")} key={c.category} onClick={() => { setCategoryFilter(selected ? "" : c.category); toast(selected ? "Category filter cleared." : c.category + " — Performance Intelligence."); }}>
                    <td><div className="sl-table-name">{c.category}</div><div className="sl-table-sub">{c.skus} SKUs</div></td>
                    <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>{pct(c.visibility)} <span style={{ fontSize: 11.5, marginLeft: 6, color: deltaColor(c.delta) }}>{delta(c.delta, " pts")}</span></td>
                    <td style={{ textAlign: "right" }}>{pct(c.availability)}</td>
                    <td style={{ textAlign: "right" }}>{c.priceIndex.toFixed(1)}</td>
                    <td style={{ textAlign: "right" }}>{c.content}</td>
                    <td style={{ textAlign: "right" }}>{c.rating.toFixed(2)}</td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 9, justifyContent: "flex-end" }}>
                        <span className="sl-progress-track" style={{ width: 56 }}><span className="sl-progress-fill" style={{ width: c.overall + "%" }}></span></span>
                        <span style={{ fontWeight: 600, minWidth: 24 }}>{c.overall}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
