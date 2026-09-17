import { useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { Card } from "../../components/ui/Card";
import { InfoTip } from "../../components/ui/InfoTip";
import { KpiCard } from "../../components/ui/KpiCard";
import { ChartCard } from "../../components/charts/ChartCard";
import { DrilldownModal } from "../../components/ui/DrilldownModal";
import { useChartHover } from "../../hooks/useChartHover";
import { lineChart, barChart, spark } from "../../lib/charts";
import { kpiCard, cell, table, seriesToCsv, downloadCsv, type TableConfig } from "../../lib/format";
import { REAL_PRODUCT_WEEKLY, CONTENT_ISSUE_IMPACT } from "../../data/mockData";
import { useUi } from "../../context/UiContext";
import type { ContentContext } from "./Layout";

export default function ContentSummary() {
  const { snap } = useOutletContext<ContentContext>();
  const { hover, onEnter, onLeave } = useChartHover();
  const navigate = useNavigate();
  const { toast } = useUi();
  const [drill, setDrill] = useState<TableConfig | null>(null);
  const goToProduct = (id: string) => { setDrill(null); navigate("/product/" + id); };

  const content = snap.kpis.find((k: any) => k.id === "content");
  const issues = snap.kpis.find((k: any) => k.id === "issues");
  const { improved, declined } = snap.contentChange;
  /* Real, from the 22 Varient label/value pairs each product's Content-tab
     row carries (see build_mock_data.py) -- the retailer's other pack-size/
     color/style listings for that SKU, not a synthetic estimate. A single
     variation entry is usually just a crawl artifact (one stray label/value
     pair with no real sibling option), not a genuine "this SKU has
     variants" case -- so a SKU only counts here once it has 2 or more. */
  const withVariations = snap.products.filter((p: any) => p.variations.length >= 2).length;
  const totalVariations = snap.products.filter((p: any) => p.variations.length >= 2).reduce((a: number, p: any) => a + p.variations.length, 0);

  /* Real week-over-week (Sep 1 vs Sep 29) content score movement, same
     REAL_PRODUCT_WEEKLY series snap.contentChange's counts are tallied
     from -- reconstructed per-product here so a click can show exactly
     which SKUs moved, not just how many. */
  const scoreMoves = snap.products
    .map((p: any) => ({ p, series: (REAL_PRODUCT_WEEKLY as any)[p.id]?.content }))
    .filter((m: any) => !!m.series && m.series.length);
  const lastI = (s: number[]) => s.length - 1;
  const improvedProducts = scoreMoves.filter((m: any) => m.series[lastI(m.series)] > m.series[0]).sort((a: any, b: any) => (b.series[lastI(b.series)] - b.series[0]) - (a.series[lastI(a.series)] - a.series[0]));
  const declinedProducts = scoreMoves.filter((m: any) => m.series[lastI(m.series)] < m.series[0]).sort((a: any, b: any) => (a.series[lastI(a.series)] - a.series[0]) - (b.series[lastI(b.series)] - b.series[0]));
  const variationProducts = snap.products.filter((p: any) => p.variations.length >= 2).sort((a: any, b: any) => b.variations.length - a.variations.length);
  const firstLabel = snap.labels[0], lastLabel = snap.labels[snap.labels.length - 1];
  const periodRange = firstLabel + " → " + lastLabel;

  const scoreMoveTable = (title: string, subtitle: string, rows: any[]) => table(title, subtitle,
    [{ label: "Product", align: "left" }, { label: "Retailer", align: "left" }, { label: firstLabel, align: "right" }, { label: lastLabel, align: "right" }, { label: "Change", align: "right" }],
    rows.map(({ p, series }: any) => { const li = lastI(series); return { cells: [
      cell(p.name, { onClick: () => goToProduct(p.id) }),
      cell(p.retailerName),
      cell(String(series[0]), { align: "right" }),
      cell(String(series[li]), { align: "right" }),
      cell((series[li] >= series[0] ? "+" : "") + (series[li] - series[0]), { align: "right", color: series[li] >= series[0] ? "var(--status-positive-fg)" : "var(--status-negative-fg)" }),
    ] }; }));
  const improvedTable = scoreMoveTable("Score Improved", `${improved} SKUs with a real content score gain, ${periodRange}`, improvedProducts);
  const declinedTable = scoreMoveTable("Score Declined", `${declined} SKUs with a real content score drop, ${periodRange}`, declinedProducts);
  const variationsTable = table("Products With Variations", `${withVariations} of ${snap.products.length} SKUs, ${totalVariations} variations tracked in total`,
    [{ label: "Product", align: "left" }, { label: "Retailer", align: "left" }, { label: "Variations", align: "left" }, { label: "Count", align: "right" }],
    variationProducts.map((p: any) => ({ cells: [
      cell(p.name, { onClick: () => goToProduct(p.id) }),
      cell(p.retailerName),
      cell(p.variations.join(", ")),
      cell(String(p.variations.length), { align: "right", strong: true }),
    ] })));
  /* Excludes "url failed" SKUs from every per-check drill -- their score
     is 0 and every check fails because no data was ever scraped, not
     because the content is genuinely incomplete (see isUrlFailed,
     mockData.ts, and the matching contentIssues/contentCoverage
     exclusion). They get their own urlFailedTable below instead. */
  const isUrlFailed = (p: any) => String(p.stockStatusRaw || "").toLowerCase().includes("url failed");
  const issueTable = (checkId: string, label: string) => {
    const failing = snap.products.filter((p: any) => !isUrlFailed(p) && (p.contentChecks ?? []).includes(checkId));
    return table(label, `${failing.length} of ${snap.products.length} SKUs currently fail this check`,
      [{ label: "Product", align: "left" }, { label: "Retailer", align: "left" }, { label: "Content Score", align: "right" }],
      failing.map((p: any) => ({ cells: [
        cell(p.name, { onClick: () => goToProduct(p.id) }),
        cell(p.retailerName),
        cell(p.contentScore + "%", { align: "right", color: p.contentScore < 80 ? "var(--status-negative-fg)" : "inherit" }),
      ] })));
  };
  const urlFailedProducts = snap.products.filter((p: any) => isUrlFailed(p));
  const urlFailedTable = table("Crawl / URL Failed", `${urlFailedProducts.length} of ${snap.products.length} SKUs -- the crawl never reached the listing, so no content or score exists for them`,
    [{ label: "Product", align: "left" }, { label: "Retailer", align: "left" }],
    urlFailedProducts.map((p: any) => ({ cells: [
      cell(p.name === "Untitled listing" ? p.id : p.name, { onClick: () => goToProduct(p.id) }),
      cell(p.retailerName),
    ] })));
  const trend = lineChart({ id: "ctrend", title: "Content Completeness Trend", subtitle: "Weighted completeness across tracked pages",
    labels: snap.labels, lo: 40, hi: 100, ticks: [40, 55, 70, 85, 100], fmt: (v) => Math.round(v) + "%", hideLegend: true,
    series: [{ name: "Content completeness", values: snap.contentTrend.values }], previous: snap.contentTrend.previous, target: 95 }, hover, onEnter);
  const dist = barChart({ id: "cdist", title: "Completeness Distribution", subtitle: "SKUs by content completeness band",
    labels: snap.contentDistribution.map((b: any) => b.bucket), valueName: "SKUs", values: snap.contentDistribution.map((b: any) => b.count),
    lo: 0, hi: Math.max(4, Math.max(...snap.contentDistribution.map((b: any) => b.count)) + 1), ticks: [0, 2, 4, 6, 8], fmt: (v) => String(Math.round(v)) }, hover, onEnter);
  const maxIssue = Math.max(1, ...snap.contentIssues.map((i: any) => i.count));
  const exportTrend = () => {
    downloadCsv("shelfline-content-completeness-trend.csv", seriesToCsv(snap.labels, [{ name: "Content Completeness %", values: snap.contentTrend.values }]));
    toast("Exported Content Completeness Trend.");
  };
  const exportDist = () => {
    downloadCsv("shelfline-completeness-distribution.csv", seriesToCsv(snap.contentDistribution.map((b: any) => b.bucket), [{ name: "SKUs", values: snap.contentDistribution.map((b: any) => b.count) }], undefined, "Band"));
    toast("Exported Completeness Distribution.");
  };

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,200px),1fr))", gap: "var(--app-gap)" }}>
        <div
          onClick={() => document.getElementById("products-with-issues")?.scrollIntoView({ behavior: "smooth", block: "start" })}
          style={{ cursor: "pointer" }}
          title="Click to view product-wise issues"
        >
          <KpiCard k={kpiCard(content, spark)} />
        </div>
        <Card padding="18px 20px" interactive onClick={() => setDrill(improvedTable)}>
          <div className="sl-muted" style={{ fontSize: 12.5, display: "flex", alignItems: "center", gap: 5 }}>Score Improved<InfoTip text={`Real per-SKU Content Score movement, first vs. last real weekly checkpoint (${periodRange}) -- not a fabricated delta.`} /></div>
          <div style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 32, lineHeight: 1, marginTop: 8, color: "var(--status-positive-fg)" }}>{improved}</div>
          <div className="sl-faint" style={{ fontSize: 11.5, marginTop: 8 }}>SKUs, real {periodRange} · click to view</div>
        </Card>
        <Card padding="18px 20px" interactive onClick={() => setDrill(declinedTable)}>
          <div className="sl-muted" style={{ fontSize: 12.5, display: "flex", alignItems: "center", gap: 5 }}>Score Declined<InfoTip text={`Real per-SKU Content Score movement, first vs. last real weekly checkpoint (${periodRange}) -- not a fabricated delta.`} /></div>
          <div style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 32, lineHeight: 1, marginTop: 8, color: "var(--status-negative-fg)" }}>{declined}</div>
          <div className="sl-faint" style={{ fontSize: 11.5, marginTop: 8 }}>SKUs, real {periodRange} · click to view</div>
        </Card>
        <KpiCard k={kpiCard(issues, spark)} />
        <Card padding="18px 20px" interactive onClick={() => setDrill(variationsTable)}>
          <div className="sl-muted" style={{ fontSize: 12.5, display: "flex", alignItems: "center", gap: 5 }}>Products With Variations<InfoTip text="Real count of SKUs with 2 or more variant options (size/color/style) from the crawl's 22 Variant label/value pairs -- a single entry is usually a crawl artifact, not a genuine variant set. Most SKUs have none." /></div>
          <div style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 32, lineHeight: 1, marginTop: 8 }}>{withVariations}<span style={{ fontSize: 16, fontWeight: 500 }}> / {snap.products.length}</span></div>
          <div className="sl-faint" style={{ fontSize: 11.5, marginTop: 8 }}>Real pack-size/color/style listings, {totalVariations} tracked in total</div>
        </Card>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,430px),1fr))", gap: "var(--app-gap)" }}>
        <ChartCard c={trend} onLeave={onLeave} onExportCsv={exportTrend} />
        <ChartCard c={dist} onLeave={onLeave} onExportCsv={exportDist} />
      </div>
      <Card padding="20px 22px" id="products-with-issues">
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>Products With Issues<InfoTip text="Real per-check failure counts from the same 9-check rubric behind Content Score -- each SKU's contentChecks array lists exactly which checks it currently fails. SKUs whose crawl URL failed are excluded (see the separate callout below) since they have no data to fail a check with." /></h3>
        <div className="sl-muted" style={{ fontSize: 12.5, marginTop: 2, marginBottom: 16 }}>Real per-check failure counts across {snap.products.length} tracked SKUs · click a check to see its SKUs</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {snap.contentIssues.map((i: any) => (
            <div key={i.id} onClick={() => setDrill(issueTable(i.id, i.label))} style={{ cursor: "pointer" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12.5, marginBottom: 5 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  {i.label}
                  {CONTENT_ISSUE_IMPACT[i.id] && <span onClick={(e) => e.stopPropagation()}><InfoTip text={CONTENT_ISSUE_IMPACT[i.id]} /></span>}
                </span>
                <span style={{ fontWeight: 600 }}>{i.count}</span>
              </div>
              <div className="sl-progress-track" style={{ height: 6 }}>
                <span className="sl-progress-fill" style={{ width: (i.count / maxIssue) * 100 + "%" }}></span>
              </div>
            </div>
          ))}
        </div>
        {urlFailedProducts.length > 0 && (
          <div
            onClick={() => setDrill(urlFailedTable)}
            style={{ cursor: "pointer", marginTop: 18, paddingTop: 14, borderTop: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}
          >
            <div className="sl-muted" style={{ fontSize: 12.5, display: "flex", alignItems: "center", gap: 5 }}>
              {urlFailedProducts.length} SKU{urlFailedProducts.length === 1 ? "" : "s"} failed to crawl (no data scraped) -- excluded from the checks above
              <InfoTip text="These listings' crawl URL failed outright -- no content, price, or stock was ever scraped for them, so their content score is 0 and every check technically 'fails', but that's a data gap, not a content quality problem. They're kept out of every check bucket above so a crawl failure doesn't get counted as an incomplete title, missing bullets, etc." />
            </div>
            <span className="sl-faint" style={{ fontSize: 11.5, flex: "none" }}>Click to view →</span>
          </div>
        )}
      </Card>

      {drill && <DrilldownModal t={drill} onClose={() => setDrill(null)} />}
    </>
  );
}
