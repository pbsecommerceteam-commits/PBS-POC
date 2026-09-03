import { useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { Card } from "../../components/ui/Card";
import { FacetPanel, type FacetGroup } from "../../components/ui/FacetPanel";
import { ColumnPicker, type ColumnOption } from "../../components/ui/ColumnPicker";
import { ProductCell } from "../../components/ui/ProductCell";
import { SortableTable, type Column } from "../../components/table/SortableTable";
import { Pagination } from "../../components/table/Pagination";
import { useSortedPage } from "../../hooks/useSortedPage";
import { deltaColor } from "../../lib/format";
import { productSorters } from "../../lib/productSort";
import { CONTENT_CHECK_LABELS } from "../../data/mockData";
import type { Product } from "../../models/types";
import type { ContentContext } from "./Layout";

/* Every option here is a real raw Content-tab field (see build_mock_data.py
   and mockData.ts's productFor) -- no synthetic/derived label. "Product" is
   the identity column and can't be hidden. */
const COLUMN_OPTIONS: ColumnOption[] = [
  { id: "name", label: "Product" },
  { id: "titleLength", label: "Title Length" },
  { id: "bulletCount", label: "Bullet Points" },
  { id: "descriptionLength", label: "Description Length" },
  { id: "imageCount", label: "Images" },
  { id: "contentScore", label: "Content Score" },
  { id: "completeness", label: "Content Completeness" },
];
const DEFAULT_COLUMNS = new Set(COLUMN_OPTIONS.map((c) => c.id));

export default function ContentProducts() {
  const { products } = useOutletContext<ContentContext>();
  const navigate = useNavigate();
  const [stock, setStock] = useState<string[]>([]);
  const [opportunity, setOpportunity] = useState<string[]>([]);
  const [category, setCategory] = useState<string[]>([]);
  const [brand, setBrand] = useState<string[]>([]);
  const [issue, setIssue] = useState<string[]>([]);
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(DEFAULT_COLUMNS);

  const countBy = (key: keyof Product) => {
    const counts: Record<string, number> = {};
    products.forEach((p) => { const v = String(p[key]); counts[v] = (counts[v] || 0) + 1; });
    return counts;
  };
  const stockCounts = countBy("stockStatus");
  const oppCounts = countBy("opportunity");
  const catCounts = countBy("category");
  const brandCounts = countBy("brand");
  const issueCounts: Record<string, number> = {};
  products.forEach((p) => p.contentChecks.forEach((id) => { issueCounts[id] = (issueCounts[id] || 0) + 1; }));

  const facets: FacetGroup[] = [
    { id: "stock", title: "Stock status", selected: stock, onChange: setStock, options: ["In Stock", "Low Stock", "Out of Stock"].map((id) => ({ id, label: id, count: stockCounts[id] || 0 })) },
    { id: "opportunity", title: "Opportunity", selected: opportunity, onChange: setOpportunity, options: ["High", "Medium", "Low"].map((id) => ({ id, label: id, count: oppCounts[id] || 0 })) },
    { id: "category", title: "Category", selected: category, onChange: setCategory, options: Object.keys(catCounts).sort().map((id) => ({ id, label: id, count: catCounts[id] })) },
    { id: "brand", title: "Brand", selected: brand, onChange: setBrand, options: Object.keys(brandCounts).sort().map((id) => ({ id, label: id, count: brandCounts[id] })) },
    { id: "issue", title: "Content fields", selected: issue, onChange: setIssue, options: Object.keys(CONTENT_CHECK_LABELS).map((id) => ({ id, label: CONTENT_CHECK_LABELS[id], count: issueCounts[id] || 0 })) },
  ];

  const all: Product[] = useMemo(() => products.filter((p) =>
    (stock.length === 0 || stock.includes(p.stockStatus)) &&
    (opportunity.length === 0 || opportunity.includes(p.opportunity)) &&
    (category.length === 0 || category.includes(p.category)) &&
    (brand.length === 0 || brand.includes(p.brand)) &&
    (issue.length === 0 || issue.some((id) => p.contentChecks.includes(id))),
  ), [products, stock, opportunity, category, brand, issue]);

  const SORTERS = { ...productSorters, completeness: (a: Product, b: Product) => (8 - a.contentChecks.length) - (8 - b.contentChecks.length) };
  const { slice, sortKey, sortDir, onSort, page, totalPages, setPage, total } = useSortedPage(
    all, SORTERS, "contentScore", 8, [stock, opportunity, category, brand, issue].join("|"),
  );

  /* Content-only columns -- no price, stock, rating or opportunity here (see
     Pricing Intelligence's Products table for those). Every field is real:
     titleLength/bulletCount/descriptionLength/imageCount come straight from
     the Content-tab crawl (see build_mock_data.py), contentScore is the
     8-check rubric score, and completeness is "checks passed / 8" -- the
     same rubric, a different summary than the numeric score. */
  const ALL_COLUMNS: Column<Product>[] = [
    { key: "name", label: "Product", minWidth: 240, sortable: true, render: (p) => <ProductCell id={p.id} name={p.name} sku={p.id.toUpperCase()} meta={`${p.category} · ${p.retailerName}`} /> },
    { key: "titleLength", label: "Title Length", align: "right", sortable: true, render: (p) => p.titleLength + " chars" },
    { key: "bulletCount", label: "Bullet Points", align: "right", sortable: true, render: (p) => p.bulletCount },
    { key: "descriptionLength", label: "Description Length", align: "right", sortable: true, render: (p) => p.descriptionLength + " chars" },
    { key: "imageCount", label: "Images", align: "right", sortable: true, render: (p) => p.imageCount },
    { key: "contentScore", label: "Content Score", align: "right", sortable: true, render: (p) => <span style={{ fontWeight: 600, color: p.contentScore < 80 ? deltaColor(-1) : "inherit" }}>{p.contentScore}</span> },
    { key: "completeness", label: "Content Completeness", align: "right", sortable: true, render: (p) => <span>{8 - p.contentChecks.length}/8</span> },
  ];
  const columns = ALL_COLUMNS.filter((c) => c.key === "name" || visibleColumns.has(c.key));

  return (
    <div style={{ display: "flex", gap: "var(--app-gap)", alignItems: "flex-start" }}>
      <FacetPanel groups={facets} onClearAll={() => { setStock([]); setOpportunity([]); setCategory([]); setBrand([]); setIssue([]); }} />
      <Card padding="20px 22px 14px" style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 16 }}>
          <div><h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Products</h3><div className="sl-muted" style={{ fontSize: 12.5, marginTop: 2 }}>{total} of {products.length} tracked SKUs</div></div>
          <ColumnPicker columns={COLUMN_OPTIONS} selected={visibleColumns} onChange={setVisibleColumns} lockedIds={["name"]} />
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
