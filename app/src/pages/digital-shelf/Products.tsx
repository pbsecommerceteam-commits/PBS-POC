import { useMemo, useState } from "react";
import { useNavigate, useOutletContext, useSearchParams } from "react-router-dom";
import { Card } from "../../components/ui/Card";
import { OpportunityCard } from "../../components/ui/OpportunityCard";
import { FacetPanel, type FacetGroup } from "../../components/ui/FacetPanel";
import { Badge, stockTone, opportunityTone } from "../../components/ui/Badge";
import { ProductCell } from "../../components/ui/ProductCell";
import { SortableTable, type Column } from "../../components/table/SortableTable";
import { Pagination } from "../../components/table/Pagination";
import { useUi } from "../../context/UiContext";
import { useSortedPage } from "../../hooks/useSortedPage";
import { deltaColor } from "../../lib/format";
import { productSorters } from "../../lib/productSort";
import type { Product } from "../../models/types";
import type { DigitalShelfContext } from "./Layout";

const FOCUS_LABEL: Record<string, string> = { rank: "Improve Search Visibility", avail: "Recover Availability", price: "Review Price Position", content: "Improve Content Completeness" };

export default function DigitalShelfProducts() {
  const { sh, categoryFilter, setCategoryFilter } = useOutletContext<DigitalShelfContext>();
  const { toast } = useUi();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const shelfFocus = params.get("focus") || "";
  const setShelfFocus = (f: string) => setParams(f ? { focus: f } : {}, { replace: true });

  const [stock, setStock] = useState<string[]>([]);
  const [opportunity, setOpportunity] = useState<string[]>([]);

  const focusPredicate = {
    rank: (p: Product) => p.searchRank > 10,
    avail: (p: Product) => p.inStockRate < 90,
    price: (p: Product) => p.priceIndex > 1.1,
    content: (p: Product) => p.contentScore < 80,
  }[shelfFocus];

  const products: Product[] = sh.products;
  const countBy = (pred: (p: Product) => boolean) => products.filter(pred).length;
  const stockCounts = { "In Stock": countBy((p) => p.stockStatus === "In Stock"), "Low Stock": countBy((p) => p.stockStatus === "Low Stock"), "Out of Stock": countBy((p) => p.stockStatus === "Out of Stock") };
  const oppCounts = { High: countBy((p) => p.opportunity === "High"), Medium: countBy((p) => p.opportunity === "Medium"), Low: countBy((p) => p.opportunity === "Low") };

  const facets: FacetGroup[] = [
    { id: "stock", title: "Stock status", selected: stock, onChange: setStock, options: Object.entries(stockCounts).map(([id, count]) => ({ id, label: id, count })) },
    { id: "opportunity", title: "Opportunity", selected: opportunity, onChange: setOpportunity, options: Object.entries(oppCounts).map(([id, count]) => ({ id, label: id, count })) },
  ];

  const all: Product[] = useMemo(() => products.filter((p) =>
    (stock.length === 0 || stock.includes(p.stockStatus)) &&
    (opportunity.length === 0 || opportunity.includes(p.opportunity)) &&
    (!categoryFilter || p.category === categoryFilter) &&
    (!focusPredicate || focusPredicate(p)),
  ), [products, stock, opportunity, categoryFilter, shelfFocus]);

  const { slice, sortKey, sortDir, onSort, page, totalPages, setPage, total } = useSortedPage(
    all, productSorters, "searchRank", 8, [stock, opportunity, categoryFilter, shelfFocus].join("|"),
  );

  const columns: Column<Product>[] = [
    { key: "name", label: "Product", minWidth: 220, sortable: true, render: (p) => <ProductCell id={p.id} name={p.name} sku={p.id.toUpperCase()} /> },
    { key: "category", label: "Category", sortable: true, render: (p) => <span style={{ fontSize: 13 }}>{p.category}</span> },
    { key: "retailerName", label: "Retailer", sortable: true, render: (p) => <span style={{ fontSize: 13 }}>{p.retailerName}</span> },
    { key: "searchRank", label: "Rank", align: "right", sortable: true, render: (p) => (<><span style={{ fontWeight: 600 }}>#{p.searchRank}</span><span style={{ fontSize: 11.5, marginLeft: 5, color: deltaColor(p.rankDelta) }}>{p.rankDelta === 0 ? "—" : (p.rankDelta > 0 ? "↑" : "↓") + Math.abs(p.rankDelta)}</span></>) },
    { key: "price", label: "Price", align: "right", sortable: true, render: (p) => "$" + p.price.toFixed(2) },
    { key: "inStockRate", label: "Availability", sortable: true, render: (p) => (<><Badge tone={stockTone(p.stockStatus)}>{p.stockStatus}</Badge><div className="sl-table-sub">{p.inStockRate.toFixed(1)}%</div></>) },
    { key: "contentScore", label: "Content completeness", align: "right", sortable: true, render: (p) => p.contentScore },
    { key: "shelfScore", label: "Shelf score", align: "right", minWidth: 110, sortable: true, render: (p) => (
      <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end" }}>
        <span className="sl-progress-track" style={{ width: 40 }}><span className="sl-progress-fill" style={{ width: p.shelfScore + "%" }}></span></span>
        <span style={{ fontWeight: 600, minWidth: 22 }}>{p.shelfScore}</span>
      </div>
    ) },
    { key: "opportunity", label: "Opportunity", sortable: true, render: (p) => <Badge tone={opportunityTone(p.opportunity)}>{p.opportunity}</Badge> },
  ];

  return (
    <>
      <section>
        <div style={{ marginBottom: 14 }}><h2 style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>Shelf opportunities</h2><div className="sl-muted" style={{ fontSize: 13, marginTop: 2 }}>Ranked by potential impact — selecting one filters the table below</div></div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(275px,1fr))", gap: "var(--app-gap)" }}>
          {sh.opportunities.map((o: any) => {
            const active = shelfFocus === o.focus;
            return (
              <OpportunityCard key={o.id} impact={o.impact + " impact"} impactTone={opportunityTone(o.impact)} count={o.count + (o.count === 1 ? " SKU affected" : " SKUs affected")}
                title={o.title} problem={o.problem} why={o.why} action={o.action} cta={active ? "Clear filter" : "View products →"} active={active}
                onGo={() => { setShelfFocus(active ? "" : o.focus); toast(active ? "Product filter cleared." : "Products filtered to " + o.title.toLowerCase() + ".") }} />
            );
          })}
        </div>
      </section>

      <div style={{ display: "flex", gap: "var(--app-gap)", alignItems: "flex-start" }}>
        <FacetPanel groups={facets} onClearAll={() => { setStock([]); setOpportunity([]); setShelfFocus(""); }} />
        <Card padding="20px 22px 14px" style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 16 }}>
            <div><h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Products</h3><div className="sl-muted" style={{ fontSize: 12.5, marginTop: 2 }}>{total} of {sh.products.length} tracked SKUs{categoryFilter ? ` · ${categoryFilter}` : ""}</div></div>
            {shelfFocus && <Badge tone="info">Opportunity: {FOCUS_LABEL[shelfFocus]}</Badge>}
          </div>
          <SortableTable columns={columns} rows={slice} sortKey={sortKey} sortDir={sortDir} onSort={onSort} onRowClick={(p) => navigate("/product/" + p.id)} rowKey={(p) => p.id} />
          {all.length === 0 && (
            <div style={{ padding: "32px 4px", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 8 }}>
              <div style={{ fontWeight: 600, fontSize: 15 }}>No products match these filters</div>
              <div className="sl-muted" style={{ fontSize: 13 }}>Try clearing a filter.</div>
              {categoryFilter && <button className="btn btn-secondary" onClick={() => setCategoryFilter("")}>Clear category filter</button>}
            </div>
          )}
          <Pagination page={page} totalPages={totalPages} total={total} pageSize={8} onPage={setPage} />
        </Card>
      </div>
    </>
  );
}
