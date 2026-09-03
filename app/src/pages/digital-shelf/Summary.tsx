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
import type { DigitalShelfContext } from "./Layout";

export default function DigitalShelfSummary() {
  const { sh, categoryFilter, setCategoryFilter } = useOutletContext<DigitalShelfContext>();
  const { setRetailer, retailer } = useFilters();
  const { toast } = useUi();
  const { hover, onEnter, onLeave } = useChartHover();
  const [visMode, setVisMode] = useState<"trend" | "retailer" | "category">("trend");
  const [catSortKey, setCatSortKey] = useState("overall");
  const [catSortDir, setCatSortDir] = useState<"asc" | "desc">("desc");

  const modes = (["trend", "retailer", "category"] as const).map((m) => ({
    label: { trend: "Trend", retailer: "Retailer", category: "Category" }[m],
    cls: visMode === m ? "btn-primary" : "btn-secondary",
    go: () => setVisMode(m),
  }));
  const buy = sh.kpis.find((k: any) => k.id === "buybox");
  const visVals = sh.visibility.series[0].values;
  const visFooter = [
    { label: "Visibility now", value: visVals[visVals.length - 1].toFixed(1) + "%", color: "var(--status-positive-fg)" },
    { label: "Previous period", value: sh.visibility.previous[sh.visibility.previous.length - 1].toFixed(1) + "%", color: "inherit" },
    { label: "Gap to target", value: (40 - visVals[visVals.length - 1]).toFixed(1) + " pts", color: "var(--status-neutral-fg)" },
    { label: "Buy Box Ownership 1P", value: buy.value + "%", color: buy.value >= buy.target ? "var(--status-positive-fg)" : "var(--status-neutral-fg)" },
  ];
  const visChart = visMode === "trend"
    ? lineChart({ id: "shelf-vis", title: "Search Visibility", subtitle: "Share of search across the tracked keyword set, against the 40% target",
        labels: sh.labels, lo: 0, hi: 105, ticks: [0, 20, 40, 60, 80, 100], fmt: (v) => v.toFixed(1) + "%",
        series: sh.visibility.series, previous: sh.visibility.previous, target: 40,
        modes, span: "1 / -1", badge: "Target 40%", footer: visFooter }, hover, onEnter)
    : barChart({ id: "shelf-vis-" + visMode, title: "Search Visibility",
        subtitle: visMode === "retailer" ? "Current visibility at each monitored retailer" : "Current visibility by tracked category",
        labels: (visMode === "retailer" ? sh.visibility.byRetailer : sh.visibility.byCategory).map((x: any) => x.label),
        values: (visMode === "retailer" ? sh.visibility.byRetailer : sh.visibility.byCategory).map((x: any) => x.value),
        valueName: "Visibility", lo: 0, hi: 60, ticks: [0, 15, 30, 45, 60], fmt: (v) => v.toFixed(1) + "%", target: 40,
        fill: (v) => (v >= 40 ? "var(--status-positive-fg)" : "var(--color-accent-300)"),
        modes, span: "1 / -1", badge: "Target 40%", footer: visFooter }, hover, onEnter);

  const catSort = (k: string) => { setCatSortDir(catSortKey === k && catSortDir === "desc" ? "asc" : "desc"); setCatSortKey(k); };
  const sortedCategories = sh.categories.slice().sort((a: any, b: any) => {
    const dir = catSortDir === "asc" ? 1 : -1;
    return (catSortKey === "category" ? a.category.localeCompare(b.category) : a[catSortKey] - b[catSortKey]) * dir;
  });

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: "var(--app-gap)" }}>
        {sh.kpis.filter((k: any) => k.id !== "buybox").map((k: any) => <KpiCard key={k.id} k={kpiCard(k, spark)} />)}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,430px),1fr))", gap: "var(--app-gap)" }}>
        <ChartCard c={visChart} onLeave={onLeave} />
      </div>

      <section>
        <div style={{ marginBottom: 14 }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>Digital shelf by retailer</h2>
          <div className="sl-muted" style={{ fontSize: 13, marginTop: 2 }}>Select a retailer to scope every section on this page to it</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: "var(--app-gap)" }}>
          {sh.retailers.map((r: any) => {
            const active = retailer === r.id;
            return (
              <Card key={r.id} interactive selected={active} padding="16px 18px" onClick={() => { if (!active) { setRetailer(r.id); toast("Digital shelf scoped to " + r.name + "."); } }}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
                  <span style={{ fontWeight: 500, fontSize: 14.5 }}>{r.name}</span>
                  <span style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 22 }}>{r.shelfScore}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, fontSize: 11.5 }} className="sl-muted">
                  <span>{r.skus} tracked SKUs</span>
                  <span style={{ color: deltaColor(r.shelfScoreDelta) }}>{delta(r.shelfScoreDelta)} shelf score</span>
                </div>
                <div className="sl-progress-track" style={{ margin: "10px 0 12px" }}><span className="sl-progress-fill" style={{ width: r.shelfScore + "%" }}></span></div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {[["Search visibility", pct(r.visibility)], ["Stock Availability 1P + 3P", pct(r.availability)], ["Price index", r.priceIndex.toFixed(1)], ["Content completeness", String(r.content)], ["Rating", r.rating.toFixed(2)]].map(([l, v]) => (
                    <div key={l} style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 12.5 }}><span className="sl-muted">{l}</span><span>{v}</span></div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      <Card padding="20px 22px 10px">
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 14 }}>
          <div><h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Category performance</h3><div className="sl-muted" style={{ fontSize: 12.5, marginTop: 2 }}>Sort any column; select a category to filter the products tab</div></div>
          {categoryFilter && <button className="btn btn-ghost" onClick={() => setCategoryFilter("")} style={{ fontSize: 12.5 }}>Clear "{categoryFilter}"</button>}
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="sl-table">
            <thead><tr>
              {[["category", "Category", "left", 180], ["visibility", "Search visibility", "right"], ["availability", "Stock Availability 1P + 3P", "right"], ["content", "Content completeness", "right"], ["priceIndex", "Price index", "right"], ["overall", "Overall score", "right", 140]].map(([k, label, align, mw]) => (
                <th key={k as string} className={"is-sortable" + (catSortKey === k ? " is-sorted" : "")} style={{ textAlign: align as any, minWidth: mw as number }} onClick={() => catSort(k as string)}>{label}{catSortKey === k && <span className="sl-sort-caret">{catSortDir === "asc" ? "▲" : "▼"}</span>}</th>
              ))}
            </tr></thead>
            <tbody>
              {sortedCategories.map((c: any) => {
                const selected = categoryFilter === c.category;
                return (
                  <tr className={"sl-row is-clickable" + (selected ? " is-selected" : "")} key={c.category} onClick={() => { setCategoryFilter(selected ? "" : c.category); toast(selected ? "Category filter cleared." : "Products filtered to " + c.category + "."); }}>
                    <td><div className="sl-table-name">{c.category}</div><div className="sl-table-sub">{c.skus} SKUs</div></td>
                    <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>{pct(c.visibility)} <span style={{ fontSize: 11.5, marginLeft: 6, color: deltaColor(c.delta) }}>{delta(c.delta, " pts")}</span></td>
                    <td style={{ textAlign: "right" }}>{pct(c.availability)}</td>
                    <td style={{ textAlign: "right" }}>{c.content}</td>
                    <td style={{ textAlign: "right" }}>{c.priceIndex.toFixed(1)}</td>
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
