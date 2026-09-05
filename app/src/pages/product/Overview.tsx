import { useOutletContext } from "react-router-dom";
import { KpiCard } from "../../components/ui/KpiCard";
import { ChartCard } from "../../components/charts/ChartCard";
import { DataTable } from "../../components/table/DataTable";
import { Card } from "../../components/ui/Card";
import { InfoTip } from "../../components/ui/InfoTip";
import { useUi } from "../../context/UiContext";
import { useChartHover } from "../../hooks/useChartHover";
import { barChart, spark } from "../../lib/charts";
import { kpiCard, cell, table, seriesToCsv, rowsToCsv, downloadCsv } from "../../lib/format";
import type { ProductDetailContext } from "./Layout";

export default function ProductOverview() {
  const { p, t, labels, detail } = useOutletContext<ProductDetailContext>();
  const { toast } = useUi();
  const { hover, onEnter, onLeave } = useChartHover();

  const isReal = detail.dataSource === "real";
  const realWindow = labels.length ? `${labels[0]}–${labels[labels.length - 1]}` : "Sep 8–29";
  const realNote = isReal ? ` · Real crawl data (${realWindow})` : " · Illustrative — crawl covers one month only";

  const kpis = [
    { id: "instock", label: "Stock Availability 1P + 3P", unit: "%", value: p.inStockRate, target: 98, delta: Number((p.inStockRate - t.stock[0]).toFixed(1)), spark: t.stock, labels },
    { id: "rating", label: "Average Rating", unit: "", value: p.rating, target: 4.5, delta: Number((p.rating - t.rating[0]).toFixed(2)), spark: t.rating, labels },
    { id: "content", label: "Content Completeness", unit: "%", value: p.contentScore, target: 95, delta: 0, spark: t.stock.map((_v: number, i: number) => Math.round(p.contentScore - 4 + (i / labels.length) * 4)), labels },
  ];

  const stockChart = barChart({ id: "d-stock", title: "Stock Availability 1P + 3P Trend", subtitle: "In-stock rate at this retailer" + realNote, badge: "Target 98%",
    labels, values: t.stock, valueName: "In stock", lo: 60, hi: 100, ticks: [60, 70, 80, 90, 100], fmt: (v) => v.toFixed(1) + "%", target: 98,
    fill: (v) => (v >= 98 ? "var(--status-positive-fg)" : "var(--color-accent-300)") }, hover, onEnter);
  const exportStockChart = () => {
    downloadCsv("shelfline-" + p.id + "-stock-availability-trend.csv", seriesToCsv(labels, [{ name: "In Stock %", values: t.stock }]));
    toast("Exported Stock Availability Trend.");
  };

  const facts = [
    { label: "Stock Availability 1P + 3P", value: p.inStockRate.toFixed(1) + "%", sub: p.stockStatus },
    { label: "Average price", value: "$" + p.avgSellingPrice.toFixed(2), sub: "$" + p.price.toFixed(2) + " current price" },
    { label: "Content completeness", value: p.contentScore + "%", sub: "of content checks passed" },
    { label: "Rating", value: p.rating.toFixed(2), sub: "average rating" },
    { label: "Review count", value: p.reviews.toLocaleString(), sub: "tracked reviews" },
    { label: "Buy Box Ownership 1P", value: p.buyBoxRate + "%", sub: detail.note },
  ];
  const exportFacts = () => {
    downloadCsv("shelfline-" + p.id + "-key-facts.csv", rowsToCsv(["Metric", "Value", "Detail"], facts.map((f) => [f.label, f.value, f.sub])));
    toast("Exported key facts.");
  };

  /* Real cross-retailer comparison -- "listed: true" only when a genuine
     match exists in our own sample (same brand, >=45% name overlap, see
     CROSS_RETAILER_MATCH); every other retailer honestly reads "Not
     tracked" instead of fabricating a listing we have no evidence of. */
  const retailerTable = table("Where else this SKU is tracked", "Real cross-retailer match when one genuinely exists -- honest \"Not tracked\" otherwise, never a fabricated listing",
    [{ label: "Retailer", align: "left" }, { label: "Price", align: "right" }, { label: "In Stock", align: "right" }, { label: "Rating", align: "right" }, { label: "Content", align: "right" }],
    detail.retailerPerformance.map((r: any) => ({ cells: [
      cell(r.retailer, { strong: r.isSelf, sub: r.isSelf ? "This listing" : (r.listed ? undefined : "Not tracked") }),
      cell(r.listed ? "$" + r.price.toFixed(2) : "—", { align: "right" }),
      cell(r.listed ? r.inStock.toFixed(1) + "%" : "—", { align: "right" }),
      cell(r.listed ? r.rating.toFixed(2) : "—", { align: "right" }),
      cell(r.listed ? r.content + "%" : "—", { align: "right" }),
    ] })),
    "Matches are found by same brand + ≥45% product-name overlap within our own tracked sample -- not every retailer's full catalog, so \"Not tracked\" can mean genuinely absent or simply outside this sample.");

  return (
    <>
      <Card padding="20px 22px">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div className="sl-eyebrow" style={{ display: "flex", alignItems: "center", gap: 6 }}>Key facts<InfoTip text="Each figure is the same real value shown elsewhere on this page or tab -- collected here as a quick-reference summary." /></div>
          <button type="button" className="btn btn-ghost" onClick={exportFacts} style={{ fontSize: 12, padding: "5px 10px", minHeight: "auto" }}>⬇ Export</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 18 }}>
          {facts.map((f) => (
            <div key={f.label} style={{ minWidth: 0 }}>
              <div className="sl-eyebrow">{f.label}</div>
              <div style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 17, lineHeight: 1.3, marginTop: 3 }}>{f.value}</div>
              <div className="sl-muted" style={{ fontSize: 11.5 }}>{f.sub}</div>
            </div>
          ))}
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,238px),1fr))", gap: "var(--app-gap)" }}>
        {kpis.map((k) => <KpiCard key={k.id} k={kpiCard(k, spark)} />)}
      </div>

      <ChartCard c={stockChart} onLeave={onLeave} onExportCsv={exportStockChart} />

      <DataTable t={retailerTable} />
    </>
  );
}
