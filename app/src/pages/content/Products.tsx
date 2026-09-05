import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useNavigate, useOutletContext, useSearchParams } from "react-router-dom";
import { Card } from "../../components/ui/Card";
import { FacetPanel, type FacetGroup } from "../../components/ui/FacetPanel";
import { ColumnPicker, type ColumnOption } from "../../components/ui/ColumnPicker";
import { ProductCell } from "../../components/ui/ProductCell";
import { SortableTable, type Column } from "../../components/table/SortableTable";
import { Pagination } from "../../components/table/Pagination";
import { useUi } from "../../context/UiContext";
import { useSortedPage } from "../../hooks/useSortedPage";
import { columnsToCsv } from "../../lib/format";
import { productSorters } from "../../lib/productSort";
import { CONTENT_CHECK_LABELS } from "../../data/mockData";
import { passFail, CHECK_COLUMNS } from "./contentChecks";
import type { Product } from "../../models/types";
import type { ContentContext } from "./Layout";

const yesNo = (v: boolean) => (v ? "Yes" : "No");
function ScorePill({ pass }: { pass: boolean }) {
  return (
    <span style={{
      display: "inline-block", minWidth: 52, textAlign: "center", padding: "2px 8px", borderRadius: 999, fontWeight: 600, fontSize: 12.5,
      color: pass ? "var(--status-positive-fg)" : "var(--status-critical-fg)",
      background: pass ? "var(--status-positive-bg)" : "var(--status-critical-bg)",
    }}>{pass ? "100.00" : "0.00"}</span>
  );
}

const CLAMP_STYLE: CSSProperties = { display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "normal", lineHeight: 1.35, maxWidth: 320, minHeight: 58 };
function ClampedText({ text }: { text: string | null }) {
  if (!text) return <span className="sl-muted">—</span>;
  return <span title={text} style={CLAMP_STYLE}>{text}</span>;
}

/* Content-only columns -- no price, stock, rating or opportunity here (see
   Pricing Intelligence's Products table for those). Every field is real,
   straight from the Content-tab crawl (see build_mock_data.py). Product
   shows the full name across up to 3 lines rather than clipping to 1, so
   row height stays uniform without losing most titles to an ellipsis.
   Column widths are sized to the content each one actually holds (narrow
   for short counts/flags, wide for real copy) so nothing feels cramped or
   is left needlessly wide. Hoisted to module scope (not just a `const`
   inside the component) so content/Layout.tsx can reuse the exact same
   column set -- with the exact same `csv` extractors -- for the
   Summary/Benchmarks default export, without a second column list to keep
   in sync. `csv` sits next to each `render` so the two can never drift:
   whatever a column visually shows is what it exports, in plain text. */
