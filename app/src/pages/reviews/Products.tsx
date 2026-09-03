import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { Card } from "../../components/ui/Card";
import { FacetPanel, type FacetGroup } from "../../components/ui/FacetPanel";
import { Badge, stockTone, opportunityTone } from "../../components/ui/Badge";
import { ProductCell } from "../../components/ui/ProductCell";
import { SortableTable, type Column } from "../../components/table/SortableTable";
import { Pagination } from "../../components/table/Pagination";
import { useUi } from "../../context/UiContext";
import { useSortedPage } from "../../hooks/useSortedPage";
import { columnsToCsv } from "../../lib/format";
import { productSorters } from "../../lib/productSort";
import type { Product } from "../../models/types";
import type { ReviewsContext } from "./Layout";

const STAR_BUCKETS = ["5", "4", "3", "2", "1"];
const starOf = (p: Product) => String(Math.max(1, Math.min(5, Math.round(p.rating))));

/* Reviews-only columns -- rating/volume plus just enough product context
   (price, stock, opportunity) to act on a row. Hoisted to module scope so
   reviews/Layout.tsx can reuse the exact same columns -- with the exact
   same `csv` extractors -- for its default export. No column picker on
   this table (every column is always shown), so "all columns" for export
   purposes is simply this whole list. */
export const REVIEWS_COLUMNS: Column<Product>[] = [
  { key: "name", label: "Product", minWidth: 240, sortable: true, render: (p) => <ProductCell id={p.id} name={p.name} sku={p.id.toUpperCase()} meta={`${p.category} · ${p.retailerName}`} />, csv: (p) => `${p.id.toUpperCase()} - ${p.name}` },
  { key: "rating", label: "Rating", align: "right", sortable: true, render: (p) => <span style={{ fontWeight: 600 }}>{p.rating.toFixed(2)}</span>, csv: (p) => p.rating.toFixed(2) },
  { key: "reviews", label: "Reviews", align: "right", sortable: true, render: (p) => p.reviews.toLocaleString(), csv: (p) => p.reviews },
  { key: "price", label: "Price", align: "right", sortable: true, render: (p) => "$" + p.price.toFixed(2), csv: (p) => p.price.toFixed(2) },
  { key: "stockStatus", label: "Stock", sortable: true, render: (p) => <Badge tone={stockTone(p.stockStatus)}>{p.stockStatus}</Badge>, csv: (p) => p.stockStatus },
  { key: "opportunity", label: "Opportunity", sortable: true, render: (p) => <Badge tone={opportunityTone(p.opportunity)}>{p.opportunity}</Badge>, csv: (p) => p.opportunity },
];

export default function ReviewsProducts() {
  const { products, registerExport } = useOutletContext<ReviewsContext>();
  const { toast } = useUi();
  const navigate = useNavigate();
  const [stars, setStars] = useState<string[]>([]);
  const [stock, setStock] = useState<string[]>([]);

  const starCounts: Record<string, number> = {};
  products.forEach((p) => { const s = starOf(p); starCounts[s] = (starCounts[s] || 0) + 1; });
  const stockCounts: Record<string, number> = {};
  products.forEach((p) => { stockCounts[p.stockStatus] = (stockCounts[p.stockStatus] || 0) + 1; });

  const facets: FacetGroup[] = [
    { id: "stars", title: "Star rating", selected: stars, onChange: setStars, options: STAR_BUCKETS.map((id) => ({ id, label: id + " star" + (id === "1" ? "" : "s"), count: starCounts[id] || 0 })) },
    { id: "stock", title: "Stock status", selected: stock, onChange: setStock, options: ["In Stock", "Low Stock", "Out of Stock"].map((id) => ({ id, label: id, count: stockCounts[id] || 0 })) },
  ];

  const all: Product[] = useMemo(() => products.filter((p) =>
    (stars.length === 0 || stars.includes(starOf(p))) &&
    (stock.length === 0 || stock.includes(p.stockStatus)),
  ), [products, stars, stock]);

  const { slice, sortKey, sortDir, onSort, page, totalPages, setPage, total } = useSortedPage(
    all, productSorters, "rating", 8, [stars, stock].join("|"),
  );

  /* Hands the shared header's Export button to THIS page's current
     filtered rows while Products is mounted (see
     ReviewsContext.registerExport) -- see content/Products.tsx's export
     effect for the full rationale on the ref pattern. */
  const exportRef = useRef({ all, toast });
  useEffect(() => { exportRef.current = { all, toast }; });
  useEffect(() => {
    registerExport(() => {
      const { all, toast } = exportRef.current;
      if (!all.length) { toast("Nothing to export."); return; }
      const blob = new Blob([columnsToCsv(all, REVIEWS_COLUMNS)], { type: "text/csv;charset=utf-8" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "shelfline-products-reviews.csv";
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      toast(`Exported ${all.length} rows.`);
    });
    return () => registerExport(null);
  }, [registerExport]);

  return (
    <div style={{ display: "flex", gap: "var(--app-gap)", alignItems: "flex-start" }}>
      <FacetPanel groups={facets} onClearAll={() => { setStars([]); setStock([]); }} />
      <Card padding="20px 22px 14px" style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 16 }}>
          <div><h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Products</h3><div className="sl-muted" style={{ fontSize: 12.5, marginTop: 2 }}>{total} of {products.length} tracked SKUs</div></div>
        </div>
        <SortableTable columns={REVIEWS_COLUMNS} rows={slice} sortKey={sortKey} sortDir={sortDir} onSort={onSort} onRowClick={(p) => navigate("/product/" + p.id)} rowKey={(p) => p.id} />
        {all.length === 0 && (
          <div style={{ padding: "32px 4px", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 8 }}>
            <div style={{ fontWeight: 600, fontSize: 15 }}>No products match this view</div>
            <div className="sl-muted" style={{ fontSize: 13 }}>Try clearing a filter.</div>
          </div>
        )}
        <Pagination page={page} totalPages={totalPages} total={total} pageSize={8} onPage={setPage} />
      </Card>
    </div>
  );
}
