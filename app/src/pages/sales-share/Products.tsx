import { useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { Card } from "../../components/ui/Card";
import { OpportunityCard } from "../../components/ui/OpportunityCard";
import { SortableTable, type Column } from "../../components/table/SortableTable";
import { Pagination } from "../../components/table/Pagination";
import { Tabs } from "../../components/ui/Tabs";
import { opportunityTone } from "../../components/ui/Badge";
import { ProductCell } from "../../components/ui/ProductCell";
import { useFilters } from "../../context/FiltersContext";
import { useUi } from "../../context/UiContext";
import { useSortedPage } from "../../hooks/useSortedPage";
import { deltaColor, money, pct, signedMoney, signedPct } from "../../lib/format";
import { productSorters } from "../../lib/productSort";
import type { Product } from "../../models/types";
import type { SalesShareContext } from "./Layout";

type SalesTab = "top" | "growing" | "declining";
const TABS: Array<{ id: SalesTab; label: string; sortKey: string; dir: "asc" | "desc" }> = [
  { id: "top", label: "Top sellers", sortKey: "sales", dir: "desc" },
  { id: "growing", label: "Fastest growing", sortKey: "salesGrowth", dir: "desc" },
  { id: "declining", label: "Declining", sortKey: "salesGrowth", dir: "asc" },
];

export default function SalesShareProducts() {
  const { sd, categoryFilter, setCategoryFilter } = useOutletContext<SalesShareContext>();
  const { setRetailer } = useFilters();
  const { toast } = useUi();
  const navigate = useNavigate();
  const [salesTab, setSalesTab] = useState<SalesTab>("top");

  const all: Product[] = useMemo(() => sd.products.filter((p: Product) =>
    (!categoryFilter || p.category === categoryFilter) &&
    (salesTab !== "growing" || p.salesGrowth > 0) &&
    (salesTab !== "declining" || p.salesGrowth < 0),
  ), [sd, categoryFilter, salesTab]);

  const { slice, sortKey, sortDir, onSort, setSort, page, totalPages, setPage, total } = useSortedPage(
    all, productSorters, "sales", 8, [categoryFilter, salesTab].join("|"),
  );

  const columns: Column<Product>[] = [
    { key: "name", label: "Product", minWidth: 230, sortable: true, render: (p) => <ProductCell name={p.name} sku={p.id.toUpperCase()} /> },
    { key: "category", label: "Category", sortable: true, render: (p) => <span style={{ fontSize: 13 }}>{p.category}</span> },
    { key: "retailerName", label: "Retailer", sortable: true, render: (p) => <span style={{ fontSize: 13 }}>{p.retailerName}</span> },
    { key: "sales", label: "Sales", align: "right", sortable: true, render: (p) => <span style={{ fontWeight: 600 }}>{money(p.sales)}</span> },
    { key: "salesGrowth", label: "Growth", align: "right", sortable: true, render: (p) => <span style={{ color: deltaColor(p.salesGrowth) }}>{signedPct(p.salesGrowth)}</span> },
    { key: "contribution", label: "Contribution", align: "right", render: (p) => pct((p.sales / (sd.totals.sales || 1)) * 100) },
    { key: "units", label: "Units", align: "right", sortable: true, render: (p) => p.units.toLocaleString() },
    { key: "price", label: "Avg price", align: "right", sortable: true, render: (p) => "$" + p.price.toFixed(2) },
  ];

  return (
    <>
      <Card padding="20px 22px 14px">
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 16 }}>
          <div><h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Top products by sales</h3><div className="sl-muted" style={{ fontSize: 12.5, marginTop: 2 }}>{total} of {sd.products.length} tracked SKUs · {categoryFilter || "all categories"}</div></div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <Tabs options={TABS} value={salesTab} onChange={(id) => { const tb = TABS.find((x) => x.id === id)!; setSalesTab(id); setSort(tb.sortKey, tb.dir); }} />
            {(categoryFilter || salesTab !== "top") && <button className="btn btn-ghost" onClick={() => { setCategoryFilter(""); setSalesTab("top"); toast("Filters cleared."); }} style={{ fontSize: 12.5 }}>Clear filters</button>}
          </div>
        </div>
        <SortableTable columns={columns} rows={slice} sortKey={sortKey} sortDir={sortDir} onSort={onSort} onRowClick={(p) => navigate("/product/" + p.id)} rowKey={(p) => p.id} />
        {all.length === 0 && (
          <div style={{ padding: "32px 4px", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 8 }}>
            <div style={{ fontWeight: 600, fontSize: 15 }}>No products match this view</div>
            <div className="sl-muted" style={{ fontSize: 13 }}>Try another tab, category or search term.</div>
            <button className="btn btn-secondary" onClick={() => { setCategoryFilter(""); setSalesTab("top"); }}>Reset filters</button>
          </div>
        )}
        <Pagination page={page} totalPages={totalPages} total={total} pageSize={8} onPage={setPage} />
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,340px),1fr))", gap: "var(--app-gap)" }}>
        <Card padding="20px 22px 8px">
          <div style={{ marginBottom: 10 }}><h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Biggest gains</h3><div className="sl-muted" style={{ fontSize: 12.5, marginTop: 2 }}>Products adding the most sales versus last period</div></div>
          {sd.movement.gains.map((m: any) => (
            <button key={m.id} className="sl-palette__row" onClick={() => navigate("/product/" + m.id)} style={{ justifyContent: "space-between", borderTop: "1px solid var(--border-subtle)" }}>
              <span style={{ minWidth: 0, textAlign: "left" }}><span style={{ display: "block", fontSize: 13.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name}</span><span className="sl-muted" style={{ fontSize: 11.5 }}>{m.retailerName}</span></span>
              <span style={{ textAlign: "right", whiteSpace: "nowrap" }}><span style={{ display: "block", fontWeight: 600, fontSize: 14, color: "var(--status-positive-fg)" }}>{signedMoney(m.delta)}</span><span style={{ fontSize: 11.5, color: "var(--status-positive-fg)" }}>{signedPct(m.growth)}</span></span>
            </button>
          ))}
        </Card>
        <Card padding="20px 22px 8px">
          <div style={{ marginBottom: 10 }}><h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Biggest declines</h3><div className="sl-muted" style={{ fontSize: 12.5, marginTop: 2 }}>Products losing the most sales versus last period</div></div>
          {sd.movement.declines.map((m: any) => (
            <button key={m.id} className="sl-palette__row" onClick={() => navigate("/product/" + m.id)} style={{ justifyContent: "space-between", borderTop: "1px solid var(--border-subtle)" }}>
              <span style={{ minWidth: 0, textAlign: "left" }}><span style={{ display: "block", fontSize: 13.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name}</span><span className="sl-muted" style={{ fontSize: 11.5 }}>{m.retailerName}</span></span>
              <span style={{ textAlign: "right", whiteSpace: "nowrap" }}><span style={{ display: "block", fontWeight: 600, fontSize: 14, color: "var(--status-negative-fg)" }}>{signedMoney(m.delta)}</span><span style={{ fontSize: 11.5, color: "var(--status-negative-fg)" }}>{signedPct(m.growth)}</span></span>
            </button>
          ))}
        </Card>
      </div>

      <section>
        <div style={{ marginBottom: 14 }}><h2 style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>Commercial opportunities</h2><div className="sl-muted" style={{ fontSize: 13, marginTop: 2 }}>Ranked by potential impact — each one scopes the page to what it affects</div></div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,275px),1fr))", gap: "var(--app-gap)" }}>
          {sd.opportunities.map((o: any) => (
            <OpportunityCard key={o.id} impact={o.impact + " impact"} impactTone={opportunityTone(o.impact)} count={o.count + (o.count === 1 ? " SKU affected" : " SKUs affected")}
              title={o.title} problem={o.problem} why={o.why} action={o.action} cta={o.cta + " →"} showEvidenceLabel
              onGo={() => {
                if (o.target === "category") { setCategoryFilter(o.value); toast(o.value + " — Sales & Share."); }
                else if (o.target === "retailer") { setRetailer(o.value); toast("Sales scoped to that retailer."); }
                else {
                  const tab: SalesTab = o.focus === "declining" ? "declining" : "top";
                  setSalesTab(tab);
                  setSort(tab === "declining" ? "salesGrowth" : "sales", tab === "declining" ? "asc" : "desc");
                  toast("Products filtered to " + o.title.toLowerCase() + ".");
                }
              }} />
          ))}
        </div>
      </section>
    </>
  );
}