export const CONTENT_COLUMNS: Column<Product>[] = [
  { key: "name", label: "Product", minWidth: 320, sortable: true, render: (p) => <ProductCell id={p.id} name={p.name} nameLines={3} imageSize={44} imageUrl={p.imageUrl} />, csv: (p) => p.name },
  { key: "category", label: "Category", minWidth: 90, sortable: true, render: (p) => p.category, csv: (p) => p.category },
  { key: "retailerName", label: "Retailer", minWidth: 110, sortable: true, render: (p) => p.retailerName, csv: (p) => p.retailerName },
  { key: "retailerId", label: "Retailer ID", minWidth: 120, sortable: true, render: (p) => p.retailerId, csv: (p) => p.retailerId },
  { key: "descriptionText", label: "Product Description", minWidth: 280, sortable: true, render: (p) => <ClampedText text={p.descriptionText} />, csv: (p) => p.descriptionText ?? "" },
  { key: "bulletsText", label: "Bullet Points", minWidth: 280, sortable: true, render: (p) => <ClampedText text={p.bulletsText.length ? p.bulletsText.join(" • ") : null} />, csv: (p) => p.bulletsText.join(" | ") },
  { key: "variations", label: "Variations", minWidth: 220, sortable: true, render: (p) => <ClampedText text={p.variations.length ? p.variations.join(", ") : null} />, csv: (p) => p.variations.join(", ") },
  { key: "variationCount", label: "Variation Count", align: "right", minWidth: 110, sortable: true, render: (p) => p.variations.length, csv: (p) => p.variations.length },
  { key: "ingredientsText", label: "Ingredients List", minWidth: 260, sortable: true, render: (p) => <ClampedText text={p.ingredientsText} />, csv: (p) => p.ingredientsText ?? "" },
  { key: "titleLength", label: "Title Length", align: "right", minWidth: 110, sortable: true, render: (p) => p.titleLength + " chars", csv: (p) => p.titleLength },
  { key: "imageCount", label: "Images", align: "right", minWidth: 90, sortable: true, render: (p) => p.imageCount, csv: (p) => p.imageCount },
  { key: "videoCount", label: "Videos", align: "right", minWidth: 90, sortable: true, render: (p) => p.videoCount, csv: (p) => p.videoCount },
  { key: "has360Image", label: "360° Image", minWidth: 110, sortable: true, render: (p) => <span className={p.has360Image ? undefined : "sl-muted"}>{yesNo(p.has360Image)}</span>, csv: (p) => yesNo(p.has360Image) },
  { key: "enhancedContent", label: "Enhanced Content", minWidth: 140, sortable: true, render: (p) => <span className={p.enhancedContent ? undefined : "sl-muted"}>{yesNo(p.enhancedContent)}</span>, csv: (p) => yesNo(p.enhancedContent) },
  { key: "questionCount", label: "Questions", align: "right", minWidth: 100, sortable: true, render: (p) => p.questionCount, csv: (p) => p.questionCount },
  { key: "completeness", label: "Content Completeness", align: "right", minWidth: 150, sortable: true, render: (p) => <span style={{ fontWeight: 600, color: (9 - p.contentChecks.length) / 9 * 100 < 80 ? "var(--status-critical-fg)" : "inherit" }}>{Math.round(((9 - p.contentChecks.length) / 9) * 100)}%</span>, csv: (p) => Math.round(((9 - p.contentChecks.length) / 9) * 100) },
  ...CHECK_COLUMNS.map((c): Column<Product> => ({
    key: c.key, label: c.label, align: "right", minWidth: 100, sortable: true,
    render: (p) => <ScorePill pass={passFail(p, c.id)} />,
    csv: (p) => passFail(p, c.id) ? 100 : 0,
  })),
  { key: "vendorStockNo", label: "Vendor Stock No.", minWidth: 130, sortable: true, render: (p) => p.vendorStockNo ?? "—", csv: (p) => p.vendorStockNo ?? "" },
  { key: "siteCategory", label: "Site Category", minWidth: 200, sortable: true, render: (p) => p.siteCategory ?? "—", csv: (p) => p.siteCategory ?? "" },
  { key: "buyBoxSeller", label: "Buy Box Seller", minWidth: 150, sortable: true, render: (p) => p.buyBoxSeller ?? "—", csv: (p) => p.buyBoxSeller ?? "" },
  { key: "buyBoxShipper", label: "Buy Box Shipper", minWidth: 150, sortable: true, render: (p) => p.buyBoxShipper ?? "—", csv: (p) => p.buyBoxShipper ?? "" },
];

/* Every option here is a real raw Content-tab field (see build_mock_data.py
   and mockData.ts's productFor) -- no synthetic/derived label. "Product" is
   the identity column and can't be hidden. Deliberately excludes Rank/
   Category 1-4 (ambiguous relationship to the retailer's own taxonomy in
   the source data) -- see build_mock_data.py's comment at the point these
   are read. */
const COLUMN_OPTIONS: ColumnOption[] = CONTENT_COLUMNS.map((c) => ({ id: c.key, label: c.label }));
const DEFAULT_COLUMNS = new Set(COLUMN_OPTIONS.map((c) => c.id));
/* Default table/export order: Product (pinned, see below) then Category,
   Retailer, Retailer ID, Product Description, Bullet Points, Variations,
   Variation Count and Ingredients up front as the fields most worth
   reviewing, then every remaining column in its original relative order.
   "Product" is excluded here (and from the picker's reorderable list) so
   it always renders first, same as it's excluded from being hidden. */
export const DEFAULT_CONTENT_COLUMN_ORDER = CONTENT_COLUMNS.map((c) => c.key).filter((id) => id !== "name");

const ROW_HEIGHT = 85; // measured .sl-table row height (3-line clamp minHeight, no more sku/meta subtitle under Product)
const CARD_CHROME = 260; // header/count row + search row + table header row + pagination + card padding

