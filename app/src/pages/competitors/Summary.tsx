import { useOutletContext } from "react-router-dom";
import { KpiCard } from "../../components/ui/KpiCard";
import { ChartCard } from "../../components/charts/ChartCard";
import { useChartHover } from "../../hooks/useChartHover";
import { lineChart, spark } from "../../lib/charts";
import { kpiCard } from "../../lib/format";
import type { CompetitorsContext } from "./Layout";

export default function CompetitorsSummary() {
  const { snap } = useOutletContext<CompetitorsContext>();
  const { hover, onEnter, onLeave } = useChartHover();

  const sos = snap.kpis.find((k: any) => k.id === "sos");
  const gap = snap.kpis.find((k: any) => k.id === "gap");
  const chart = lineChart({ id: "vis", title: "Search Visibility Trend", subtitle: "Share of search across the tracked keyword set",
    labels: snap.labels, lo: 0, hi: 55, ticks: [0, 10, 20, 30, 40, 50], fmt: (v) => v.toFixed(1) + "%",
    series: snap.visibility.series, previous: snap.visibility.previous, target: 40, span: "1 / -1" }, hover, onEnter);

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,238px),1fr))", gap: "var(--app-gap)" }}>
        <KpiCard k={kpiCard(sos, spark)} />
        <KpiCard k={kpiCard(gap, spark)} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,430px),1fr))", gap: "var(--app-gap)" }}>
        <ChartCard c={chart} onLeave={onLeave} />
      </div>
    </>
  );
}
