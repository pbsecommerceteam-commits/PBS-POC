import { useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { Card } from "../../components/ui/Card";
import { OpportunityCard } from "../../components/ui/OpportunityCard";
import { SortableTable, type Column } from "../../components/table/SortableTable";
import { Pagination } from "../../components/table/Pagination";
import { Tabs } from "../../components/ui/Tabs";
import { Badge, opportunityTone } from "../../components/ui/Badge";
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
  const [brand, setBrand] = useState("");
  const [search, setSearch] = useState("");
  const brands = useMemo(() => Array.from(new Set(sd.products.map((p: Product) => p.brand))).sort() as string[], [sd]);

  const all: Product[] = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sd.products.filter((p: Product) =>
      (!categoryFilter || p.category === categoryFilter) &&
      (!brand || p.brand === brand) &&
      (perfTab !== "improved" || p.rankDelta > 0) &&
      (perfTab !== "declined" || p.rankDelta < 0) &&
      (!q || p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q)),
    );
  }, [sd, categoryFilter, brand, perfTab, search]);

  const { slice, sortKey, sortDir, onSort, setSort, page, totalPages, setPage, total } = useSortedPage(
    all, SORTERS, "shelfScore", 8, [categoryFilter, brand, perfTab, search].join("|"),
  );

  const movers = sd.products.slice().sort((a: Product, b: Product) => visibilityDelta(b) - visibilityDelta(a));
  const improvements = movers.filter((p: Product) => visibilityDelta(p) > 0).slice(0, 4);
  const deteriorations = movers.filter((p: Product) => visibilityDelta(p) < 0).slice(-4).reverse();

  /* Pricing-only columns -- no search rank, rating or opportunity here (see
     Content Intelligence's Products table for those). "Competitor Price" is
     deliberately not a column: REAL_BUYBOX_COMPETITOR only carries who won
     the box and for how long, never a competitor's price, so Buy Box is the
     honest substitute. */
  const columns: Column<Product>[] = [
    { key: "name", label: "Product", minWidth: 230, sortable: true, render: (p) => <ProductCell id={p.id} name={p.name} sku={p.id.toUpperCase()} /> },
    { key: "retailerName", label: "Retailer", sortable: true, render: (p) => <span style={{ fontSize: 13 }}>{p.retailerName}</span> },
    { key: "currentPrice", label: "Current Price", align: "right", sortable: true, render: (p) => <span>${(p.currentPrice ?? p.price).toFixed(2)}</span> },
    { key: "listPrice", label: "List Price", align: "right", sortable: true, render: (p) => <span>{p.listPrice != null ? "$" + p.listPrice.toFixed(2) : "—"}</span> },
    { key: "priceDiff", label: "Price Difference", align: "right", render: (p) => {
      const cur = p.currentPrice ?? p.price;
      if (p.listPrice == null) return <span className="sl-faint">—</span>;
      const diff = cur - p.listPrice;
      return <span style={{ color: diff < 0 ? "var(--status-positive-fg)" : diff > 0 ? "var(--status-negative-fg)" : "inherit" }}>{diff === 0 ? "—" : (diff > 0 ? "+" : "−") + "$" + Math.abs(diff).toFixed(2)}</span>;
    } },
    { key: "priceChangePct", label: "Price Change", align: "right", sortable: true, render: (p) => <span style={{ color: deltaColor(p.priceChangePct) }}>{delta(p.priceChangePct, "%")}</span> },
    { key: "priceIndex", label: "Price Index", align: "right", sortable: true, render: (p) => <span>{(p.priceIndex * 100).toFixed(0)}</span> },
    { key: "buyBox", label: "Buy Box", render: (p) => <Badge tone={p.buyBox ? "positive" : "neutral"}>{p.buyBox ? "Held" : "Lost"}</Badge> },
  ];

  return (
    <>
      <Card padding="20px 22px 14px">
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 16 }}>
          <div><h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Products</h3><div className="sl-muted" style={{ fontSize: 12.5, marginTop: 2 }}>{total} of {sd.products.length} tracked SKUs · {categoryFilter || "all categories"}</div></div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <input className="input" placeholder="Search product, SKU, ASIN…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ minHeight: 32, fontSize: 12.5, width: 200 }} />
            <select className="input" value={brand} onChange={(e) => setBrand(e.target.value)} style={{ minHeight: 32, fontSize: 12.5 }}>
              <option value="">All brands</option>
              {brands.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
            <Tabs options={TABS} value={perfTab} onChange={(id) => { const tb = TABS.find((x) => x.id === id)!; setPerfTab(id); setSort(tb.sortKey, tb.dir); }} />
            {(categoryFilter || brand || search || perfTab !== "top") && <button className="btn btn-ghost" onClick={() => { setCategoryFilter(""); setBrand(""); setSearch(""); setPerfTab("top"); toast("Filters cleared."); }} style={{ fontSize: 12.5 }}>Clear filters</button>}
          </div>
        </div>
        <SortableTable columns={columns} rows={slice} sortKey={sortKey} sortDir={sortDir} onSort={onSort} onRowClick={(p) => navigate("/product/" + p.id)} rowKey={(p) => p.id} />
        {all.length === 0 && (
          <div style={{ padding: "32px 4px", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 8 }}>
            <div style={{ fontWeight: 600, fontSize: 15 }}>No products match this view</div>
            <div className="sl-muted" style={{ fontSize: 13 }}>Try another tab, category or search term.</div>
            <button className="btn btn-secondary" onClick={() => { setCategoryFilter(""); setBrand(""); setSearch(""); setPerfTab("top"); }}>Reset filters</button>
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
        <div style={{ marginBottom: 14 }}><h2 style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>Opportunities</h2><div className="sl-muted" style={{ fontSize: 13, marginTop: 2 }}>Ranked by potential impact — each one opens the affected products on Content Intelligence</div></div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,275px),1fr))", gap: "var(--app-gap)" }}>
          {sh.opportunities.map((o: any) => (
            <OpportunityCard key={o.id} impact={o.impact + " impact"} impactTone={opportunityTone(o.impact)} count={o.count + (o.count === 1 ? " SKU affected" : " SKUs affected")}
              title={o.title} problem={o.problem} why={o.why} action={o.action} cta="View products →"
              onGo={() => { navigate(`/content/products?focus=${o.focus}`); toast("Content filtered to " + o.title.toLowerCase() + "."); }} />
          ))}
        </div>
      </section>
    </>
  );
}
