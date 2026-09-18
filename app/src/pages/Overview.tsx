import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageShell } from "../components/layout/PageShell";
import { KpiCard } from "../components/ui/KpiCard";
import { InsightCard } from "../components/ui/InsightCard";
import { SortableTable, type Column } from "../components/table/SortableTable";
import { Pagination } from "../components/table/Pagination";
import { Card } from "../components/ui/Card";
import { InfoTip } from "../components/ui/InfoTip";
import { Badge, stockTone, opportunityTone } from "../components/ui/Badge";
import { Tabs } from "../components/ui/Tabs";
import { ProductCell } from "../components/ui/ProductCell";
import { OpportunityCard } from "../components/ui/OpportunityCard";
import { DrilldownModal, type DrillTableConfig } from "../components/ui/DrilldownModal";
import { buildActionableIssues } from "../lib/issuePanel";
import { useDashboardData } from "../context/DataContext";
import { useFilters } from "../context/FiltersContext";
import { useUi } from "../context/UiContext";
import { useSortedPage } from "../hooks/useSortedPage";
import { spark } from "../lib/charts";
import { kpiCard, cell, table, pct, delta, deltaColor } from "../lib/format";
import { productSorters } from "../lib/productSort";
import { toCsv, REAL_BUYBOX_TIMELINE } from "../data/mockData";
import type { Product, StockStatus } from "../models/types";

const STOCK_TABS: Array<{ id: StockStatus | "All"; label: string }> = [
  { id: "All", label: "All" }, { id: "In Stock", label: "In stock" }, { id: "Low Stock", label: "Low" }, { id: "Out of Stock", label: "Out of stock" },
];

const MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const fmtDate = (iso: string) => { const [, m, d] = iso.split("-").map(Number); return MONTH_ABBR[m - 1] + " " + d; };

/** Real day-by-day buy-box holder for one product (see REAL_BUYBOX_TIMELINE /
 *  build_mock_data.py), colored green when we held it that day and red when
 *  a 3rd-party seller did -- same {cols,rows} shape DrilldownModal's "View
 *  dates" toggle already renders elsewhere (sales-share/competitors
 *  Summary), just with colored cells instead of plain text. The raw
 *  timeline only marks a 1P day "You" (a sentinel, not a real name) -- shown
 *  here as this SKU's own real crawled buyBoxSeller instead, the same real
 *  field the product's other buy-box displays already use. A SKU whose
 *  buyBoxSeller is genuinely null on file (e.g. its latest crawl found it
 *  unavailable, with no seller to record) falls back to a plainly-labeled
 *  "Your listing (1P)" rather than inventing a name. */
function buyBoxDateDetail(pid: string, buyBoxSeller: string | null) {
  const timeline = (REAL_BUYBOX_TIMELINE as any)[pid];
  if (!timeline || !timeline.length) return undefined;
  return {
    cols: ["Date", "Held By"],
    rows: timeline.map((e: any) => [
      fmtDate(e.date),
      { text: e.holder === "You" ? (buyBoxSeller ? buyBoxSeller + " (1P)" : "Your listing (1P)") : e.holder, color: e.holder === "You" ? "var(--status-positive-fg)" : "var(--status-negative-fg)" },
    ]),
  };
}

const CATEGORY_TABS: Array<{ id: string; label: string }> = [
  { id: "", label: "All" }, { id: "GPC", label: "GPC" }, { id: "HPC", label: "HPC" }, { id: "HG", label: "HG" },
];

