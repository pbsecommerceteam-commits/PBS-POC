import { useOutletContext } from "react-router-dom";
import { KpiCard } from "../../components/ui/KpiCard";
import { ChartCard } from "../../components/charts/ChartCard";
import { useChartHover } from "../../hooks/useChartHover";
import { useUi } from "../../context/UiContext";
import { lineChart, spark } from "../../lib/charts";
import { kpiCard, seriesToCsv, downloadCsv } from "../../lib/format";
import type { ReviewsContext } from "./Layout";

export default function ReviewsSummary() {
  const { snap } = useOutletContext<ReviewsContext>();
  const { hover, onEnter, onLeave } = useChartHover();
  const { toast } = useUi();

  const rating = snap.kpis.find((k: any) => k.id === "rating");
  const reviews = snap.kpis.find((k: any) => k.id === "reviews");
  const trend = lineChart({ id: "rtrend", title: "Rating Trend", subtitle: "Weighted average rating across tracked SKUs",
    labels: snap.labels, lo: 3.6, hi: 5, ticks: [3.6, 4, 4.4, 4.8], fmt: (v) => v.toFixed(2), hideLegend: true,
    series: [{ name: "Average rating", values: snap.ratingTrend.values }], previous: snap.ratingTrend.previous, target: 4.5,
    badge: "Target 4.5" }, hover, onEnter);
  const volumeTrend = lineChart({ id: "rvoltrend", title: "Review Volume Trend", subtitle: "Total tracked reviews across the selected period",
    labels: snap.labels, lo: Math.min(...reviews.spark) * 0.97, hi: Math.max(...reviews.spark) * 1.03,
    ticks: [Math.min(...reviews.spark), (Math.min(...reviews.spark) + Math.max(...reviews.spark)) / 2, Math.max(...reviews.spark)],
    fmt: (v) => Math.round(v).toLocaleString(), hideLegend: true,
    series: [{ name: "Review count", values: reviews.spark }] }, hover, onEnter);
  const exportTrend = () => {
    downloadCsv("shelfline-rating-trend.csv", seriesToCsv(snap.labels, [{ name: "Average Rating", values: snap.ratingTrend.values }]));
    toast("Exported Rating Trend.");
  };
  const exportVolumeTrend = () => {
    downloadCsv("shelfline-review-volume-trend.csv", seriesToCsv(snap.labels, [{ name: "Review Count", values: reviews.spark }]));
    toast("Exported Review Volume Trend.");
  };

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,238px),1fr))", gap: "var(--app-gap)" }}>
        <KpiCard k={kpiCard(rating, spark)} />
        <KpiCard k={kpiCard(reviews, spark)} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,430px),1fr))", gap: "var(--app-gap)" }}>
        <ChartCard c={trend} onLeave={onLeave} onExportCsv={exportTrend} />
        <ChartCard c={volumeTrend} onLeave={onLeave} onExportCsv={exportVolumeTrend} />
      </div>
    </>
  );
}
