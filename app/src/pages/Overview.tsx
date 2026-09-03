import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageShell } from "../components/layout/PageShell";
import { KpiCard } from "../components/ui/KpiCard";
import { ChartCard } from "../components/charts/ChartCard";
import { InsightCard } from "../components/ui/InsightCard";
import { SortableTable, type Column } from "../components/table/SortableTable";
import { Pagination } from "../components/table/Pagination";
import { Card } from "../components/ui/Card";
import { Badge, stockTone, opportunityTone } from "../components/ui/Badge";
import { Tabs } from "../components/ui/Tabs";
import { ProductCell } from "../components/ui/ProductCell";
import { useDashboardData } from "../context/DataContext";
import { useFilters } from "../context/FiltersContext";
import { useUi } from "../context/UiContext";
import { useChartHover } from "../hooks/useChartHover";
import { useSortedPage } from "../hooks/useSortedPage";
import { lineChart, barChart, spark } from "../lib/charts";
import { kpiCard, pct, delta, deltaColor } from "../lib/format";
import { productSorters } from "../lib/productSort";
import { toCsv } from "../data/mockData";
import type { Product, StockStatus } from "../models/types";

const STOCK_TABS: Array<{ id: StockStatus | "All"; label: string }> = [
  { id: "All", label: "All" }, { id: "In Stock", label: "In stock" }, { id: "Low Stock", label: "Low" }, { id: "Out of Stock", label: "Out of stock" },
];

