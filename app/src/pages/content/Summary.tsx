import { useOutletContext } from "react-router-dom";
import { Card } from "../../components/ui/Card";
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
  const { improved, declined } = snap.contentChange;
  /* Real, from the 22 Varient label/value pairs each product's Content-tab
     row carries (see build_mock_data.py) -- the retailer's other pack-size/
     color/style listings for that SKU, not a synthetic estimate. */
  const withVariations = snap.products.filter((p: any) => p.variations.length > 0).length;
  const totalVariations = snap.products.reduce((a: number, p: any) => a + p.variations.length, 0);
  const trend = lineChart({ id: "ctrend", title: "Content Completeness Trend", subtitle: "Weighted completeness across tracked pages",
    labels: snap.labels, lo: 40, hi: 100, ticks: [40, 55, 70, 85, 100], fmt: (v) => Math.round(v) + "%", hideLegend: true,
    series: [{ name: "Content completeness", values: snap.contentTrend.values }], previous: snap.contentTrend.previous, target: 95 }, hover, onEnter);
  const dist = barChart({ id: "cdist", title: "Completeness Distribution", subtitle: "SKUs by content completeness band",
    labels: snap.contentDistribution.map((b: any) => b.bucket), valueName: "SKUs", values: snap.contentDistribution.map((b: any) => b.count),
    lo: 0, hi: Math.max(4, Math.max(...snap.contentDistribution.map((b: any) => b.count)) + 1), ticks: [0, 2, 4, 6, 8], fmt: (v) => String(Math.round(v)) }, hover, onEnter);
  const maxIssue = Math.max(1, ...snap.contentIssues.map((i: any) => i.count));

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,200px),1fr))", gap: "var(--app-gap)" }}>
        <KpiCard k={kpiCard(content, spark)} />
        <Card padding="18px 20px">
          <div className="sl-muted" style={{ fontSize: 12.5 }}>Score Improved</div>
          <div style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 32, lineHeight: 1, marginTop: 8, color: "var(--status-positive-fg)" }}>{improved}</div>
          <div className="sl-faint" style={{ fontSize: 11.5, marginTop: 8 }}>SKUs, real Sep 1 → Sep 29</div>
        </Card>
        <Card padding="18px 20px">
          <div className="sl-muted" style={{ fontSize: 12.5 }}>Score Declined</div>
          <div style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 32, lineHeight: 1, marginTop: 8, color: "var(--status-negative-fg)" }}>{declined}</div>
          <div className="sl-faint" style={{ fontSize: 11.5, marginTop: 8 }}>SKUs, real Sep 1 → Sep 29</div>
        </Card>
        <KpiCard k={kpiCard(issues, spark)} />
        <Card padding="18px 20px">
          <div className="sl-muted" style={{ fontSize: 12.5 }}>Products With Variations</div>
          <div style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 32, lineHeight: 1, marginTop: 8 }}>{withVariations}<span style={{ fontSize: 16, fontWeight: 500 }}> / {snap.products.length}</span></div>
          <div className="sl-faint" style={{ fontSize: 11.5, marginTop: 8 }}>Real pack-size/color/style listings</div>
        </Card>
        <Card padding="18px 20px">
          <div className="sl-muted" style={{ fontSize: 12.5 }}>Total Variations Tracked</div>
          <div style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 32, lineHeight: 1, marginTop: 8 }}>{totalVariations}</div>
          <div className="sl-faint" style={{ fontSize: 11.5, marginTop: 8 }}>Across {withVariations} SKU{withVariations === 1 ? "" : "s"} with variations</div>
        </Card>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,430px),1fr))", gap: "var(--app-gap)" }}>
        <ChartCard c={trend} onLeave={onLeave} />
        <ChartCard c={dist} onLeave={onLeave} />
      </div>
      <Card padding="20px 22px">
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Products With Issues</h3>
        <div className="sl-muted" style={{ fontSize: 12.5, marginTop: 2, marginBottom: 16 }}>Real per-check failure counts across {snap.products.length} tracked SKUs</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {snap.contentIssues.map((i: any) => (
            <div key={i.id}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 5 }}>
                <span>{i.label}</span><span style={{ fontWeight: 600 }}>{i.count}</span>
              </div>
              <div className="sl-progress-track" style={{ height: 6 }}>
                <span className="sl-progress-fill" style={{ width: (i.count / maxIssue) * 100 + "%" }}></span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}
