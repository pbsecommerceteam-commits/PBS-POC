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
  /* Axis scaled to the actual data instead of a fixed 0-105 -- Search
     Visibility's real scale dropped from ~90% to a few percent once it
     was redefined as "our own results / total results" (see
     REAL_SOS_WEEKLY), so a 0-100 axis would flatten every series into an
     unreadable line along the bottom. */
  const visVals = snap.visibility.series.flatMap((s: any) => s.values as number[]);
  const visHi = Math.max(5, Math.ceil(Math.max(...visVals, 1) + 1));
  const chart = lineChart({ id: "vis", title: "Search Visibility Trend", subtitle: "Share of search across the tracked keyword set · Illustrative — no resolvable competitor entity in the raw crawl",
    labels: snap.visibility.labels, lo: 0, hi: visHi, ticks: [0, visHi / 4, visHi / 2, (visHi * 3) / 4, visHi], fmt: (v) => v.toFixed(1) + "%",
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
