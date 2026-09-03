import { useOutletContext } from "react-router-dom";
import { Card } from "../../components/ui/Card";
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
  const { skusTracked, skusLost, topSeller } = snap.buyBoxLoss;
  const chart = lineChart({ id: "vis", title: "Search Visibility Trend", subtitle: "Share of search across the tracked keyword set · Illustrative — no resolvable competitor entity in the raw crawl",
    labels: snap.visibility.labels, lo: 0, hi: 105, ticks: [0, 20, 40, 60, 80, 100], fmt: (v) => v.toFixed(1) + "%",
    series: snap.visibility.series, previous: snap.visibility.previous, target: 40, span: "1 / -1" }, hover, onEnter);

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,238px),1fr))", gap: "var(--app-gap)" }}>
        <KpiCard k={kpiCard(sos, spark)} />
        <KpiCard k={kpiCard(gap, spark)} />
        <Card padding="18px 20px">
          <div className="sl-muted" style={{ fontSize: 12.5 }}>SKUs with 3P Buy Box Loss</div>
          <div style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 32, lineHeight: 1, marginTop: 8, color: skusLost > 0 ? "var(--status-negative-fg)" : "inherit" }}>{skusLost}<span style={{ fontSize: 16, fontWeight: 500 }}> / {skusTracked}</span></div>
          <div className="sl-faint" style={{ fontSize: 11.5, marginTop: 8 }}>{topSeller ? "Real — top 3P seller: " + topSeller : "Real — no 3P buy-box loss in scope"}</div>
        </Card>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,430px),1fr))", gap: "var(--app-gap)" }}>
        <ChartCard c={chart} onLeave={onLeave} />
      </div>
    </>
  );
}