export default function ContentProducts() {
  const { products, registerExport } = useOutletContext<ContentContext>();
  const navigate = useNavigate();
  const { toast } = useUi();
  const [searchParams] = useSearchParams();
  const [stock, setStock] = useState<string[]>([]);
  const [opportunity, setOpportunity] = useState<string[]>([]);
  const [category, setCategory] = useState<string[]>([]);
  /* Pre-selects the Brand facet when arriving via a "?brand=" link (the
     Brand tab's score drill-down) -- read once at mount, same as every
     other filter here starts from a plain empty default otherwise. */
  const [brand, setBrand] = useState<string[]>(() => {
    const b = searchParams.get("brand");
    return b ? [b] : [];
  });
  const [retailer, setRetailer] = useState<string[]>([]);
  const [issue, setIssue] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(DEFAULT_COLUMNS);
  const [columnOrder, setColumnOrder] = useState<string[]>(DEFAULT_CONTENT_COLUMN_ORDER);
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

  /* Each facet's own predicate (mirrors the `all` filter below) so its
     options can be counted against every OTHER active facet's selection --
     this is what makes the rail context-aware: picking Amazon recomputes
     Category/Brand/Content-fields option counts down to only what Amazon
     actually has, rather than the whole unfiltered catalog. A facet never
     filters by its own selection when counting its own options, or
     checking a second value in the same group would immediately zero out
     every other option in that group (multi-select-within-a-group is
     still an OR). */
  const q = search.trim().toLowerCase();
  const matches = {
    retailer: (p: Product) => retailer.length === 0 || retailer.includes(p.retailerName),
    stock: (p: Product) => stock.length === 0 || stock.includes(p.stockStatus),
    opportunity: (p: Product) => opportunity.length === 0 || opportunity.includes(p.opportunity),
    category: (p: Product) => category.length === 0 || category.includes(p.category),
    brand: (p: Product) => brand.length === 0 || brand.includes(p.brand),
    issue: (p: Product) => issue.length === 0 || issue.some((id) => p.contentChecks.includes(id)),
    search: (p: Product) => !q || p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q),
  };
  type FacetKey = keyof typeof matches;
  const poolExcluding = (exclude: FacetKey) =>
    products.filter((p) => (Object.keys(matches) as FacetKey[]).every((k) => k === exclude || matches[k](p)));

  const countByExcluding = (exclude: FacetKey, keyFn: (p: Product) => string) => {
    const counts: Record<string, number> = {};
    poolExcluding(exclude).forEach((p) => { const v = keyFn(p); counts[v] = (counts[v] || 0) + 1; });
    return counts;
  };
  const stockCounts = countByExcluding("stock", (p) => p.stockStatus);
  const oppCounts = countByExcluding("opportunity", (p) => p.opportunity);
  const catCounts = countByExcluding("category", (p) => p.category);
  const brandCounts = countByExcluding("brand", (p) => p.brand);
  const retailerCounts = countByExcluding("retailer", (p) => p.retailerName);
  const issueCounts: Record<string, number> = {};
  poolExcluding("issue").forEach((p) => p.contentChecks.forEach((id) => { issueCounts[id] = (issueCounts[id] || 0) + 1; }));

  /* Only ever show an option that's actually reachable given every other
     active filter -- except one the user already checked, which stays
     visible (still checked, now at 0) rather than vanishing out from
     under them the instant it stops matching. */
  const visible = (counts: Record<string, number>, selected: string[], id: string) => (counts[id] || 0) > 0 || selected.includes(id);

  const facets: FacetGroup[] = [
    { id: "retailer", title: "Retailer", selected: retailer, onChange: setRetailer, options: Object.keys(retailerCounts).sort().filter((id) => visible(retailerCounts, retailer, id)).map((id) => ({ id, label: id, count: retailerCounts[id] || 0 })) },
    { id: "stock", title: "Stock status", selected: stock, onChange: setStock, options: ["In Stock", "Low Stock", "Out of Stock"].filter((id) => visible(stockCounts, stock, id)).map((id) => ({ id, label: id, count: stockCounts[id] || 0 })) },
    { id: "opportunity", title: "Opportunity", selected: opportunity, onChange: setOpportunity, options: ["High", "Medium", "Low"].filter((id) => visible(oppCounts, opportunity, id)).map((id) => ({ id, label: id, count: oppCounts[id] || 0 })) },
    { id: "category", title: "Category", selected: category, onChange: setCategory, options: Object.keys(catCounts).sort().filter((id) => visible(catCounts, category, id)).map((id) => ({ id, label: id, count: catCounts[id] || 0 })) },
    { id: "brand", title: "Brand", selected: brand, onChange: setBrand, options: Object.keys(brandCounts).sort().filter((id) => visible(brandCounts, brand, id)).map((id) => ({ id, label: id, count: brandCounts[id] || 0 })) },
    { id: "issue", title: "Content fields", selected: issue, onChange: setIssue, options: Object.keys(CONTENT_CHECK_LABELS).filter((id) => visible(issueCounts, issue, id)).map((id) => ({ id, label: CONTENT_CHECK_LABELS[id], count: issueCounts[id] || 0 })) },
  ];

  const all: Product[] = products.filter((p) => (Object.keys(matches) as FacetKey[]).every((k) => matches[k](p)));

  const SORTERS = { ...productSorters, completeness: (a: Product, b: Product) => (9 - a.contentChecks.length) - (9 - b.contentChecks.length),
    bulletsText: (a: Product, b: Product) => a.bulletsText.length - b.bulletsText.length,
    descriptionText: (a: Product, b: Product) => a.descriptionLength - b.descriptionLength,
    ingredientsText: (a: Product, b: Product) => Number(!!b.ingredientsText) - Number(!!a.ingredientsText),
    variationCount: (a: Product, b: Product) => a.variations.length - b.variations.length,
    variations: (a: Product, b: Product) => a.variations.length - b.variations.length,
    ...Object.fromEntries(CHECK_COLUMNS.map((c) => [c.key, (a: Product, b: Product) => Number(passFail(a, c.id)) - Number(passFail(b, c.id))])) };
  const { slice, sortKey, sortDir, onSort, page, totalPages, setPage, total } = useSortedPage(
    all, SORTERS, "completeness", pageSize, [retailer, stock, opportunity, category, brand, issue, search, pageSize].join("|"),
  );

  const columnByKey = new Map(CONTENT_COLUMNS.map((c) => [c.key, c]));
  const columns = [
    columnByKey.get("name")!,
    ...columnOrder.map((id) => columnByKey.get(id)).filter((c): c is Column<Product> => !!c && visibleColumns.has(c.key)),
  ];

  /* Hands the shared header's Export button to THIS page's current filtered
     rows + visible/ordered columns while Products is mounted (see
     ContentContext.registerExport) -- registered once via a ref so the
     handler always reads the latest `all`/`columns` at click-time without
     re-registering (and re-rendering Layout) on every keystroke/filter
     change. Exports every matching row, not just the current page, since
     pagination is a display convenience, not a scope the user set. */
  const exportRef = useRef({ all, columns, toast });
  useEffect(() => { exportRef.current = { all, columns, toast }; });
  useEffect(() => {
    registerExport(() => {
      const { all, columns, toast } = exportRef.current;
      if (!all.length) { toast("Nothing to export."); return; }
      const blob = new Blob([columnsToCsv(all, columns)], { type: "text/csv;charset=utf-8" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "shelfline-products-content.csv";
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      toast(`Exported ${all.length} rows.`);
    });
    return () => registerExport(null);
  }, [registerExport]);

  return (
    <div style={{ display: "flex", gap: "var(--app-gap)", alignItems: "flex-start" }}>
      <div ref={facetRef}>
        <FacetPanel groups={facets} onClearAll={() => { setRetailer([]); setStock([]); setOpportunity([]); setCategory([]); setBrand([]); setIssue([]); setSearch(""); }} />
      </div>
      <Card padding="20px 22px 14px" style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 14 }}>
          <div><h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Products</h3><div className="sl-muted" style={{ fontSize: 12.5, marginTop: 2 }}>{total} of {products.length} tracked SKUs</div></div>
          <ColumnPicker columns={COLUMN_OPTIONS} selected={visibleColumns} onChange={setVisibleColumns} order={columnOrder} onReorder={setColumnOrder} lockedIds={["name"]} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <input className="input" placeholder="Search product, SKU, ASIN…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ minHeight: 32, fontSize: 12.5, maxWidth: 320 }} />
        </div>
        <SortableTable columns={columns} rows={slice} sortKey={sortKey} sortDir={sortDir} onSort={onSort} onRowClick={(p) => navigate("/product/" + p.id)} rowKey={(p) => p.id} resizable />
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
