import { useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { ChartCard } from "../../components/charts/ChartCard";
import { DataTable } from "../../components/table/DataTable";
import { DrilldownModal } from "../../components/ui/DrilldownModal";
import { useChartHover } from "../../hooks/useChartHover";
import { useUi } from "../../context/UiContext";
import { lineChart, spark } from "../../lib/charts";
import { kpiCard, cell, table, seriesToCsv, downloadCsv, type TableConfig } from "../../lib/format";
import type { Product } from "../../models/types";
import type { ReviewsContext } from "./Layout";

function groupBy(products: Product[], key: "retailerName" | "category" | "brand") {
  const map = new Map<string, { skus: number; ratingSum: number; reviews: number; products: Product[] }>();
  products.forEach((p) => {
    const k = p[key];
    const g = map.get(k) || { skus: 0, ratingSum: 0, reviews: 0, products: [] };
    g.skus++; g.ratingSum += p.rating; g.reviews += p.reviews; g.products.push(p);
    map.set(k, g);
  });
  return Array.from(map.entries())
    .map(([name, g]) => ({ name, avgRating: g.ratingSum / g.skus, reviews: g.reviews, skus: g.skus, products: g.products }))
    .sort((a, b) => b.avgRating - a.avgRating);
}

export default function ReviewsSummary() {
  const { snap, products } = useOutletContext<ReviewsContext>();
  const { hover, onEnter, onLeave } = useChartHover();
  const { toast } = useUi();
  const navigate = useNavigate();
  const [drill, setDrill] = useState<TableConfig | null>(null);
  const goToProduct = (id: string) => { setDrill(null); navigate("/product/" + id); };

  const rating = snap.kpis.find((k: any) => k.id === "rating");
  const reviews = snap.kpis.find((k: any) => k.id === "reviews");
  /* Reuse the exact same kpiCard() view-model every KpiCard on the app
     builds from, so the badge/footer below shows identical numbers/
     formatting to what the (now-removed) standalone Rating/Review Count
     KPI cards used to -- nothing lost, just relocated onto the trend
     chart that was already showing the same series as their sparklines. */
  const ratingVM = kpiCard(rating, spark);
  const reviewsVM = kpiCard(reviews, spark);

  const trend = lineChart({ id: "rtrend", title: "Rating Trend", subtitle: "Weighted average rating across tracked SKUs",
    labels: snap.labels, lo: 3.6, hi: 5, ticks: [3.6, 4, 4.4, 4.8], fmt: (v) => v.toFixed(2), hideLegend: true,
    series: [{ name: "Average rating", values: snap.ratingTrend.values }], previous: snap.ratingTrend.previous, target: 4.5,
    badge: ratingVM.goalText,
    footer: [
      { label: "Average rating now", value: ratingVM.valueText, color: "inherit" },
      { label: "vs previous period", value: ratingVM.deltaText, color: ratingVM.deltaColor },
      { label: "Status", value: ratingVM.statusText, color: ratingVM.statusColor },
    ] }, hover, onEnter);
  const volumeTrend = lineChart({ id: "rvoltrend", title: "Review Volume Trend", subtitle: "Total tracked reviews across the selected period",
    labels: snap.labels, lo: Math.min(...reviews.spark) * 0.97, hi: Math.max(...reviews.spark) * 1.03,
    ticks: [Math.min(...reviews.spark), (Math.min(...reviews.spark) + Math.max(...reviews.spark)) / 2, Math.max(...reviews.spark)],
    fmt: (v) => Math.round(v).toLocaleString(), hideLegend: true,
    series: [{ name: "Review count", values: reviews.spark }],
    badge: reviewsVM.goalText,
    footer: [
      { label: "Reviews now", value: reviewsVM.valueText, color: "inherit" },
      { label: "vs previous period", value: reviewsVM.deltaText, color: reviewsVM.deltaColor },
      { label: "Status", value: reviewsVM.statusText, color: reviewsVM.statusColor },
    ] }, hover, onEnter);
  const exportTrend = () => {
    downloadCsv("shelfline-rating-trend.csv", seriesToCsv(snap.labels, [{ name: "Average Rating", values: snap.ratingTrend.values }]));
    toast("Exported Rating Trend.");
  };
  const exportVolumeTrend = () => {
    downloadCsv("shelfline-review-volume-trend.csv", seriesToCsv(snap.labels, [{ name: "Review Count", values: reviews.spark }]));
    toast("Exported Review Volume Trend.");
  };

  /* Clicking a retailer/category's rating or review count opens the exact
     SKUs averaged into that number -- same table()/cell() + DrilldownModal
     pattern used on Pricing Intelligence and Content Intelligence Summary,
     so "4.28 average across 30 SKUs" always has a one-click answer to
     "which 30, and what's each one rated". Folded in from the former
     Benchmarks tab, which had nothing else on it. */
  const groupDrill = (groupLabel: string, name: string, prods: Product[]) => table(
    `${groupLabel}: ${name}`, `${prods.length} tracked SKUs behind this row's average`,
    [{ label: "Product", align: "left" }, { label: "Retailer", align: "left" }, { label: "Rating", align: "right" }, { label: "Reviews", align: "right" }],
    prods.slice().sort((a, b) => b.rating - a.rating).map((p) => ({ cells: [
      cell(p.name, { onClick: () => goToProduct(p.id) }),
      cell(p.retailerName),
      cell(p.rating.toFixed(2), { align: "right", strong: true }),
      cell(p.reviews.toLocaleString(), { align: "right" }),
    ] })));

  const retailerGroups = groupBy(products, "retailerName");
  const categoryGroups = groupBy(products, "category");

  /* Best/worst rated products and brands -- excludes SKUs with 0 reviews
     (never genuinely rated, not a real "bad" score of 0) from both lists,
     same reasoning as the rest of the app's real-rating handling. Ranked
     by rating first, review count as the tiebreaker (and the reason it's
     shown alongside) so a 5.00 from 1 review doesn't outrank a 4.8 from
     500 without the reader seeing why. */
  const ratedProducts = products.filter((p) => p.reviews > 0);
  const bestProducts = ratedProducts.slice().sort((a, b) => b.rating - a.rating || b.reviews - a.reviews).slice(0, 5);
  const worstProducts = ratedProducts.slice().sort((a, b) => a.rating - b.rating || b.reviews - a.reviews).slice(0, 5);
  const brandGroups = groupBy(ratedProducts, "brand");
  const bestBrands = brandGroups.slice().sort((a, b) => b.avgRating - a.avgRating || b.reviews - a.reviews).slice(0, 5);
  const worstBrands = brandGroups.slice().sort((a, b) => a.avgRating - b.avgRating || b.reviews - a.reviews).slice(0, 5);

  const productRankTable = (title: string, subtitle: string, rows: Product[]) => table(title, subtitle,
    [{ label: "Product", align: "left" }, { label: "Retailer", align: "left" }, { label: "Rating", align: "right" }, { label: "Reviews", align: "right" }],
    rows.map((p) => ({ cells: [
      cell(p.name, { onClick: () => goToProduct(p.id) }),
      cell(p.retailerName),
      cell(p.rating.toFixed(2), { align: "right", strong: true }),
      cell(p.reviews.toLocaleString(), { align: "right" }),
    ] })));
  const bestProductsTable = productRankTable("Best Rated Products", "Top 5 by rating, review count as tiebreaker -- excludes never-reviewed SKUs", bestProducts);
  const worstProductsTable = productRankTable("Worst Rated Products", "Bottom 5 by rating, review count as tiebreaker -- excludes never-reviewed SKUs", worstProducts);

  const brandRankTable = (title: string, subtitle: string, rows: typeof brandGroups) => table(title, subtitle,
    [{ label: "Brand", align: "left" }, { label: "Tracked SKUs", align: "right" }, { label: "Avg rating", align: "right" }, { label: "Review count", align: "right" }],
    rows.map((b) => ({ cells: [
      cell(b.name, { strong: true, onClick: () => setDrill(groupDrill("Brand", b.name, b.products)) }),
      cell(String(b.skus), { align: "right" }),
      cell(b.avgRating.toFixed(2), { align: "right", strong: true }),
      cell(b.reviews.toLocaleString(), { align: "right" }),
    ] })));
  const bestBrandsTable = brandRankTable("Best Rated Brands", "Top 5 by average rating across reviewed SKUs, review count as tiebreaker", bestBrands);
  const worstBrandsTable = brandRankTable("Worst Rated Brands", "Bottom 5 by average rating across reviewed SKUs, review count as tiebreaker", worstBrands);

  const retailerTable = table("Retailer comparison", "Average rating and review count at each monitored retailer -- click a row to see its SKUs",
    [{ label: "Retailer", align: "left" }, { label: "Tracked SKUs", align: "right" }, { label: "Avg rating", align: "right" }, { label: "Review count", align: "right" }],
    retailerGroups.map((r) => ({ cells: [
      cell(r.name, { strong: true, onClick: () => setDrill(groupDrill("Retailer", r.name, r.products)) }),
      cell(String(r.skus), { align: "right" }),
      cell(r.avgRating.toFixed(2), { align: "right", strong: true }),
      cell(r.reviews.toLocaleString(), { align: "right" }),
    ] })));

  const categoryTable = table("Category comparison", "Average rating and review count by tracked category -- click a row to see its SKUs",
    [{ label: "Category", align: "left" }, { label: "Tracked SKUs", align: "right" }, { label: "Avg rating", align: "right" }, { label: "Review count", align: "right" }],
    categoryGroups.map((c) => ({ cells: [
      cell(c.name, { strong: true, onClick: () => setDrill(groupDrill("Category", c.name, c.products)) }),
      cell(String(c.skus), { align: "right" }),
      cell(c.avgRating.toFixed(2), { align: "right", strong: true }),
      cell(c.reviews.toLocaleString(), { align: "right" }),
    ] })));

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,430px),1fr))", gap: "var(--app-gap)" }}>
        <ChartCard c={trend} onLeave={onLeave} onExportCsv={exportTrend} />
        <ChartCard c={volumeTrend} onLeave={onLeave} onExportCsv={exportVolumeTrend} />
      </div>
      <DataTable t={retailerTable} />
      <DataTable t={categoryTable} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,430px),1fr))", gap: "var(--app-gap)" }}>
        <DataTable t={bestProductsTable} />
        <DataTable t={worstProductsTable} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,430px),1fr))", gap: "var(--app-gap)" }}>
        <DataTable t={bestBrandsTable} />
        <DataTable t={worstBrandsTable} />
      </div>
      {drill && <DrilldownModal t={drill} onClose={() => setDrill(null)} />}
    </>
  );
}
