import { useOutletContext } from "react-router-dom";
import { KpiCard } from "../../components/ui/KpiCard";
import { ChartCard } from "../../components/charts/ChartCard";
import { useChartHover } from "../../hooks/useChartHover";
import { lineChart, barChart, spark } from "../../lib/charts";
import { kpiCard } from "../../lib/format";
import type { ContentContext } from "./Layout";

export default function ContentSummary() {
  const { snap } = useOutletContext<ContentContext>();
  const { hover, onEnter, onLeave } = useChartHover();

  const content = snap.kpis.find((k: any) => k.id === "content");
  const issues = snap.kpis.find((k: any) => k.id === "issues");
  const trend = lineChart({ id: "ctrend", title: "Content Completeness Trend", subtitle: "Weighted completeness across tracked pages",
    labels: snap.labels, lo: 40, hi: 100, ticks: [40, 55, 70, 85, 100], fmt: (v) => String(Math.round(v)), hideLegend: true,
    series: [{ name: "Content completeness", values: snap.contentTrend.values }], previous: snap.contentTrend.previous, target: 95 }, hover, onEnter);
  const dist = barChart({ id: "cdist", title: "Completeness Distribution", subtitle: "SKUs by content completeness band",
    labels: snap.contentDistribution.map((b: any) => b.bucket), valueName: "SKUs", values: snap.contentDistribution.map((b: any) => b.count),
    lo: 0, hi: Math.max(4, Math.max(...snap.contentDistribution.map((b: any) => b.count)) + 1), ticks: [0, 2, 4, 6, 8], fmt: (v) => String(Math.round(v)) }, hover, onEnter);

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,238px),1fr))", gap: "var(--app-gap)" }}>
        <KpiCard k={kpiCard(content, spark)} />
        <KpiCard k={kpiCard(issues, spark)} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,430px),1fr))", gap: "var(--app-gap)" }}>
        <ChartCard c={trend} onLeave={onLeave} />
        <ChartCard c={dist} onLeave={onLeave} />
      </div>
    </>
  );
}
