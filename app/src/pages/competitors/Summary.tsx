import { useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { Card } from "../../components/ui/Card";
import { KpiCard } from "../../components/ui/KpiCard";
import { DrilldownModal, type DrillTableConfig } from "../../components/ui/DrilldownModal";
import { spark } from "../../lib/charts";
import { kpiCard, cell } from "../../lib/format";
import { REAL_BUYBOX_COMPETITOR, REAL_BUYBOX_TIMELINE } from "../../data/mockData";
import type { CompetitorsContext } from "./Layout";

const MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const fmtDate = (iso: string) => { const [, m, d] = iso.split("-").map(Number); return MONTH_ABBR[m - 1] + " " + d; };

/** Real day-by-day buy-box holder behind a SKU's Competitor Days Won count
 *  (see REAL_BUYBOX_TIMELINE) -- same as Pricing Intelligence's Buy Box
 *  Lost (1P) drill-down: the raw timeline marks our own days "You", shown
 *  here as the SKU's actual retailer name since every other holder in the
 *  column is already a real named entity. */
function buyBoxDateDetail(pid: string, retailerName: string) {
  const timeline = (REAL_BUYBOX_TIMELINE as any)[pid];
  if (!timeline || !timeline.length) return undefined;
  return { cols: ["Date", "Held By"], rows: timeline.map((e: any) => [fmtDate(e.date), e.holder === "You" ? retailerName : e.holder]) };
}

/* Search Visibility (the "sos"/"gap" KPIs and the Search Visibility Trend
   chart this page used to show) is retired from the frontend -- kept
   computed in mockData.ts for any future/backend use, but no longer
   rendered or read here. Avg Keyword Coverage (real) takes the first
   tile's place instead of a KPI-shaped gap. */
export default function CompetitorsSummary() {
  const { snap } = useOutletContext<CompetitorsContext>();
  const navigate = useNavigate();
  const [drill, setDrill] = useState<DrillTableConfig | null>(null);

  const avgCoverage = snap.kpis.find((k: any) => k.id === "avgcoverage");
  const { skusTracked, skusLost, topSeller } = snap.buyBoxLoss;
  const buyBoxLostProducts = snap.products
    .filter((p: any) => REAL_BUYBOX_COMPETITOR[p.id])
    .map((p: any) => ({ p, ...REAL_BUYBOX_COMPETITOR[p.id] }))
    .sort((a: any, b: any) => b.daysWon - a.daysWon);
  const buyBoxLostTable: DrillTableConfig = {
    title: "SKUs with 3P Buy Box Loss", subtitle: `${skusLost} of ${skusTracked} SKUs had a 3P seller win the buy box at some point this period`,
    cols: [{ label: "Product", align: "left" }, { label: "Retailer", align: "center" }, { label: "Retailer ID", align: "center" }, { label: "Competitor", align: "center" }, { label: "Competitor Days Won", align: "center" }, { label: "Buy Box Rate", align: "center" }],
    rows: buyBoxLostProducts.map(({ p, seller, daysWon }: any) => ({ cells: [
      cell(p.name, { onClick: () => { setDrill(null); navigate("/product/" + p.id); } }),
      cell(p.retailerName, { align: "center" }),
      cell(p.retailerId, { align: "center" }),
      cell(seller, { align: "center" }),
      cell(daysWon + " of 30", { align: "center" }),
      cell(p.buyBoxRate + "%", { align: "center", color: p.buyBoxRate < 50 ? "var(--status-negative-fg)" : "inherit" }),
    ], detail: buyBoxDateDetail(p.id, p.retailerName) })),
  };

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,238px),1fr))", gap: "var(--app-gap)" }}>
        <KpiCard k={kpiCard(avgCoverage, spark)} />
        <Card padding="18px 20px" interactive onClick={() => setDrill(buyBoxLostTable)}>
          <div className="sl-muted" style={{ fontSize: 12.5 }}>SKUs with 3P Buy Box Loss</div>
          <div style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 32, lineHeight: 1, marginTop: 8, color: skusLost > 0 ? "var(--status-negative-fg)" : "inherit" }}>{skusLost}<span style={{ fontSize: 16, fontWeight: 500 }}> / {skusTracked}</span></div>
          <div className="sl-faint" style={{ fontSize: 11.5, marginTop: 8 }}>{topSeller ? "Real — top 3P seller: " + topSeller : "Real — no 3P buy-box loss in scope"}</div>
        </Card>
      </div>

      {drill && <DrilldownModal t={drill} onClose={() => setDrill(null)} />}
    </>
  );
}
