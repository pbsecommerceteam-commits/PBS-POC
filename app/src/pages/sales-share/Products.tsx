import { useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { Card } from "../../components/ui/Card";
import { OpportunityCard } from "../../components/ui/OpportunityCard";
import { SortableTable, type Column } from "../../components/table/SortableTable";
import { Pagination } from "../../components/table/Pagination";
import { Tabs } from "../../components/ui/Tabs";
import { Badge, opportunityTone, stockTone } from "../../components/ui/Badge";
import { ProductCell } from "../../components/ui/ProductCell";
import { useUi } from "../../context/UiContext";
import { useSortedPage } from "../../hooks/useSortedPage";
import { deltaColor, delta } from "../../lib/format";
import { productSorters } from "../../lib/productSort";
import type { Product } from "../../models/types";
import type { SalesShareContext } from "./Layout";

type PerfTab = "top" | "improved" | "declined";
const TABS: Array<{ id: PerfTab; label: string; sortKey: string; dir: "asc" | "desc" }> = [
  { id: "top", label: "Top performers", sortKey: "shelfScore", dir: "desc" },
  { id: "improved", label: "Most improved", sortKey: "rankDelta", dir: "desc" },
  { id: "declined", label: "Most declined", sortKey: "rankDelta", dir: "asc" },
];

const SORTERS = { ...productSorters, rankDelta: (a: Product, b: Product) => a.rankDelta - b.rankDelta };

/* Search Visibility is derived from rank (see mockData withShelfMetrics), so a
   rank movement of N positions is a visibility movement of N * 3.4 pts. */
const visibilityDelta = (p: Product) => Math.round(p.rankDelta * 3.4 * 10) / 10;

export default function SalesShareProducts() {
  const { sd, sh, categoryFilter, setCategoryFilter } = useOutletContext<SalesShareContext>();
  const { toast } = useUi();
  const navigate = useNavigate();
  const [perfTab, setPerfTab] = useState<PerfTab>("top");

  const all: Product[] = useMemo(() => sd.products.filter((p: Product) =>
    (!categoryFilter || p.category === categoryFilter) &&
    (perfTab !== "improved" || p.rankDelta > 0) &&
    (perfTab !== "declined" || p.rankDelta < 0),
  ), [sd, categoryFilter, perfTab]);

  const { slice, sortKey, sortDir, onSort, setSort, page, totalPages, setPage, total } = useSortedPage(
    all, SORTERS, "shelfScore", 8, [categoryFilter, perfTab].join("|"),
  );

  const movers = sd.products.slice().sort((a: Product, b: Product) => visibilityDelta(b) - visibilityDelta(a));
  const improvements = movers.filter((p: Product) => visibilityDelta(p) > 0).slice(0, 4);
  const deteriorations = movers.filter((p: Product) => visibilityDelta(p) < 0).slice(-4).reverse();

  const columns: Column<Product>[] = [
    { key: "name", label: "Product", minWidth: 230, sortable: true, render: (p) => <ProductCell id={p.id} name={p.name} sku={p.id.toUpperCase()} /> },
    { key: "category", label: "Category", sortable: true, render: (p) => <span style={{ fontSize: 13 }}>{p.category}</span> },
    { key: "retailerName", label: "Retailer", sortable: true, render: (p) => <span style={{ fontSize: 13 }}>{p.retailerName}</span> },
    { key: "searchRank", label: "Search rank", align: "right", sortable: true, render: (p) => (
      <><span style={{ fontWeight: 600 }}>#{p.searchRank}</span><span style={{ fontSize: 11.5, marginLeft: 5, color: deltaColor(p.rankDelta) }}>{p.rankDelta === 0 ? "—" : (p.rankDelta > 0 ? "↑" : "↓") + Math.abs(p.rankDelta)}</span>
      <div className="sl-table-sub">{p.searchVisibility}% visibility</div></>
    ) },
    { key: "price", label: "Price", align: "right", sortable: true, render: (p) => (<><span>${p.price.toFixed(2)}</span><div className="sl-table-sub">Index {(p.priceIndex * 100).toFixed(0)}</div></>) },
    { key: "inStockRate", label: "Stock Availability 1P + 3P", align: "right", sortable: true, render: (p) => (<><Badge tone={stockTone(p.stockStatus)}>{p.stockStatus}</Badge><div className="sl-table-sub">{p.inStockRate.toFixed(1)}%</div></>) },
    { key: "rating", label: "Rating", align: "right", sortable: true, render: (p) => (<><span style={{ fontWeight: 500 }}>{p.rating.toFixed(2)}</span><div className="sl-table-sub">{p.reviews.toLocaleString()} reviews</div></>) },
    { key: "buyBox", label: "Buy box", render: (p) => <Badge tone={p.buyBox ? "positive" : "neutral"}>{p.buyBox ? "Held" : "Lost"}</Badge> },
    { key: "opportunity", label: "Opportunity", sortable: true, render: (p) => <Badge tone={opportunityTone(p.opportunity)}>{p.opportunity}</Badge> },
  ];

  return (
    <>
      <Card padding="20px 22px 14px">
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 16 }}>
          <div><h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Products</h3><div className="sl-muted" style={{ fontSize: 12.5, marginTop: 2 }}>{total} of {sd.products.length} tracked SKUs · {categoryFilter || "all categories"}</div></div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <Tabs options={TABS} value={perfTab} onChange={(id) => { const tb = TABS.find((x) => x.id === id)!; setPerfTab(id); setSort(tb.sortKey, tb.dir); }} />
            {(categoryFilter || perfTab !== "top") && <button className="btn btn-ghost" onClick={() => { setCategoryFilter(""); setPerfTab("top"); toast("Filters cleared."); }} style={{ fontSize: 12.5 }}>Clear filters</button>}
          </div>
        </div>
        <SortableTable columns={columns} rows={slice} sortKey={sortKey} sortDir={sortDir} onSort={onSort} onRowClick={(p) => navigate("/product/" + p.id)} rowKey={(p) => p.id} />
        {all.length === 0 && (
          <div style={{ padding: "32px 4px", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 8 }}>
            <div style={{ fontWeight: 600, fontSize: 15 }}>No products match this view</div>
            <div className="sl-muted" style={{ fontSize: 13 }}>Try another tab, category or search term.</div>
            <button className="btn btn-secondary" onClick={() => { setCategoryFilter(""); setPerfTab("top"); }}>Reset filters</button>
          </div>
        )}
        <Pagination page={page} totalPages={totalPages} total={total} pageSize={8} onPage={setPage} />
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,340px),1fr))", gap: "var(--app-gap)" }}>
        <Card padding="20px 22px 8px">
          <div style={{ marginBottom: 10 }}><h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Biggest improvements</h3><div className="sl-muted" style={{ fontSize: 12.5, marginTop: 2 }}>Products with the largest search visibility gain versus last period</div></div>
          {improvements.length === 0 && <div className="sl-muted" style={{ fontSize: 12.5, padding: "8px 0" }}>No product improved this period.</div>}
          {improvements.map((m: Product) => (
            <button key={m.id} className="sl-palette__row" onClick={() => navigate("/product/" + m.id)} style={{ justifyContent: "space-between", borderTop: "1px solid var(--border-subtle)" }}>
              <span style={{ minWidth: 0, textAlign: "left" }}><span style={{ display: "block", fontSize: 13.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name}</span><span className="sl-muted" style={{ fontSize: 11.5 }}>{m.retailerName}</span></span>
              <span style={{ textAlign: "right", whiteSpace: "nowrap" }}><span style={{ display: "block", fontWeight: 600, fontSize: 14, color: "var(--status-positive-fg)" }}>{delta(visibilityDelta(m), " pts")}</span><span className="sl-muted" style={{ fontSize: 11.5 }}>Search visibility</span></span>
            </button>
          ))}
        </Card>
        <Card padding="20px 22px 8px">
          <div style={{ marginBottom: 10 }}><h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Biggest deteriorations</h3><div className="sl-muted" style={{ fontSize: 12.5, marginTop: 2 }}>Products with the largest search visibility loss versus last period</div></div>
          {deteriorations.length === 0 && <div className="sl-muted" style={{ fontSize: 12.5, padding: "8px 0" }}>No product declined this period.</div>}
          {deteriorations.map((m: Product) => (
            <button key={m.id} className="sl-palette__row" onClick={() => navigate("/product/" + m.id)} style={{ justifyContent: "space-between", borderTop: "1px solid var(--border-subtle)" }}>
              <span style={{ minWidth: 0, textAlign: "left" }}><span style={{ display: "block", fontSize: 13.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name}</span><span className="sl-muted" style={{ fontSize: 11.5 }}>{m.retailerName}</span></span>
              <span style={{ textAlign: "right", whiteSpace: "nowrap" }}><span style={{ display: "block", fontWeight: 600, fontSize: 14, color: "var(--status-negative-fg)" }}>{delta(visibilityDelta(m), " pts")}</span><span className="sl-muted" style={{ fontSize: 11.5 }}>Search visibility</span></span>
            </button>
          ))}
        </Card>
      </div>

      <section>
        <div style={{ marginBottom: 14 }}><h2 style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>Opportunities</h2><div className="sl-muted" style={{ fontSize: 13, marginTop: 2 }}>Ranked by potential impact — each one opens the affected products on Digital Shelf</div></div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,275px),1fr))", gap: "var(--app-gap)" }}>
          {sh.opportunities.map((o: any) => (
            <OpportunityCard key={o.id} impact={o.impact + " impact"} impactTone={opportunityTone(o.impact)} count={o.count + (o.count === 1 ? " SKU affected" : " SKUs affected")}
              title={o.title} problem={o.problem} why={o.why} action={o.action} cta="View products →"
              onGo={() => { navigate(`/digital-shelf/products?focus=${o.focus}`); toast("Digital Shelf filtered to " + o.title.toLowerCase() + "."); }} />
          ))}
        </div>
      </section>
    </>
  );
}
