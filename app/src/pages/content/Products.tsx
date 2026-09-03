import { useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { Card } from "../../components/ui/Card";
import { FacetPanel, type FacetGroup } from "../../components/ui/FacetPanel";
import { Badge, stockTone, opportunityTone } from "../../components/ui/Badge";
import { ProductCell } from "../../components/ui/ProductCell";
import { SortableTable, type Column } from "../../components/table/SortableTable";
import { Pagination } from "../../components/table/Pagination";
import { useSortedPage } from "../../hooks/useSortedPage";
import { deltaColor } from "../../lib/format";
import { productSorters } from "../../lib/productSort";
import type { Product } from "../../models/types";
import type { ContentContext } from "./Layout";

export default function ContentProducts() {
  const { products } = useOutletContext<ContentContext>();
  const navigate = useNavigate();
  const [stock, setStock] = useState<string[]>([]);
  const [opportunity, setOpportunity] = useState<string[]>([]);
  const [category, setCategory] = useState<string[]>([]);
  const [brand, setBrand] = useState<string[]>([]);

  const countBy = (key: keyof Product) => {
    const counts: Record<string, number> = {};
    products.forEach((p) => { const v = String(p[key]); counts[v] = (counts[v] || 0) + 1; });
    return counts;
  };
  const stockCounts = countBy("stockStatus");
  const oppCounts = countBy("opportunity");
  const catCounts = countBy("category");
  const brandCounts = countBy("brand");

  const facets: FacetGroup[] = [
    { id: "stock", title: "Stock status", selected: stock, onChange: setStock, options: ["In Stock", "Low Stock", "Out of Stock"].map((id) => ({ id, label: id, count: stockCounts[id] || 0 })) },
    { id: "opportunity", title: "Opportunity", selected: opportunity, onChange: setOpportunity, options: ["High", "Medium", "Low"].map((id) => ({ id, label: id, count: oppCounts[id] || 0 })) },
    { id: "category", title: "Category", selected: category, onChange: setCategory, options: Object.keys(catCounts).sort().map((id) => ({ id, label: id, count: catCounts[id] })) },
    { id: "brand", title: "Brand", selected: brand, onChange: setBrand, options: Object.keys(brandCounts).sort().map((id) => ({ id, label: id, count: brandCounts[id] })) },
  ];

  const all: Product[] = useMemo(() => products.filter((p) =>
    (stock.length === 0 || stock.includes(p.stockStatus)) &&
    (opportunity.length === 0 || opportunity.includes(p.opportunity)) &&
    (category.length === 0 || category.includes(p.category)) &&
    (brand.length === 0 || brand.includes(p.brand)),
  ), [products, stock, opportunity, category, brand]);

  const { slice, sortKey, sortDir, onSort, page, totalPages, setPage, total } = useSortedPage(
    all, productSorters, "contentScore", 8, [stock, opportunity, category, brand].join("|"),
  );

  const columns: Column<Product>[] = [
    { key: "name", label: "Product", minWidth: 240, sortable: true, render: (p) => <ProductCell id={p.id} name={p.name} sku={p.id.toUpperCase()} meta={`${p.category} · ${p.retailerName}`} /> },
    { key: "searchRank", label: "Search rank", align: "right", sortable: true, render: (p) => "#" + p.searchRank },
    { key: "price", label: "Price", align: "right", sortable: true, render: (p) => "$" + p.price.toFixed(2) },
    { key: "stockStatus", label: "Stock", sortable: true, render: (p) => <Badge tone={stockTone(p.stockStatus)}>{p.stockStatus}</Badge> },
    { key: "rating", label: "Rating", align: "right", sortable: true, render: (p) => p.rating.toFixed(2) },
    { key: "contentScore", label: "Content completeness", align: "right", sortable: true, render: (p) => <span style={{ fontWeight: 600, color: p.contentScore < 80 ? deltaColor(-1) : "inherit" }}>{p.contentScore}</span> },
    { key: "opportunity", label: "Opportunity", sortable: true, render: (p) => <Badge tone={opportunityTone(p.opportunity)}>{p.opportunity}</Badge> },
  ];

  return (
    <div style={{ display: "flex", gap: "var(--app-gap)", alignItems: "flex-start" }}>
      <FacetPanel groups={facets} onClearAll={() => { setStock([]); setOpportunity([]); setCategory([]); setBrand([]); }} />
      <Card padding="20px 22px 14px" style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 16 }}>
          <div><h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Products</h3><div className="sl-muted" style={{ fontSize: 12.5, marginTop: 2 }}>{total} of {products.length} tracked SKUs</div></div>
        </div>
        <SortableTable columns={columns} rows={slice} sortKey={sortKey} sortDir={sortDir} onSort={onSort} onRowClick={(p) => navigate("/product/" + p.id)} rowKey={(p) => p.id} />
        {all.length === 0 && (
          <div style={{ padding: "32px 4px", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 8 }}>
            <div style={{ fontWeight: 600, fontSize: 15 }}>No products match these filters</div>
            <div className="sl-muted" style={{ fontSize: 13 }}>Try clearing a filter.</div>
          </div>
        )}
        <Pagination page={page} totalPages={totalPages} total={total} pageSize={8} onPage={setPage} />
      </Card>
    </div>
  );
}