export default function Overview() {
  const { snap } = useDashboardData();
  const { setRetailer, brand, setBrand, sku, setSku } = useFilters();
  const { toast } = useUi();
  const navigate = useNavigate();
  const [stockFilter, setStockFilter] = useState<StockStatus | "All">("All");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [pageSize, setPageSize] = useState(25);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [drill, setDrill] = useState<DrillTableConfig | null>(null);

  /* The global header's SKU filter pinpoints one item -- when set, it wins
     outright over every local tab/search on this page (that's the point:
     an unambiguous "show me this exact product", not one more AND'd-in
     condition that a stale local filter could zero out). Auto-corrected
     retailer/category/brand (see FiltersContext.setSku) means the matching
     product is always present in snap.products by the time this runs.
     Brand itself is the header's global Brand filter (not a local one --
     see GlobalHeader), so it composes with the other AND'd conditions the
     same way retailer/category already do upstream of snap.products. */
  const all: Product[] = useMemo(() => {
    if (!snap) return [];
    if (sku) return snap.products.filter((p: Product) => p.id === sku);
    const q = searchTerm.trim().toLowerCase();
    return snap.products.filter((p: Product) =>
      (stockFilter === "All" || p.stockStatus === stockFilter) &&
      (!categoryFilter || p.category === categoryFilter) &&
      (!brand || p.brand === brand) &&
      (!q || p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q)),
    );
  }, [snap, sku, stockFilter, categoryFilter, brand, searchTerm]);

  // A changed filter can drop selected rows out of `all` entirely -- clear
  // the selection rather than leave it referencing invisible products.
  useEffect(() => { setSelected(new Set()); }, [sku, stockFilter, categoryFilter, brand, searchTerm]);

  const { slice, sortKey, sortDir, onSort, page, totalPages, setPage, total } = useSortedPage(
    all, productSorters, "shelfScore", pageSize, [sku, stockFilter, categoryFilter, brand, searchTerm, pageSize].join("|"),
  );

  /* A dropdown of clickable matches, same idea as the header's SKU search --
     lets you jump straight to one exact product instead of scanning the
     (also live-filtered) table below. Searches the full globally-scoped
     snap.products, not the locally tab-filtered `all`, so a stock/category
     tab narrower than the match can't hide a product you typed the exact
     name of. */
  const [searchOpen, setSearchOpen] = useState(false);
  const searchBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) setSearchOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setSearchOpen(false); };
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("click", onClick); document.removeEventListener("keydown", onKey); };
  }, []);

  const searchHits: Product[] = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!snap || !q) return [];
    return snap.products.filter((p: Product) => (p.name + " " + p.id + " " + p.brand).toLowerCase().includes(q)).slice(0, 6);
  }, [snap, searchTerm]);

  if (!snap) return <PageShell title="Overview" subtitle="Monitor digital shelf health across your retailers, products and categories."><div /></PageShell>;

  const kpi = (id: string) => snap.kpis.find((k: any) => k.id === id);

  /* Buy Box Ownership 1P's drill: one row per tracked product with its real
     Buy Box Rate, each expandable (via DrilldownModal's existing "View
     dates" toggle) to that product's real day-by-day buy-box holder --
     green when 1P held it, red when a 3P seller did. Products with no
     REAL_BUYBOX_TIMELINE entry (never contested, or an r4/r6 retailer with
     no resolvable 3P signal) simply get no expand toggle. */
  const buyBoxByDayTable: DrillTableConfig = table(
    "Buy Box Ownership 1P -- Day by Day", `Real daily buy-box holder across ${snap.products.length} tracked SKUs -- green = you (1P), red = a 3rd-party seller`,
    [{ label: "Product", align: "left" }, { label: "Retailer", align: "left" }, { label: "Buy Box Rate", align: "right" }],
    snap.products.map((p: Product) => ({
      cells: [
        cell(p.name, { onClick: () => navigate("/product/" + p.id) }),
        cell(p.retailerName),
        cell(p.buyBoxRate + "%", { align: "right", strong: true, color: p.buyBoxRate >= 50 ? "var(--status-positive-fg)" : "var(--status-negative-fg)" }),
      ],
      detail: buyBoxDateDetail(p.id, p.buyBoxSeller),
    })),
  );

  const issueCards = buildActionableIssues(all);

  const toggleSelected = (id: string) => setSelected((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const allSelected = all.length > 0 && all.every((p) => selected.has(p.id));
  const downloadSelected = () => {
    const rows = all.filter((p) => selected.has(p.id));
    if (!rows.length) return;
    const blob = new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `shelfline-products-selected.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    toast(`Exported ${rows.length} selected rows.`);
  };

  const columns: Column<Product>[] = [
    { key: "__select", label: "", minWidth: 34, align: "center", render: (p) => (
      <input type="checkbox" checked={selected.has(p.id)} onClick={(e) => e.stopPropagation()} onChange={() => toggleSelected(p.id)} />
    ) },
    { key: "name", label: "Product", minWidth: 280, sortable: true, render: (p) => <ProductCell id={p.id} name={p.name} sku={p.id.toUpperCase()} meta={p.category} imageUrl={p.imageUrl} urlFailed={p.urlFailed} noClamp /> },
    { key: "price", label: "Price", align: "center", sortable: true, render: (p) => p.price != null ? "$" + p.price.toFixed(2) : "—" },
    { key: "stockStatus", label: "Stock", align: "center", sortable: true, render: (p) => (
      <><Badge tone={stockTone(p.stockStatus)}>{p.stockStatus}</Badge><div className="sl-table-sub">{p.inStockRate.toFixed(1)}% of days</div></>
    ) },
    { key: "rating", label: "Rating", align: "center", sortable: true, render: (p) => (
      <><div style={{ fontWeight: 500 }}>{p.rating.toFixed(2)}</div><div className="sl-table-sub">{p.reviews.toLocaleString()} reviews</div></>
    ) },
    { key: "contentScore", label: "Content completeness", align: "center", sortable: true, info: "(9 real checks passing ÷ 9) × 100 -- title, images, videos, bullets, description, rating, enhanced content.", render: (p) => (
      <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
        <span className="sl-progress-track" style={{ width: 40 }}><span className="sl-progress-fill" style={{ width: p.contentScore + "%" }}></span></span>
        <span style={{ fontWeight: 600, minWidth: 30 }}>{p.contentScore}%</span>
      </div>
    ) },
    { key: "opportunity", label: "Opportunity", align: "center", sortable: true, info: "A real composite flag: points for being out of/low stock, scoring under 80% content, or rating under 4.0 -- High/Medium/Low by total points, not a single field.", render: (p) => <Badge tone={opportunityTone(p.opportunity)}>{p.opportunity}</Badge> },
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
        {["instock", "pidx", "content", "rating", "buybox"].map((id) => (
          <KpiCard
            key={id}
            k={kpiCard(kpi(id), spark, { showLastDay: id === "instock" || id === "pidx" })}
            onClick={() => {
              if (id === "buybox") setDrill(buyBoxByDayTable);
              else if (id === "instock") navigate("/content/products");
              else if (id === "pidx") navigate("/sales-share");
              else if (id === "content") navigate("/content");
              else if (id === "rating") navigate("/reviews");
            }}
          />
        ))}
      </div>

      <section>
        <div style={{ marginBottom: 14 }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>Key insights<InfoTip text="Auto-generated from this period's real numbers (buy box loss, availability, content gaps) -- never authored copy." /></h2>
          <div className="sl-muted" style={{ fontSize: 13, marginTop: 2 }}>Signals detected across your monitored digital shelf</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: "var(--app-gap)" }}>
          {snap.insights.map((n: any) => (
            <InsightCard key={n.id} n={n} onGo={() => navigate(
              n.target === "shelf" ? `/content/products${n.id === "i-buybox-avail" ? "?focus=avail" : ""}`
                : n.target === "sales" ? "/sales-share"
                : "/" + n.target,
            )} />
          ))}
        </div>
      </section>

      <Card padding="20px 22px 10px">
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 14 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>Retailer performance<InfoTip text="Real in-stock rate, content score and rating per retailer, pooled from your tracked SKUs there. Overall score = 40% in-stock + 40% content + 20% rating." /></h3>
            <div className="sl-muted" style={{ fontSize: 12.5, marginTop: 2 }}>Select a retailer to scope the whole workspace to it</div>
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="sl-table">
            <thead><tr><th>Retailer</th><th style={{ textAlign: "right" }}>In stock</th><th style={{ textAlign: "right" }}>Content</th><th style={{ textAlign: "right" }}>Rating</th><th style={{ textAlign: "right", minWidth: 140 }}>Overall score</th></tr></thead>
            <tbody>
              {snap.retailerPerformance.map((r: any) => (
                <tr className="sl-row is-clickable" key={r.id} onClick={() => { setRetailer(r.id); toast("Scoped to " + r.name + "."); }}>
                  <td><div className="sl-table-name">{r.name}</div><div className="sl-table-sub">{r.skus} tracked SKUs</div></td>
                  <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>{pct(r.inStock)} <span style={{ fontSize: 11.5, marginLeft: 6, color: deltaColor(r.inStockDelta) }}>{delta(r.inStockDelta)}</span></td>
                  <td style={{ textAlign: "right" }}>{r.content}%</td>
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
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>Category performance<InfoTip text="Real availability, content score and rating per category, pooled from your tracked SKUs in it. Same Overall score weighting as Retailer performance above." /></h3>
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
                  <span>Avail. {pct(c.availability)}</span>
                  <span>Content {c.content}%</span>
                </div>
              </Card>
            );
          })}
        </div>
      </Card>

      {issueCards.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,320px),1fr))", gap: "var(--app-gap)" }}>
          {issueCards.map((c) => (
            <OpportunityCard
              key={c.id} impact={c.impact} impactTone={c.impactTone} count={c.count} title={c.title}
              problem={c.problem} why={c.why} action={c.action} cta={c.cta}
              onGo={() => navigate(c.id === "buybox" ? "/sales-share" : "/content")}
            />
          ))}
        </div>
      )}

      <Card padding="20px 22px 14px">
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 16 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>Product performance<InfoTip text="Every real tracked SKU in the current filter scope -- price, stock, rating and content are each pulled straight from the crawl, per product." /></h3>
            <div className="sl-muted" style={{ fontSize: 12.5, marginTop: 2 }}>
              {sku ? "Pinned to one SKU via the header filter" : `${total} of ${snap.products.length} tracked SKUs${categoryFilter ? ` · ${categoryFilter}` : ""}${brand ? ` · ${brand}` : ""}`}
            </div>
          </div>
          {sku ? (
            <button className="btn btn-ghost" onClick={() => setSku("")} style={{ fontSize: 12.5 }}>Show all products</button>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <div ref={searchBoxRef} style={{ position: "relative" }}>
                <input
                  className="input" type="text" placeholder="Search products, SKUs, brands…" value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setSearchOpen(true); }}
                  onFocus={() => { if (searchTerm.trim()) setSearchOpen(true); }}
                  style={{ minWidth: 200, height: 32, fontSize: 12.5 }}
                />
                {searchOpen && searchTerm.trim() && (
                  <div className="sl-panel sl-pop-in" style={{ position: "absolute", top: 36, left: 0, width: 320, maxHeight: 360, overflowY: "auto", zIndex: 30, padding: "6px 0" }}>
                    {searchHits.length === 0 ? (
                      <div className="sl-muted" style={{ fontSize: 12.5, padding: "10px 12px" }}>No matches for "{searchTerm.trim()}".</div>
                    ) : searchHits.map((p) => (
                      <button
                        key={p.id} type="button" className="sl-palette__row"
                        onClick={() => { setSearchOpen(false); navigate("/product/" + p.id); }}
                        style={{ width: "100%", justifyContent: "space-between", gap: 10 }}
                      >
                        <span style={{ flex: 1, minWidth: 0 }}>
                          <ProductCell id={p.id} name={p.name} sku={p.id.toUpperCase()} meta={p.retailerName} imageUrl={p.imageUrl} urlFailed={p.urlFailed} imageSize={28} />
                        </span>
                        <Badge tone={stockTone(p.stockStatus)}>{p.stockStatus}</Badge>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <Tabs options={CATEGORY_TABS} value={categoryFilter} onChange={setCategoryFilter} size="sm" />
              <Tabs options={STOCK_TABS} value={stockFilter} onChange={setStockFilter} size="sm" />
              {(stockFilter !== "All" || categoryFilter || brand || searchTerm) && <button className="btn btn-ghost" onClick={() => { setStockFilter("All"); setCategoryFilter(""); setBrand(""); setSearchTerm(""); toast("Filters cleared."); }} style={{ fontSize: 12.5 }}>Clear filters</button>}
            </div>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", margin: "2px 0 12px" }}>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, cursor: all.length ? "pointer" : "default" }}>
            <input
              type="checkbox" disabled={!all.length} checked={allSelected}
              onChange={() => setSelected(allSelected ? new Set() : new Set(all.map((p) => p.id)))}
            />
            Select all{selected.size > 0 ? ` · ${selected.size} selected` : ""}
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {selected.size > 0 && (
              <button className="btn btn-secondary" style={{ fontSize: 12.5 }} onClick={downloadSelected}>⬇ Download selected ({selected.size})</button>
            )}
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5 }}>
              Rows per page
              <select className="input" style={{ height: 30, fontSize: 12.5 }} value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </label>
          </div>
        </div>
        <SortableTable columns={columns} rows={slice} sortKey={sortKey} sortDir={sortDir} onSort={onSort} onRowClick={(p) => navigate("/product/" + p.id)} rowKey={(p) => p.id} resizable wrap />
        {all.length === 0 && (
          <div style={{ padding: "32px 4px", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 8 }}>
            <div style={{ fontWeight: 600, fontSize: 15 }}>{sku ? "That SKU isn't tracked in the current scope" : "No products match these filters"}</div>
            <div className="sl-muted" style={{ fontSize: 13 }}>{sku ? "Try clearing the header's SKU filter." : "Try a different stock status, category, brand or search term."}</div>
            <button className="btn btn-secondary" onClick={() => { setSku(""); setStockFilter("All"); setCategoryFilter(""); setBrand(""); setSearchTerm(""); }}>Reset filters</button>
          </div>
        )}
        <Pagination page={page} totalPages={totalPages} total={total} pageSize={pageSize} onPage={setPage} />
      </Card>

      {drill && <DrilldownModal t={drill} onClose={() => setDrill(null)} />}
    </PageShell>
  );
}
