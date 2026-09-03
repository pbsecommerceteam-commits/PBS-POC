import { useEffect, useMemo, useRef, useState } from "react";
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
   the identity column and can't be hidden. Deliberately excludes the 22
   Varient label/value pairs (too sparse across the catalog to read as a
   meaningful column) and Rank/Category 1-4 (ambiguous relationship to the
   retailer's own taxonomy in the source data) -- see build_mock_data.py's
   comment at the point these are read for the full reasoning. */
const COLUMN_OPTIONS: ColumnOption[] = [
  { id: "name", label: "Product" },
  { id: "titleLength", label: "Title Length" },
  { id: "bulletCount", label: "Bullet Points" },
  { id: "descriptionLength", label: "Description Length" },
  { id: "imageCount", label: "Images" },
  { id: "videoCount", label: "Videos" },
  { id: "has360Image", label: "360° Image" },
  { id: "enhancedContent", label: "Enhanced Content" },
  { id: "hasIngredients", label: "Ingredients List" },
  { id: "questionCount", label: "Questions" },
  { id: "contentScore", label: "Content Score" },
  { id: "completeness", label: "Content Completeness" },
  { id: "retailerId", label: "Retailer ID" },
  { id: "vendorStockNo", label: "Vendor Stock No." },
  { id: "siteCategory", label: "Site Category" },
  { id: "buyBoxSeller", label: "Buy Box Seller" },
  { id: "buyBoxShipper", label: "Buy Box Shipper" },
];
const DEFAULT_COLUMNS = new Set(COLUMN_OPTIONS.map((c) => c.id));

const yesNo = (v: boolean) => (v ? "Yes" : "No");
const ROW_HEIGHT = 65; // measured .sl-table row height (see app.css)
const CARD_CHROME = 260; // header/count row + search row + table header row + pagination + card padding

export default function ContentProducts() {
  const { products } = useOutletContext<ContentContext>();
  const navigate = useNavigate();
  const [stock, setStock] = useState<string[]>([]);
  const [opportunity, setOpportunity] = useState<string[]>([]);
  const [category, setCategory] = useState<string[]>([]);
  const [brand, setBrand] = useState<string[]>([]);
  const [issue, setIssue] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(DEFAULT_COLUMNS);
  const facetRef = useRef<HTMLDivElement>(null);
  const [pageSize, setPageSize] = useState(8);

  /* Matches the products table's height to the left filter rail's rendered
     height (which itself varies with how many brands/categories are in
     scope) rather than a fixed page size, so the two panels bottom out
     together instead of leaving a tall empty gap under a short table. */
  useEffect(() => {
    const el = facetRef.current;
    if (!el) return;
    const compute = () => {
      const rows = Math.floor((el.getBoundingClientRect().height - CARD_CHROME) / ROW_HEIGHT);
      setPageSize(Math.min(30, Math.max(8, rows)));
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

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

  const all: Product[] = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) =>
      (stock.length === 0 || stock.includes(p.stockStatus)) &&
      (opportunity.length === 0 || opportunity.includes(p.opportunity)) &&
      (category.length === 0 || category.includes(p.category)) &&
      (brand.length === 0 || brand.includes(p.brand)) &&
      (issue.length === 0 || issue.some((id) => p.contentChecks.includes(id))) &&
      (!q || p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q)),
    );
  }, [products, stock, opportunity, category, brand, issue, search]);

  const SORTERS = { ...productSorters, completeness: (a: Product, b: Product) => (8 - a.contentChecks.length) - (8 - b.contentChecks.length) };
  const { slice, sortKey, sortDir, onSort, page, totalPages, setPage, total } = useSortedPage(
    all, SORTERS, "contentScore", pageSize, [stock, opportunity, category, brand, issue, search, pageSize].join("|"),
  );

  /* Content-only columns -- no price, stock, rating or opportunity here (see
     Pricing Intelligence's Products table for those). Every field is real,
     straight from the Content-tab crawl (see build_mock_data.py). Product
     shows the full name across up to 2 lines rather than clipping to 1, so
     row height stays uniform without losing most titles to an ellipsis. */
  const ALL_COLUMNS: Column<Product>[] = [
    { key: "name", label: "Product", minWidth: 300, sortable: true, render: (p) => <ProductCell id={p.id} name={p.name} sku={p.id.toUpperCase()} meta={`${p.category} · ${p.retailerName}`} nameLines={2} /> },
    { key: "titleLength", label: "Title Length", align: "right", sortable: true, render: (p) => p.titleLength + " chars" },
    { key: "bulletCount", label: "Bullet Points", align: "right", sortable: true, render: (p) => p.bulletCount },
    { key: "descriptionLength", label: "Description Length", align: "right", sortable: true, render: (p) => p.descriptionLength + " chars" },
    { key: "imageCount", label: "Images", align: "right", sortable: true, render: (p) => p.imageCount },
    { key: "videoCount", label: "Videos", align: "right", sortable: true, render: (p) => p.videoCount },
    { key: "has360Image", label: "360° Image", sortable: true, render: (p) => <span className={p.has360Image ? undefined : "sl-muted"}>{yesNo(p.has360Image)}</span> },
    { key: "enhancedContent", label: "Enhanced Content", sortable: true, render: (p) => <span className={p.enhancedContent ? undefined : "sl-muted"}>{yesNo(p.enhancedContent)}</span> },
    { key: "hasIngredients", label: "Ingredients List", sortable: true, render: (p) => <span className={p.hasIngredients ? undefined : "sl-muted"}>{yesNo(p.hasIngredients)}</span> },
    { key: "questionCount", label: "Questions", align: "right", sortable: true, render: (p) => p.questionCount },
    { key: "contentScore", label: "Content Score", align: "right", sortable: true, render: (p) => <span style={{ fontWeight: 600, color: p.contentScore < 80 ? deltaColor(-1) : "inherit" }}>{p.contentScore}</span> },
    { key: "completeness", label: "Content Completeness", align: "right", sortable: true, render: (p) => <span>{8 - p.contentChecks.length}/8</span> },
    { key: "retailerId", label: "Retailer ID", sortable: true, render: (p) => p.retailerId },
    { key: "vendorStockNo", label: "Vendor Stock No.", sortable: true, render: (p) => p.vendorStockNo ?? "—" },
    { key: "siteCategory", label: "Site Category", minWidth: 200, sortable: true, render: (p) => p.siteCategory ?? "—" },
    { key: "buyBoxSeller", label: "Buy Box Seller", sortable: true, render: (p) => p.buyBoxSeller ?? "—" },
    { key: "buyBoxShipper", label: "Buy Box Shipper", sortable: true, render: (p) => p.buyBoxShipper ?? "—" },
  ];
  const columns = ALL_COLUMNS.filter((c) => c.key === "name" || visibleColumns.has(c.key));

  return (
    <div style={{ display: "flex", gap: "var(--app-gap)", alignItems: "flex-start" }}>
      <div ref={facetRef}>
        <FacetPanel groups={facets} onClearAll={() => { setStock([]); setOpportunity([]); setCategory([]); setBrand([]); setIssue([]); setSearch(""); }} />
      </div>
      <Card padding="20px 22px 14px" style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 14 }}>
          <div><h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Products</h3><div className="sl-muted" style={{ fontSize: 12.5, marginTop: 2 }}>{total} of {products.length} tracked SKUs</div></div>
          <ColumnPicker columns={COLUMN_OPTIONS} selected={visibleColumns} onChange={setVisibleColumns} lockedIds={["name"]} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <input className="input" placeholder="Search product, SKU, ASIN…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ minHeight: 32, fontSize: 12.5, maxWidth: 320 }} />
        </div>
        <SortableTable columns={columns} rows={slice} sortKey={sortKey} sortDir={sortDir} onSort={onSort} onRowClick={(p) => navigate("/product/" + p.id)} rowKey={(p) => p.id} />
        {all.length === 0 && (
          <div style={{ padding: "32px 4px", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 8 }}>
            <div style={{ fontWeight: 600, fontSize: 15 }}>No products match these filters</div>
            <div className="sl-muted" style={{ fontSize: 13 }}>Try clearing a filter or search term.</div>
          </div>
        )}
        <Pagination page={page} totalPages={totalPages} total={total} pageSize={pageSize} onPage={setPage} />
      </Card>
    </div>
  );
}
