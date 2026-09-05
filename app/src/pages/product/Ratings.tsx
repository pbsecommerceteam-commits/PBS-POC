import { useOutletContext } from "react-router-dom";
import { KpiCard } from "../../components/ui/KpiCard";
import { ChartCard } from "../../components/charts/ChartCard";
import { Card } from "../../components/ui/Card";
import { InfoTip } from "../../components/ui/InfoTip";
import { useUi } from "../../context/UiContext";
import { useChartHover } from "../../hooks/useChartHover";
import { lineChart, spark } from "../../lib/charts";
import { kpiCard, seriesToCsv, downloadCsv } from "../../lib/format";
import type { ProductDetailContext } from "./Layout";

export default function ProductRatings() {
  const { p, t, labels, detail } = useOutletContext<ProductDetailContext>();
  const { toast } = useUi();
  const { hover, onEnter, onLeave } = useChartHover();

  const isReal = detail.dataSource === "real";
  const realWindow = labels.length ? `${labels[0]}–${labels[labels.length - 1]}` : "Sep 8–29";
  const realNote = isReal ? ` · Real crawl data (${realWindow})` : " · Illustrative — crawl covers one month only";

  const ratingKpi = { id: "rating", label: "Average Rating", unit: "", value: p.rating, target: 4.5, delta: Number((p.rating - t.rating[0]).toFixed(2)), spark: t.rating, labels };
  const reviewsDelta = t.reviews[t.reviews.length - 1] - t.reviews[0];

  const maxStars = Math.max(...detail.reviewMix.map((m: any) => m.count));
  const reviewsLo = Math.min(...t.reviews), reviewsHi = Math.max(...t.reviews);

  const ratingChart = lineChart({ id: "d-rating", title: "Rating Trend", subtitle: "Average rating" + realNote + " · Star breakdown illustrative — no per-star rating data in the raw crawl",
    labels, lo: 3.4, hi: 5, ticks: [3.4, 4, 4.5, 5], fmt: (v) => v.toFixed(2), hideLegend: true, series: [{ name: "Rating", values: t.rating }],
    footer: detail.reviewMix.map((m: any) => ({ label: m.stars + " star", value: m.count.toLocaleString(), color: m.count === maxStars ? "var(--status-positive-fg)" : "var(--status-neutral-fg)" })) }, hover, onEnter);
  const reviewsChart = lineChart({ id: "d-reviews", title: "Review Count Trend", subtitle: "Total tracked reviews over the period" + realNote,
    labels, lo: reviewsLo * 0.97, hi: reviewsHi * 1.04, ticks: [reviewsLo, (reviewsLo + reviewsHi) / 2, reviewsHi], fmt: (v) => Math.round(v).toLocaleString(), hideLegend: true,
    series: [{ name: "Review count", values: t.reviews }] }, hover, onEnter);

  const exportChart = (filename: string, label: string, series: Array<{ name: string; values: number[] }>) => {
    downloadCsv(filename, seriesToCsv(labels, series));
    toast("Exported " + label + ".");
  };

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,238px),1fr))", gap: "var(--app-gap)" }}>
        <KpiCard k={kpiCard(ratingKpi, spark)} />
        <Card padding="18px 20px">
          <div className="sl-muted" style={{ fontSize: 12.5, display: "flex", alignItems: "center", gap: 5 }}>
            Review Count<InfoTip text="Real crawled review count total for this SKU." />
          </div>
          <div style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 32, lineHeight: 1, marginTop: 8 }}>{p.reviews.toLocaleString()}</div>
          <div className="sl-faint" style={{ fontSize: 11.5, marginTop: 8 }}>{reviewsDelta >= 0 ? "+" : ""}{Math.round(reviewsDelta).toLocaleString()} vs previous period</div>
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,430px),1fr))", gap: "var(--app-gap)" }}>
        <ChartCard c={ratingChart} onLeave={onLeave} onExportCsv={() => exportChart("shelfline-" + p.id + "-rating-trend.csv", "Rating Trend", [{ name: "Rating", values: t.rating }])} />
        <ChartCard c={reviewsChart} onLeave={onLeave} onExportCsv={() => exportChart("shelfline-" + p.id + "-review-count-trend.csv", "Review Count Trend", [{ name: "Review Count", values: t.reviews }])} />
      </div>
    </>
  );
}
