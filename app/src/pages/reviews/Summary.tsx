import { useOutletContext } from "react-router-dom";
import { KpiCard } from "../../components/ui/KpiCard";
import { ChartCard } from "../../components/charts/ChartCard";
import { useChartHover } from "../../hooks/useChartHover";
import { lineChart, spark } from "../../lib/charts";
import { kpiCard } from "../../lib/format";
import type { ReviewsContext } from "./Layout";

export default function ReviewsSummary() {
  const { snap } = useOutletContext<ReviewsContext>();
  const { hover, onEnter, onLeave } = useChartHover();

  const rating = snap.kpis.find((k: any) => k.id === "rating");
  const reviews = snap.kpis.find((k: any) => k.id === "reviews");
  const trend = lineChart({ id: "rtrend", title: "Rating Trend", subtitle: "Weighted average rating across tracked SKUs",
    labels: snap.labels, lo: 3.6, hi: 5, ticks: [3.6, 4, 4.4, 4.8], fmt: (v) => v.toFixed(2), hideLegend: true,
    series: [{ name: "Average rating", values: snap.ratingTrend.values }], previous: snap.ratingTrend.previous, target: 4.5,
    span: "1 / -1", badge: "Target 4.5" }, hover, onEnter);

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,238px),1fr))", gap: "var(--app-gap)" }}>
        <KpiCard k={kpiCard(rating, spark)} />
        <KpiCard k={kpiCard(reviews, spark)} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,430px),1fr))", gap: "var(--app-gap)" }}>
        <ChartCard c={trend} onLeave={onLeave} />
      </div>
    </>
  );
}
