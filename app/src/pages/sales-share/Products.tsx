import { useEffect, useMemo, useRef, useState } from "react";
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
import { columnsToCsv, deltaColor, delta } from "../../lib/format";
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

/* Every one of the 14 real Price-tab columns (everything but Crawl date)
   is represented somewhere below -- Product/Retailer/List Price/Current
   Price were already here (Product name/Retailer site/List everyday
   price/Current price); Category, Retailer ID, Vendor Stock No.,
   Subscription Price, Coupon Value, Stock Status, Buy Box Seller, Buy Box
   Shipper and Listing Link are the other 9. Price Difference/Price
   Change/Price Index/Buy Box (Held-Lost) stay too -- real derived
   metrics, not raw fields, and worth keeping alongside them. "Competitor
   Price" is deliberately still not a column: REAL_BUYBOX_COMPETITOR only
   carries who won the box and for how long, never a competitor's price,
   so Buy Box is the honest substitute. Hoisted to module scope (not a
   `const` inside the component) so sales-share/Layout.tsx can reuse the
   exact same columns -- with the exact same `csv` extractors -- for its
   default export, with no second column list to keep in sync. There's no
   column picker on this table (every column here is always shown), so
   "all columns" for export purposes is simply this whole list. */
export const SALES_COLUMNS: Column<Product>[] = [
  { key: "name", label: "Product", minWidth: 230, sortable: true, render: (p) => <ProductCell id={p.id} name={p.name} sku={p.id.toUpperCase()} imageUrl={p.imageUrl} />, csv: (p) => `${p.id.toUpperCase()} - ${p.name}` },
  { key: "category", label: "Category", sortable: true, render: (p) => p.category, csv: (p) => p.category },
  { key: "retailerName", label: "Retailer", sortable: true, render: (p) => <span style={{ fontSize: 13 }}>{p.retailerName}</span>, csv: (p) => p.retailerName },
  { key: "retailerId", label: "Retailer ID", sortable: true, render: (p) => p.retailerId ?? "—", csv: (p) => p.retailerId ?? "" },
  { key: "brand", label: "Brand", sortable: true, render: (p) => p.brand, csv: (p) => p.brand },
  { key: "vendorStockNo", label: "Vendor Stock No.", sortable: true, render: (p) => p.vendorStockNo ?? "—", csv: (p) => p.vendorStockNo ?? "" },
  { key: "currentPrice", label: "Current Price", align: "right", sortable: true, render: (p) => <span>${(p.currentPrice ?? p.price).toFixed(2)}</span>, csv: (p) => (p.currentPrice ?? p.price).toFixed(2) },
  { key: "listPrice", label: "List Price", align: "right", sortable: true, render: (p) => <span>{p.listPrice != null ? "$" + p.listPrice.toFixed(2) : "—"}</span>, csv: (p) => p.listPrice != null ? p.listPrice.toFixed(2) : "" },
  { key: "subscriptionPrice", label: "Subscription Price", align: "right", sortable: true, render: (p) => <span>{p.subscriptionPrice != null ? "$" + p.subscriptionPrice.toFixed(2) : "—"}</span>, csv: (p) => p.subscriptionPrice != null ? p.subscriptionPrice.toFixed(2) : "" },
  { key: "couponValue", label: "Coupon Value", align: "right", sortable: true, render: (p) => p.couponValue ?? "—", csv: (p) => p.couponValue ?? "" },
  { key: "priceDiff", label: "Price Difference", align: "right", render: (p) => {
    const cur = p.currentPrice ?? p.price;
    if (p.listPrice == null) return <span className="sl-faint">—</span>;
    const diff = cur - p.listPrice;
    return <span style={{ color: diff < 0 ? "var(--status-positive-fg)" : diff > 0 ? "var(--status-negative-fg)" : "inherit" }}>{diff === 0 ? "—" : (diff > 0 ? "+" : "−") + "$" + Math.abs(diff).toFixed(2)}</span>;
  }, csv: (p) => p.listPrice != null ? ((p.currentPrice ?? p.price) - p.listPrice).toFixed(2) : "" },
  { key: "priceChangePct", label: "Price Change", align: "right", sortable: true, render: (p) => <span style={{ color: deltaColor(p.priceChangePct) }}>{delta(p.priceChangePct, "%")}</span>, csv: (p) => p.priceChangePct },
  { key: "priceIndex", label: "Price Index", align: "right", sortable: true, render: (p) => <span>{(p.priceIndex * 100).toFixed(0)}</span>, csv: (p) => (p.priceIndex * 100).toFixed(0) },
  { key: "stockStatusRaw", label: "Stock Status", sortable: true, render: (p) => p.stockStatusRaw ?? "—", csv: (p) => p.stockStatusRaw ?? "" },
  { key: "buyBox", label: "Buy Box", render: (p) => <Badge tone={p.buyBox ? "positive" : "neutral"}>{p.buyBox ? "Held" : "Lost"}</Badge>, csv: (p) => p.buyBox ? "Held" : "Lost" },
  { key: "buyBoxSeller", label: "Buy Box Seller", sortable: true, render: (p) => p.buyBoxSeller ?? "—", csv: (p) => p.buyBoxSeller ?? "" },
  { key: "buyBoxShipper", label: "Buy Box Shipper", sortable: true, render: (p) => p.buyBoxShipper ?? "—", csv: (p) => p.buyBoxShipper ?? "" },
  { key: "spbUrl", label: "Listing Link", render: (p) => p.spbUrl
    ? <a href={p.spbUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>View listing →</a>
    : <span className="sl-faint">—</span>, csv: (p) => p.spbUrl ?? "" },
];

export default function SalesShareProducts() {
  const { sd, sh, categoryFilter, setCategoryFilter, registerExport } = useOutletContext<SalesShareContext>();
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

  /* Hands the shared header's Export button to THIS page's current
     filtered rows while Products is mounted (see
     SalesShareContext.registerExport) -- registered once via a ref so the
     handler always reads the latest `all` at click-time without
     re-registering on every keystroke/filter change. Exports every
     matching row, not just the current page. */
  const exportRef = useRef({ all, toast });
  useEffect(() => { exportRef.current = { all, toast }; });
  useEffect(() => {
    registerExport(() => {
      const { all, toast } = exportRef.current;
      if (!all.length) { toast("Nothing to export."); return; }
      const blob = new Blob([columnsToCsv(all, SALES_COLUMNS)], { type: "text/csv;charset=utf-8" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "shelfline-products-sales-share.csv";
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      toast(`Exported ${all.length} rows.`);
    });
    return () => registerExport(null);
  }, [registerExport]);

  return (
    <>
      <Card padding="20px 22px 14px">
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 14 }}>
          <div><h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Products</h3><div className="sl-muted" style={{ fontSize: 12.5, marginTop: 2 }}>{total} of {sd.products.length} tracked SKUs · {categoryFilter || "all categories"}</div></div>
          {(categoryFilter || brand || search || perfTab !== "top") && <button className="btn btn-ghost" onClick={() => { setCategoryFilter(""); setBrand(""); setSearch(""); setPerfTab("top"); toast("Filters cleared."); }} style={{ fontSize: 12.5 }}>Clear filters</button>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
          <input className="input" placeholder="Search product, SKU, ASIN…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ minHeight: 32, fontSize: 12.5, flex: "1 1 240px", minWidth: 200 }} />
          <Tabs options={TABS} value={perfTab} onChange={(id) => { const tb = TABS.find((x) => x.id === id)!; setPerfTab(id); setSort(tb.sortKey, tb.dir); }} />
          <select className="input" value={brand} onChange={(e) => setBrand(e.target.value)} style={{ minHeight: 32, fontSize: 12.5, width: 160, flex: "none" }}>
            <option value="">All brands</option>
            {brands.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        <SortableTable columns={SALES_COLUMNS} rows={slice} sortKey={sortKey} sortDir={sortDir} onSort={onSort} onRowClick={(p) => navigate("/product/" + p.id)} rowKey={(p) => p.id} />
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