export default function Overview() {
  const { snap } = useDashboardData();
  const { setRetailer } = useFilters();
  const { toast } = useUi();
  const navigate = useNavigate();
  const { hover, onEnter, onLeave } = useChartHover();
  const [stockFilter, setStockFilter] = useState<StockStatus | "All">("All");
  const [categoryFilter, setCategoryFilter] = useState("");

  const all: Product[] = useMemo(() => {
    if (!snap) return [];
    return snap.products.filter((p: Product) =>
      (stockFilter === "All" || p.stockStatus === stockFilter) &&
      (!categoryFilter || p.category === categoryFilter),
    );
  }, [snap, stockFilter, categoryFilter]);

  const { slice, sortKey, sortDir, onSort, page, totalPages, setPage, total } = useSortedPage(
    all, productSorters, "searchRank", 8, [stockFilter, categoryFilter].join("|"),
  );

  if (!snap) return <PageShell title="Overview" subtitle="Monitor digital shelf health across your retailers, products and categories."><div /></PageShell>;

  const kpi = (id: string) => snap.kpis.find((k: any) => k.id === id);
  const vis = lineChart({
    id: "vis", title: "Search Visibility Trend", subtitle: "Share of search across the tracked keyword set",
    labels: snap.labels, lo: 0, hi: 105, ticks: [0, 20, 40, 60, 80, 100], fmt: (v) => v.toFixed(1) + "%",
    series: snap.visibility.series, previous: snap.visibility.previous, target: 40,
  }, hover, onEnter);
  const stock = barChart({
    id: "stock", title: "Stock Availability 1P + 3P", subtitle: "In-stock rate against the 98% service target",
    badge: "Target 98%", labels: snap.labels, values: snap.stock.values, previous: snap.stock.previous,
    valueName: "In stock", lo: 90, hi: 100, ticks: [90, 92, 94, 96, 98, 100], fmt: (v) => v.toFixed(1) + "%",
    target: snap.stock.target, fill: (v) => (v >= snap.stock.target ? "var(--status-positive-fg)" : "var(--color-accent-300)"),
    footer: snap.stockByRetailer.map((r: any) => ({ label: r.retailer, value: pct(r.inStock), color: r.inStock >= snap.stock.target ? "var(--status-positive-fg)" : "var(--status-neutral-fg)" })),
  }, hover, onEnter);

  const columns: Column<Product>[] = [
    { key: "name", label: "Product", minWidth: 260, sortable: true, render: (p) => <ProductCell id={p.id} name={p.name} sku={p.id.toUpperCase()} meta={p.category} /> },
    { key: "searchRank", label: "Search Rank", align: "right", sortable: true, render: (p) => (
      <><span style={{ fontWeight: 600 }}>#{p.searchRank}</span>
      <span style={{ fontSize: 11.5, marginLeft: 6, color: deltaColor(p.rankDelta) }}>{p.rankDelta === 0 ? "—" : (p.rankDelta > 0 ? "↑ " : "↓ ") + Math.abs(p.rankDelta)}</span></>
    ) },
    { key: "price", label: "Price", align: "right", sortable: true, render: (p) => "$" + p.price.toFixed(2) },
    { key: "stockStatus", label: "Stock", sortable: true, render: (p) => (
      <><Badge tone={stockTone(p.stockStatus)}>{p.stockStatus}</Badge><div className="sl-table-sub">{p.inStockRate.toFixed(1)}% of days</div></>
    ) },
    { key: "rating", label: "Rating", align: "right", sortable: true, render: (p) => (
      <><div style={{ fontWeight: 500 }}>{p.rating.toFixed(2)}</div><div className="sl-table-sub">{p.reviews.toLocaleString()} reviews</div></>
    ) },
    { key: "contentScore", label: "Content completeness", align: "right", sortable: true, render: (p) => (
      <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end" }}>
        <span className="sl-progress-track" style={{ width: 40 }}><span className="sl-progress-fill" style={{ width: p.contentScore + "%" }}></span></span>
        <span style={{ fontWeight: 600, minWidth: 22 }}>{p.contentScore}</span>
      </div>
    ) },
    { key: "opportunity", label: "Opportunity", sortable: true, render: (p) => <Badge tone={opportunityTone(p.opportunity)}>{p.opportunity}</Badge> },
  ];

  return (
    <PageShell title="Overview" subtitle="Monitor digital shelf health across your retailers, products and categories."
      onExportCsv={() => {
        if (!all.length) { toast("Nothing to export with these filters."); return; }
        const blob = new Blob([toCsv(all)], { type: "text/csv;charset=utf-8" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `shelfline-products-overview.csv`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 2000);
        toast(`Exported ${all.length} rows.`);
      }}
      exportDisabled={all.length === 0}
    >
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,238px),1fr))", gap: "var(--app-gap)" }}>
        {["sos", "instock", "pidx", "content", "rating", "buybox"].map((id) => <KpiCard key={id} k={kpiCard(kpi(id), spark)} />)}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,430px),1fr))", gap: "var(--app-gap)" }}>
        <ChartCard c={vis} onLeave={onLeave} />
        <ChartCard c={stock} onLeave={onLeave} />
      </div>

      <section>
        <div style={{ marginBottom: 14 }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>Key insights</h2>
          <div className="sl-muted" style={{ fontSize: 13, marginTop: 2 }}>Signals detected across your monitored digital shelf</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: "var(--app-gap)" }}>
          {snap.insights.map((n: any) => (
            <InsightCard key={n.id} n={n} onGo={() => navigate(
              n.target === "shelf" ? `/digital-shelf/products${n.id === "i-avail" ? "?focus=avail" : ""}`
                : n.target === "sales" ? "/sales-share"
                : "/" + n.target,
            )} />
          ))}
        </div>
      </section>

      <Card padding="20px 22px 10px">
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 14 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Retailer performance</h3>
            <div className="sl-muted" style={{ fontSize: 12.5, marginTop: 2 }}>Select a retailer to scope the whole workspace to it</div>
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="sl-table">
            <thead><tr><th>Retailer</th><th style={{ textAlign: "right" }}>Share of search</th><th style={{ textAlign: "right" }}>In stock</th><th style={{ textAlign: "right" }}>Content</th><th style={{ textAlign: "right" }}>Rating</th><th style={{ textAlign: "right", minWidth: 140 }}>Overall score</th></tr></thead>
            <tbody>
              {snap.retailerPerformance.map((r: any) => (
                <tr className="sl-row is-clickable" key={r.id} onClick={() => { setRetailer(r.id); toast("Scoped to " + r.name + "."); }}>
                  <td><div className="sl-table-name">{r.name}</div><div className="sl-table-sub">{r.skus} tracked SKUs</div></td>
                  <td style={{ textAlign: "right", whiteSpace: "nowrap" }}><span style={{ fontWeight: 600 }}>{pct(r.sos)}</span> <span style={{ fontSize: 11.5, marginLeft: 6, color: deltaColor(r.sosDelta) }}>{delta(r.sosDelta)}</span></td>
                  <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>{pct(r.inStock)} <span style={{ fontSize: 11.5, marginLeft: 6, color: deltaColor(r.inStockDelta) }}>{delta(r.inStockDelta)}</span></td>
                  <td style={{ textAlign: "right" }}>{r.content}</td>
                  <td style={{ textAlign: "right" }}>{r.rating.toFixed(2)}</td>
                  <td style={{ textAlign: "right" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 9, justifyContent: "flex-end" }}>
                      <span className="sl-progress-track" style={{ width: 56 }}><span className="sl-progress-fill" style={{ width: r.overall + "%" }}></span></span>
                      <span style={{ fontWeight: 600, minWidth: 24 }}>{r.overall}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card padding="20px 22px">
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 16 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Category performance</h3>
            <div className="sl-muted" style={{ fontSize: 12.5, marginTop: 2 }}>Select a category to filter the product table below</div>
          </div>
          {categoryFilter && <button className="btn btn-ghost" onClick={() => setCategoryFilter("")} style={{ fontSize: 12.5 }}>Clear "{categoryFilter}"</button>}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 12 }}>
          {snap.categoryPerformance.map((c: any) => {
            const selected = categoryFilter === c.category;
            return (
              <Card key={c.category} interactive selected={selected} padding="15px 16px"
                onClick={() => { setCategoryFilter(selected ? "" : c.category); toast(selected ? "Category filter cleared." : "Products filtered to " + c.category + "."); }}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
                  <span style={{ fontWeight: 500, fontSize: 14 }}>{c.category}</span>
                  <span style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 18 }}>{c.overall}</span>
                </div>
                <div className="sl-progress-track" style={{ margin: "10px 0" }}><span className="sl-progress-fill" style={{ width: c.overall + "%" }}></span></div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 11.5 }} className="sl-muted">
                  <span>Visibility {pct(c.sos)}</span>
                  <span>Avail. {pct(c.availability)}</span>
                  <span>Content {c.content}</span>
                </div>
              </Card>
            );
          })}
        </div>
      </Card>

      <Card padding="20px 22px 14px">
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 16 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Product performance</h3>
            <div className="sl-muted" style={{ fontSize: 12.5, marginTop: 2 }}>{total} of {snap.products.length} tracked SKUs{categoryFilter ? ` · ${categoryFilter}` : ""}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <Tabs options={STOCK_TABS} value={stockFilter} onChange={setStockFilter} size="sm" />
            {(stockFilter !== "All" || categoryFilter) && <button className="btn btn-ghost" onClick={() => { setStockFilter("All"); setCategoryFilter(""); toast("Filters cleared."); }} style={{ fontSize: 12.5 }}>Clear filters</button>}
          </div>
        </div>
        <SortableTable columns={columns} rows={slice} sortKey={sortKey} sortDir={sortDir} onSort={onSort} onRowClick={(p) => navigate("/product/" + p.id)} rowKey={(p) => p.id} />
        {all.length === 0 && (
          <div style={{ padding: "32px 4px", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 8 }}>
            <div style={{ fontWeight: 600, fontSize: 15 }}>No products match these filters</div>
            <div className="sl-muted" style={{ fontSize: 13 }}>Try a different stock status, category, retailer or search term.</div>
            <button className="btn btn-secondary" onClick={() => { setStockFilter("All"); setCategoryFilter(""); }}>Reset filters</button>
          </div>
        )}
        <Pagination page={page} totalPages={totalPages} total={total} pageSize={8} onPage={setPage} />
      </Card>
    </PageShell>
  );
}
