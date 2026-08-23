import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PageShell } from "../components/layout/PageShell";
import { KpiCard } from "../components/ui/KpiCard";
import { ChartCard } from "../components/charts/ChartCard";
import { DataTable } from "../components/table/DataTable";
import { Card } from "../components/ui/Card";
import { Badge, stockTone, opportunityTone } from "../components/ui/Badge";
import { useFilters } from "../context/FiltersContext";
import { useUi } from "../context/UiContext";
import { useChartHover } from "../hooks/useChartHover";
import { lineChart, barChart, spark } from "../lib/charts";
import { kpiCard, cell, table, pct } from "../lib/format";
import { fetchProduct } from "../data/mockData";

export default function ProductDetail() {
  const { id = "" } = useParams();
  const { retailer, period } = useFilters();
  const { toast } = useUi();
  const navigate = useNavigate();
  const { hover, onEnter, onLeave } = useChartHover();

  const [detail, setDetail] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const reqKey = useRef("");

  useEffect(() => {
    const key = id + "|" + retailer + "|" + period;
    reqKey.current = key;
    setLoading(true);
    fetchProduct(id, { retailer, period })
      .then((d) => { if (reqKey.current === key) { setDetail(d); setLoading(false); } })
      .catch(() => {
        if (reqKey.current !== key) return;
        setLoading(false);
        toast("That SKU is not tracked at this retailer.");
        navigate(-1);
      });
  }, [id, retailer, period]);

  if (loading || !detail) {
    return (
      <main style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "28px 28px 48px" }}>
        <div className="sl-muted" style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 12.5 }}>
          <span className="sl-skel" style={{ width: 11, height: 11, borderRadius: "50%", display: "block" }}></span>
          Loading product…
        </div>
      </main>
    );
  }

  const p = detail.product;
  const t = detail.trends;
  const labels = detail.labels;
  const initials = p.name.split(" ").filter(Boolean).slice(0, 2).map((w: string) => w[0]).join("");

  const kpis = [
    { id: "rank", label: "Search Rank", unit: "", value: p.searchRank, target: 5, delta: t.rank[0] - p.searchRank, spark: t.rank },
    { id: "instock", label: "Availability", unit: "%", value: p.inStockRate, target: 98, delta: Number((p.inStockRate - t.stock[0]).toFixed(1)), spark: t.stock },
    { id: "rating", label: "Average Rating", unit: "", value: p.rating, target: 4.5, delta: Number((p.rating - t.rating[0]).toFixed(2)), spark: t.rating },
    { id: "content", label: "Content Completeness", unit: "/100", value: p.contentScore, target: 95, delta: 0, spark: t.stock.map((_v: number, i: number) => Math.round(p.contentScore - 4 + (i / labels.length) * 4)) },
  ];

  const maxStars = Math.max(...detail.reviewMix.map((m: any) => m.count));
  const lo = Math.min(...t.price), hi = Math.max(...t.price);
  const reviewsLo = Math.min(...t.reviews), reviewsHi = Math.max(...t.reviews);

  const rankChart = lineChart({ id: "d-rank", title: "Search Rank Trend", subtitle: "Position on the primary category term (lower is better)",
    labels, lo: 1, hi: 30, ticks: [1, 10, 20, 30], fmt: (v) => "#" + Math.round(v), invert: true, hideLegend: true, series: [{ name: "Rank", values: t.rank }] }, hover, onEnter);
  const priceChart = lineChart({ id: "d-price", title: "Price Trend", subtitle: "Shelf price over the period",
    labels, lo: lo * 0.94, hi: hi * 1.06, ticks: [lo * 0.96, (lo + hi) / 2, hi * 1.04], fmt: (v) => "$" + v.toFixed(2), hideLegend: true,
    series: [{ name: "Price", values: t.price }],
    footer: detail.priceComparison.map((c: any) => ({ label: c.name, value: "$" + c.price.toFixed(2), color: c.price < p.price ? "var(--status-neutral-fg)" : "var(--status-positive-fg)" })) }, hover, onEnter);
  const stockChart = barChart({ id: "d-stock", title: "Availability Trend", subtitle: "In-stock rate at this retailer", badge: "Target 98%",
    labels, values: t.stock, valueName: "In stock", lo: 60, hi: 100, ticks: [60, 70, 80, 90, 100], fmt: (v) => v.toFixed(1) + "%", target: 98,
    fill: (v) => (v >= 98 ? "var(--status-positive-fg)" : "var(--color-accent-300)") }, hover, onEnter);
  const ratingChart = lineChart({ id: "d-rating", title: "Rating Trend", subtitle: "Average rating and review distribution",
    labels, lo: 3.4, hi: 5, ticks: [3.4, 4, 4.5, 5], fmt: (v) => v.toFixed(2), hideLegend: true, series: [{ name: "Rating", values: t.rating }],
    footer: detail.reviewMix.map((m: any) => ({ label: m.stars + " star", value: m.count.toLocaleString(), color: m.count === maxStars ? "var(--status-positive-fg)" : "var(--status-neutral-fg)" })) }, hover, onEnter);
  const reviewsChart = lineChart({ id: "d-reviews", title: "Review Count Trend", subtitle: "Total tracked reviews over the period",
    labels, lo: reviewsLo * 0.97, hi: reviewsHi * 1.04, ticks: [reviewsLo, (reviewsLo + reviewsHi) / 2, reviewsHi], fmt: (v) => Math.round(v).toLocaleString(), hideLegend: true,
    series: [{ name: "Review count", values: t.reviews }] }, hover, onEnter);

  const facts = [
    { label: "Search visibility", value: p.searchVisibility + "%", sub: "Rank #" + p.searchRank + " on the primary term" },
    { label: "Availability", value: p.inStockRate.toFixed(1) + "%", sub: p.stockStatus },
    { label: "Price index", value: (p.priceIndex * 100).toFixed(0), sub: "$" + p.price.toFixed(2) + " current price" },
    { label: "Content completeness", value: String(p.contentScore), sub: "out of 100" },
    { label: "Rating", value: p.rating.toFixed(2), sub: "average rating" },
    { label: "Review count", value: p.reviews.toLocaleString(), sub: "tracked reviews" },
    { label: "Buy box presence", value: p.buyBox ? "Held" : "Lost", sub: detail.note },
  ];

  const retailerPerfTable = table("Retailer performance", "The same SKU measured at every monitored retailer",
    [{ label: "Retailer", align: "left" }, { label: "Rank", align: "right" }, { label: "Price", align: "right" },
     { label: "In Stock", align: "right" }, { label: "Rating", align: "right" }, { label: "Content completeness", align: "right" }, { label: "Listing", align: "left" }],
    detail.retailerPerformance.map((r: any) => ({ cells: [
      cell(r.retailer), cell("#" + r.rank, { align: "right", strong: true }),
      cell("$" + r.price.toFixed(2), { align: "right" }),
      cell(pct(r.inStock), { align: "right", color: r.inStock >= 98 ? "var(--status-positive-fg)" : "inherit" }),
      cell(r.rating.toFixed(2), { align: "right" }), cell(String(r.content), { align: "right" }),
      cell(r.listed ? "Live" : "Not listed", { tone: r.listed ? "positive" : "neutral" }),
    ] })));

  const contentChecklistTable = table("Content checklist", "Requirement-level detail behind the content score",
    [{ label: "Requirement", align: "left" }, { label: "Weight", align: "left" }, { label: "Status", align: "left" }],
    detail.contentBreakdown.map((c: any) => ({ cells: [
      cell(c.name), cell(c.weight, { tone: c.weight === "High" ? "positive" : "neutral" }),
      cell(c.pass ? "Pass" : "Fix needed", { tone: c.pass ? "positive" : "warning" }),
    ] })));

  return (
    <PageShell title={p.name} subtitle={`${p.brand} · ${p.category} · ${p.retailerName}`}
      backTo={{ label: "Back", onClick: () => navigate(-1) }}
    >
      <Card padding="20px 22px">
        <div style={{ display: "flex", alignItems: "flex-start", gap: 18, flexWrap: "wrap" }}>
          <span className="sl-avatar" style={{ width: 56, height: 56, fontSize: 17, borderRadius: "var(--radius-md)" }}>{initials}</span>
          <div style={{ flex: "1 1 240px", minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <h2 style={{ margin: 0, fontSize: 19, fontWeight: 600 }}>{p.name}</h2>
              <Badge tone={stockTone(p.stockStatus)}>{p.stockStatus}</Badge>
              <Badge tone={opportunityTone(p.opportunity)}>{p.opportunity} opportunity</Badge>
            </div>
            <div className="sl-muted" style={{ fontSize: 13, marginTop: 4 }}>{p.id.toUpperCase()} · {p.brand} · {p.category} · {p.retailerName}</div>
            <div className="sl-faint" style={{ fontSize: 12, marginTop: 6 }}>Crawled {detail.lastCrawl} · {detail.note}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div className="sl-eyebrow">Shelf score</div>
            <div style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 30, lineHeight: 1.1 }}>{p.shelfScore}</div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 18, marginTop: 20, paddingTop: 18, borderTop: "1px solid var(--border-subtle)" }}>
          {facts.map((f) => (
            <div key={f.label} style={{ minWidth: 0 }}>
              <div className="sl-eyebrow">{f.label}</div>
              <div style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 17, lineHeight: 1.3, marginTop: 3 }}>{f.value}</div>
              <div className="sl-muted" style={{ fontSize: 11.5 }}>{f.sub}</div>
            </div>
          ))}
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,238px),1fr))", gap: "var(--app-gap)" }}>
        {kpis.map((k) => <KpiCard key={k.id} k={kpiCard(k, spark)} />)}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,430px),1fr))", gap: "var(--app-gap)" }}>
        <ChartCard c={rankChart} onLeave={onLeave} />
        <ChartCard c={priceChart} onLeave={onLeave} />
        <ChartCard c={stockChart} onLeave={onLeave} />
        <ChartCard c={ratingChart} onLeave={onLeave} />
        <ChartCard c={reviewsChart} onLeave={onLeave} />
      </div>

      <DataTable t={retailerPerfTable} />
      <DataTable t={contentChecklistTable} />
    </PageShell>
  );
}
