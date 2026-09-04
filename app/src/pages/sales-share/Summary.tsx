import { useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { KpiCard } from "../../components/ui/KpiCard";
import { ChartCard } from "../../components/charts/ChartCard";
import { Card } from "../../components/ui/Card";
import { DrilldownModal } from "../../components/ui/DrilldownModal";
import { useFilters } from "../../context/FiltersContext";
import { useUi } from "../../context/UiContext";
import { useChartHover } from "../../hooks/useChartHover";
import { lineChart, barChart, spark } from "../../lib/charts";
import { kpiCard, cell, table, delta, deltaColor, type TableConfig } from "../../lib/format";
import { REAL_BUYBOX_COMPETITOR } from "../../data/mockData";
import type { SalesShareContext } from "./Layout";
import type { Product } from "../../models/types";

export default function SalesShareSummary() {
  const { sh, categoryFilter, setCategoryFilter } = useOutletContext<SalesShareContext>();
  const { setRetailer, retailer } = useFilters();
  const { toast } = useUi();
  const navigate = useNavigate();
  const { hover, onEnter, onLeave } = useChartHover();
  const [catSort, setCatSort] = useState({ key: "overall", dir: "desc" as "asc" | "desc" });
  const [drill, setDrill] = useState<TableConfig | null>(null);
  const goToProduct = (id: string) => { setDrill(null); navigate("/product/" + id); };

  const pidx = sh.kpis.find((k: any) => k.id === "pidx");
  const priceIncreasedProducts = sh.products.filter((p: Product) => p.priceChangePct > 0).sort((a: Product, b: Product) => b.priceChangePct - a.priceChangePct);
  const priceDroppedProducts = sh.products.filter((p: Product) => p.priceChangePct < 0).sort((a: Product, b: Product) => a.priceChangePct - b.priceChangePct);
  const priceIncreased = priceIncreasedProducts.length;
  const priceDropped = priceDroppedProducts.length;
  const { skusTracked, skusLost, topSeller } = sh.buyBoxLoss;
  const buyBoxLostProducts = sh.products
    .filter((p: Product) => REAL_BUYBOX_COMPETITOR[p.id])
    .map((p: Product) => ({ p, ...REAL_BUYBOX_COMPETITOR[p.id] }))
    .sort((a: any, b: any) => b.daysWon - a.daysWon);

  /* Previous price implied by the real whole-month priceChangePct -- the
     catalog only keeps first-vs-last percent change, not the first price
     itself, so this reconstructs it rather than adding a new stored field
     for a number the existing real field already implies exactly. */
  const impliedPreviousPrice = (p: Product) => (p.priceChangePct > -100 ? p.price / (1 + p.priceChangePct / 100) : null);

  /* Discount % = (List Price - Effective Price) / List Price -- "Effective
     Price" is the currently displayed/paid price (Current Price, falling
     back to the snapshot `price` the same way every other pricing feature
     does), not a coupon-adjusted price -- coupons get their own real
     analysis on the Drivers tab, so this stays list-vs-current only.
     Averaged only over SKUs that actually posted a list price (a SKU with
     none has nothing to discount from). */
  const withList = sh.products.filter((p: Product) => p.listPrice != null && p.listPrice > 0);
  const avgDiscountPct = withList.length
    ? withList.reduce((a: number, p: Product) => a + ((p.listPrice! - (p.currentPrice ?? p.price)) / p.listPrice!) * 100, 0) / withList.length
    : 0;
  /* "On promotion" = genuinely marked down from list (current < list) or
     carrying a real crawled coupon -- either is a real, currently-active
     promotional mechanism, not a fabricated status. */
  const promotionProducts = sh.products.filter((p: Product) =>
    (p.listPrice != null && (p.currentPrice ?? p.price) < p.listPrice) || p.couponValue != null,
  );
  const onPromotion = promotionProducts.length;

  /* Real MAP (Minimum Advertised Price), from a separate reference
     workbook the user supplies (not the crawl itself -- MAP is a brand
     policy value). Only SKUs with a genuine MAP row count toward either
     number; a SKU with none is neither compliant nor a violation, it's
     simply not tracked. */
  const withMap = sh.products.filter((p: Product) => p.mapPrice != null);
  const belowMapProducts = withMap
    .filter((p: Product) => (p.currentPrice ?? p.price) < p.mapPrice!)
    .sort((a: Product, b: Product) => ((b.mapPrice! - (b.currentPrice ?? b.price)) / b.mapPrice!) - ((a.mapPrice! - (a.currentPrice ?? a.price)) / a.mapPrice!));
  const belowMap = belowMapProducts;

  const discountedProducts = withList
    .map((p: Product) => ({ p, eff: p.currentPrice ?? p.price, pct: ((p.listPrice! - (p.currentPrice ?? p.price)) / p.listPrice!) * 100 }))
    .sort((a: any, b: any) => b.pct - a.pct);

  /* One TableConfig per clickable KPI tile above -- built with the same
     table()/cell() helpers DataTable consumes, so DrilldownModal can
     render any of them with no per-metric special-casing. Average Price
     is deliberately not one of these: it already has its own trend chart
     right below, so a redundant SKU list would add nothing. */
  const priceIncreasedTable = table("Price Increased", `${priceIncreased} SKUs with a real whole-month price increase`,
    [{ label: "Product", align: "left" }, { label: "Retailer", align: "left" }, { label: "Previous Price", align: "right" }, { label: "Current Price", align: "right" }, { label: "Change", align: "right" }],
    priceIncreasedProducts.map((p: Product) => { const prev = impliedPreviousPrice(p); return { cells: [
      cell(p.name, { onClick: () => goToProduct(p.id) }),
      cell(p.retailerName),
      cell(prev != null ? "$" + prev.toFixed(2) : "—", { align: "right" }),
      cell("$" + p.price.toFixed(2), { align: "right" }),
      cell(delta(p.priceChangePct, "%"), { align: "right", color: deltaColor(p.priceChangePct) }),
    ] }; }));
  const priceDroppedTable = table("Price Dropped", `${priceDropped} SKUs with a real whole-month price decrease`,
    [{ label: "Product", align: "left" }, { label: "Retailer", align: "left" }, { label: "Previous Price", align: "right" }, { label: "Current Price", align: "right" }, { label: "Change", align: "right" }],
    priceDroppedProducts.map((p: Product) => { const prev = impliedPreviousPrice(p); return { cells: [
      cell(p.name, { onClick: () => goToProduct(p.id) }),
      cell(p.retailerName),
      cell(prev != null ? "$" + prev.toFixed(2) : "—", { align: "right" }),
      cell("$" + p.price.toFixed(2), { align: "right" }),
      cell(delta(p.priceChangePct, "%"), { align: "right", color: deltaColor(p.priceChangePct) }),
    ] }; }));
  const buyBoxLostTable = table("Buy Box Lost (1P)", `${skusLost} of ${skusTracked} SKUs had a 3P seller win the buy box at some point this period`,
    [{ label: "Product", align: "left" }, { label: "Retailer", align: "left" }, { label: "Competitor", align: "left" }, { label: "Days Won", align: "right" }, { label: "Buy Box Rate", align: "right" }],
    buyBoxLostProducts.map(({ p, seller, daysWon }: any) => ({ cells: [
      cell(p.name, { onClick: () => goToProduct(p.id) }),
      cell(p.retailerName),
      cell(seller),
      cell(daysWon + " of 30", { align: "right" }),
      cell(p.buyBoxRate + "%", { align: "right", color: p.buyBoxRate < 50 ? "var(--status-negative-fg)" : "inherit" }),
    ] })));
  const discountTable = table("Average Price Discount", `${withList.length} of ${sh.products.length} SKUs posted a list price`,
    [{ label: "Product", align: "left" }, { label: "Retailer", align: "left" }, { label: "List Price", align: "right" }, { label: "Current Price", align: "right" }, { label: "Discount", align: "right" }],
    discountedProducts.map(({ p, eff, pct }: any) => ({ cells: [
      cell(p.name, { onClick: () => goToProduct(p.id) }),
      cell(p.retailerName),
      cell("$" + p.listPrice!.toFixed(2), { align: "right" }),
      cell("$" + eff.toFixed(2), { align: "right" }),
      cell((pct >= 0 ? "" : "−") + Math.abs(pct).toFixed(1) + "%", { align: "right", color: deltaColor(pct, true) }),
    ] })));
  const promotionTable = table("SKUs on Promotion", `${onPromotion} of ${sh.products.length} SKUs marked down from list, or carrying a coupon`,
    [{ label: "Product", align: "left" }, { label: "Retailer", align: "left" }, { label: "List Price", align: "right" }, { label: "Current Price", align: "right" }, { label: "Coupon", align: "left" }],
    promotionProducts.map((p: Product) => ({ cells: [
      cell(p.name, { onClick: () => goToProduct(p.id) }),
      cell(p.retailerName),
      cell(p.listPrice != null ? "$" + p.listPrice.toFixed(2) : "—", { align: "right" }),
      cell("$" + (p.currentPrice ?? p.price).toFixed(2), { align: "right" }),
      cell(p.couponValue ?? "—"),
    ] })));
  const belowMapTable = table("Below MAP", `${belowMap.length} of ${withMap.length} SKUs tracked under MAP are priced under it`,
    [{ label: "Product", align: "left" }, { label: "Retailer", align: "left" }, { label: "MAP Price", align: "right" }, { label: "Effective Price", align: "right" }, { label: "Under MAP", align: "right" }],
    belowMapProducts.map((p: Product) => { const eff = p.currentPrice ?? p.price; const gap = p.mapPrice! - eff; return { cells: [
      cell(p.name, { onClick: () => goToProduct(p.id) }),
      cell(p.retailerName),
      cell("$" + p.mapPrice!.toFixed(2), { align: "right" }),
      cell("$" + eff.toFixed(2), { align: "right" }),
      cell("−$" + gap.toFixed(2) + " (" + ((gap / p.mapPrice!) * 100).toFixed(1) + "%)", { align: "right", color: "var(--status-negative-fg)" }),
    ] }; }));

  const priceHi = Math.max(40, Math.ceil((pidx.value + 10) / 10) * 10);
  const priceTrend = lineChart({
    id: "price-trend", title: "Average Price Trend", subtitle: "Real pooled average price across the selected period",
    labels: sh.labels, lo: 0, hi: priceHi, ticks: [0, priceHi / 4, priceHi / 2, (priceHi * 3) / 4, priceHi], fmt: (v) => "$" + v.toFixed(2), hideLegend: true,
    series: [{ name: "Average price", values: pidx.spark }], span: "1 / -1",
    footer: [
      { label: "Average price now", value: "$" + pidx.value.toFixed(2), color: "var(--status-positive-fg)" },
      { label: "Previous period", value: "$" + (pidx.value - pidx.delta).toFixed(2), color: "inherit" },
      { label: "Change", value: (pidx.delta >= 0 ? "↑ " : "↓ ") + "$" + Math.abs(pidx.delta).toFixed(2), color: deltaColor(pidx.delta, true) },
    ],
  }, hover, onEnter);

  const retailerHi = Math.max(20, Math.ceil((Math.max(...sh.retailers.map((r: any) => r.avgPrice)) + 5) / 5) * 5);
  const retailerPriceChart = barChart({
    id: "price-by-retailer", title: "Average Price by Retailer", subtitle: "Real pooled average price at each monitored retailer",
    labels: sh.retailers.map((r: any) => r.name), values: sh.retailers.map((r: any) => r.avgPrice),
    valueName: "Avg price", lo: 0, hi: retailerHi, ticks: [0, retailerHi / 4, retailerHi / 2, (retailerHi * 3) / 4, retailerHi], fmt: (v) => "$" + v.toFixed(2),
    fill: () => "var(--color-accent-700)",
  }, hover, onEnter);

  const tierFields: Array<{ key: "listPrice" | "currentPrice" | "subscriptionPrice"; label: string }> = [
    { key: "listPrice", label: "List price" }, { key: "currentPrice", label: "Current price" }, { key: "subscriptionPrice", label: "Subscription price" },
  ];
  const tiers = tierFields.map((f) => {
    const withValue = sh.products.filter((p: Product) => p[f.key] != null);
    const avg = withValue.length ? withValue.reduce((a: number, p: Product) => a + (p[f.key] as number), 0) / withValue.length : null;
    return { ...f, avg, tracked: withValue.length };
  });

  const priceGaps = sh.products
    .map((p: Product) => ({ p, gapPct: p.avgSellingPrice ? ((p.price - p.avgSellingPrice) / p.avgSellingPrice) * 100 : 0 }))
    .sort((a: any, b: any) => Math.abs(b.gapPct) - Math.abs(a.gapPct))
    .slice(0, 5);

  const catSortFn = (k: string) => setCatSort((s) => ({ key: k, dir: s.key === k && s.dir === "desc" ? "asc" : "desc" }));
  const sortedCategories = sh.categories.slice().sort((a: any, b: any) => {
    const dir = catSort.dir === "asc" ? 1 : -1;
    return (catSort.key === "category" ? a.category.localeCompare(b.category) : a[catSort.key] - b[catSort.key]) * dir;
  });

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,220px),1fr))", gap: "var(--app-gap)" }}>
        <KpiCard k={kpiCard(pidx, spark)} />
        <Card padding="18px 20px" interactive onClick={() => setDrill(priceIncreasedTable)}>
          <div className="sl-muted" style={{ fontSize: 12.5 }}>Price Increased</div>
          <div style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 32, lineHeight: 1, marginTop: 8 }}>{priceIncreased}</div>
          <div className="sl-faint" style={{ fontSize: 11.5, marginTop: 8 }}>SKUs, real whole-month change · click to view</div>
        </Card>
        <Card padding="18px 20px" interactive onClick={() => setDrill(priceDroppedTable)}>
          <div className="sl-muted" style={{ fontSize: 12.5 }}>Price Dropped</div>
          <div style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 32, lineHeight: 1, marginTop: 8 }}>{priceDropped}</div>
          <div className="sl-faint" style={{ fontSize: 11.5, marginTop: 8 }}>SKUs, real whole-month change · click to view</div>
        </Card>
        <Card padding="18px 20px" interactive onClick={() => setDrill(buyBoxLostTable)}>
          <div className="sl-muted" style={{ fontSize: 12.5 }}>Buy Box Lost (1P)</div>
          <div style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 32, lineHeight: 1, marginTop: 8, color: skusLost > 0 ? "var(--status-negative-fg)" : "inherit" }}>{skusLost}<span style={{ fontSize: 16, fontWeight: 500 }}> / {skusTracked}</span></div>
          <div className="sl-faint" style={{ fontSize: 11.5, marginTop: 8 }}>{topSeller ? "Top 3P seller: " + topSeller : "No 3P buy-box loss in scope"}</div>
        </Card>
        <Card padding="18px 20px" interactive onClick={() => setDrill(discountTable)}>
          <div className="sl-muted" style={{ fontSize: 12.5 }}>Average Price Discount</div>
          <div style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 32, lineHeight: 1, marginTop: 8, color: avgDiscountPct > 0 ? "var(--status-positive-fg)" : "inherit" }}>{avgDiscountPct.toFixed(1)}%</div>
          <div className="sl-faint" style={{ fontSize: 11.5, marginTop: 8 }}>(List − Current) ÷ List, {withList.length} of {sh.products.length} SKUs</div>
        </Card>
        <Card padding="18px 20px" interactive onClick={() => setDrill(promotionTable)}>
          <div className="sl-muted" style={{ fontSize: 12.5 }}>SKUs on Promotion</div>
          <div style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 32, lineHeight: 1, marginTop: 8 }}>{onPromotion}<span style={{ fontSize: 16, fontWeight: 500 }}> / {sh.products.length}</span></div>
          <div className="sl-faint" style={{ fontSize: 11.5, marginTop: 8 }}>Marked down from list, or carrying a coupon</div>
        </Card>
        <Card padding="18px 20px" interactive onClick={() => setDrill(belowMapTable)}>
          <div className="sl-muted" style={{ fontSize: 12.5 }}>Below MAP</div>
          <div style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 32, lineHeight: 1, marginTop: 8, color: belowMap.length > 0 ? "var(--status-negative-fg)" : "inherit" }}>{belowMap.length}<span style={{ fontSize: 16, fontWeight: 500 }}> / {withMap.length}</span></div>
          <div className="sl-faint" style={{ fontSize: 11.5, marginTop: 8 }}>Priced under real MAP, {withMap.length} of {sh.products.length} SKUs tracked</div>
        </Card>
      </div>

      {drill && <DrilldownModal t={drill} onClose={() => setDrill(null)} />}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,430px),1fr))", gap: "var(--app-gap)" }}>
        <ChartCard c={priceTrend} onLeave={onLeave} />
        <ChartCard c={retailerPriceChart} onLeave={onLeave} />
      </div>

      <Card padding="20px 22px">
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Price Tiers</h3>
        <div className="sl-muted" style={{ fontSize: 12.5, marginTop: 2, marginBottom: 16 }}>Real Price-tab fields — a product with no value for a tier never posted that price</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 16 }}>
          {tiers.map((t) => (
            <div key={t.key}>
              <div className="sl-muted" style={{ fontSize: 12.5 }}>{t.label}</div>
              <div style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 24, marginTop: 4 }}>{t.avg != null ? "$" + t.avg.toFixed(2) : "—"}</div>
              <div className="sl-faint" style={{ fontSize: 11.5, marginTop: 4 }}>{t.tracked} of {sh.products.length} SKUs</div>
            </div>
          ))}
        </div>
      </Card>

      <Card padding="20px 22px">
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Largest Price Gap vs. Own Average</h3>
        <div className="sl-muted" style={{ fontSize: 12.5, marginTop: 2, marginBottom: 14 }}>Current price vs. this item's own real average selling price this period</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {priceGaps.map(({ p, gapPct }: any) => (
            <div
              key={p.id}
              onClick={() => goToProduct(p.id)}
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, fontSize: 12.5, paddingBottom: 8, borderBottom: "1px solid var(--border-subtle)", cursor: "pointer" }}
            >
              <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--color-accent-700)", textDecoration: "underline" }}>{p.name}</span>
              <span style={{ flex: "none", whiteSpace: "nowrap" }}>${p.price.toFixed(2)} vs ${p.avgSellingPrice.toFixed(2)} <span style={{ fontWeight: 600, color: deltaColor(gapPct, true), marginLeft: 6 }}>{delta(gapPct, "%")}</span></span>
            </div>
          ))}
        </div>
      </Card>

      <section>
        <div style={{ marginBottom: 14 }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>Retailer pricing</h2>
          <div className="sl-muted" style={{ fontSize: 13, marginTop: 2 }}>Select a retailer to scope the page to that account</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,220px),1fr))", gap: "var(--app-gap)" }}>
          {sh.retailers.map((r: any) => {
            const active = retailer === r.id;
            return (
              <Card key={r.id} interactive selected={active} padding="16px 18px" onClick={() => { if (!active) { setRetailer(r.id); toast("Scoped to " + r.name + "."); } }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, minWidth: 0 }}>
                  <span style={{ fontWeight: 500, fontSize: 14.5, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</span>
                  <span style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 20, flex: "none" }}>${r.avgPrice.toFixed(2)}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 12 }}>
                  {[["SKUs", String(r.skus)], ["Price index", r.priceIndex.toFixed(1)], ["Buy box 1P", r.buyBoxPresence + "%"]].map(([l, v]) => (
                    <div key={l} style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 12.5 }}><span className="sl-muted">{l}</span><span>{v}</span></div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      <Card padding="20px 22px 10px">
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 16 }}>
          <div><h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Category pricing</h3><div className="sl-muted" style={{ fontSize: 12.5, marginTop: 2 }}>Sort any column; select a category to scope the page</div></div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="sl-table">
            <thead><tr>
              {[["category", "Category", "left", 170], ["avgPrice", "Avg price", "right"], ["priceIndex", "Price index", "right"], ["skus", "SKUs", "right"]].map(([k, label, align, mw]) => (
                <th key={k as string} className={"is-sortable" + (catSort.key === k ? " is-sorted" : "")} style={{ textAlign: align as any, minWidth: mw as number }} onClick={() => catSortFn(k as string)}>{label}{catSort.key === k && <span className="sl-sort-caret">{catSort.dir === "asc" ? "▲" : "▼"}</span>}</th>
              ))}
            </tr></thead>
            <tbody>
              {sortedCategories.map((c: any) => {
                const selected = categoryFilter === c.category;
                return (
                  <tr className={"sl-row is-clickable" + (selected ? " is-selected" : "")} key={c.category} onClick={() => { setCategoryFilter(selected ? "" : c.category); toast(selected ? "Category filter cleared." : c.category + " — Pricing Intelligence."); }}>
                    <td><div className="sl-table-name">{c.category}</div></td>
                    <td style={{ textAlign: "right" }}>${c.avgPrice.toFixed(2)}</td>
                    <td style={{ textAlign: "right" }}>{c.priceIndex.toFixed(1)}</td>
                    <td style={{ textAlign: "right" }}>{c.skus}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
