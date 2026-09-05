import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PageShell } from "../components/layout/PageShell";
import { KpiCard } from "../components/ui/KpiCard";
import { ChartCard } from "../components/charts/ChartCard";
import { DataTable } from "../components/table/DataTable";
import { Card } from "../components/ui/Card";
import { InfoTip } from "../components/ui/InfoTip";
import { Badge, stockTone, opportunityTone } from "../components/ui/Badge";
import { useFilters } from "../context/FiltersContext";
import { useUi } from "../context/UiContext";
import { useChartHover } from "../hooks/useChartHover";
import { lineChart, barChart, spark } from "../lib/charts";
import { kpiCard, cell, table, deltaColor, delta, seriesToCsv, rowsToCsv, downloadCsv } from "../lib/format";
import { fetchProduct } from "../data/mockData";

// No user-facing period control exists any more (see FiltersContext) --
// pinned to "4w", the one window backed by real crawl data.
const period = "4w";

export default function ProductDetail() {
  const { id = "" } = useParams();
  const { retailer, dateRange } = useFilters();
  const { toast } = useUi();
  const navigate = useNavigate();
  const { hover, onEnter, onLeave } = useChartHover();

  const [detail, setDetail] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  // Tries the local downloaded photo first, then the real crawled front-
  // image URL, then the initials monogram -- same fallback order as
  // ProductCell (see that component's own comment for why).
  const [photoStage, setPhotoStage] = useState<"local" | "remote" | "initials">("local");
  const reqKey = useRef("");

  useEffect(() => { setPhotoStage("local"); }, [id]);

  useEffect(() => {
    const rangeKey = dateRange ? dateRange.start + ".." + dateRange.end : "";
    const key = id + "|" + retailer + "|" + period + "|" + rangeKey;
    reqKey.current = key;
    setLoading(true);
    fetchProduct(id, { retailer, period, dateRange })
      .then((d) => { if (reqKey.current === key) { setDetail(d); setLoading(false); } })
      .catch(() => {
        if (reqKey.current !== key) return;
        setLoading(false);
        toast("That SKU is not tracked at this retailer.");
        navigate(-1);
      });
  }, [id, retailer, period, dateRange]);

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
    { id: "instock", label: "Stock Availability 1P + 3P", unit: "%", value: p.inStockRate, target: 98, delta: Number((p.inStockRate - t.stock[0]).toFixed(1)), spark: t.stock, labels },
    { id: "rating", label: "Average Rating", unit: "", value: p.rating, target: 4.5, delta: Number((p.rating - t.rating[0]).toFixed(2)), spark: t.rating, labels },
    { id: "content", label: "Content Completeness", unit: "%", value: p.contentScore, target: 95, delta: 0, spark: t.stock.map((_v: number, i: number) => Math.round(p.contentScore - 4 + (i / labels.length) * 4)), labels },
  ];

  const maxStars = Math.max(...detail.reviewMix.map((m: any) => m.count));
  const lo = Math.min(...t.price), hi = Math.max(...t.price);
  const reviewsLo = Math.min(...t.reviews), reviewsHi = Math.max(...t.reviews);

  const isReal = detail.dataSource === "real";
  const realWindow = labels.length ? `${labels[0]}–${labels[labels.length - 1]}` : "Sep 8–29";
  const realNote = isReal ? ` · Real crawl data (${realWindow})` : " · Illustrative — crawl covers one month only";

  /* Real MAP (Minimum Advertised Price), from the separate reference
     workbook the user supplies -- has no weekly series of its own (a
     static brand policy value, not something the crawl observes day to
     day), so it's drawn as a flat reference line, widening the chart's own
     range so the line never renders clipped when MAP sits above/below
     every observed price point. */
  const priceLo = Math.min(lo, p.mapPrice ?? lo), priceHi = Math.max(hi, p.mapPrice ?? hi);
  const priceChart = lineChart({ id: "d-price", title: "Price Trend", subtitle: "Shelf price over the period" + realNote,
    labels, lo: priceLo * 0.94, hi: priceHi * 1.06, ticks: [priceLo * 0.96, (priceLo + priceHi) / 2, priceHi * 1.04], fmt: (v) => "$" + v.toFixed(2), hideLegend: true,
    series: [{ name: "Price", values: t.price }],
    target: p.mapPrice ?? undefined, targetLabel: "MAP Price",
    badge: p.mapPrice != null ? "MAP $" + p.mapPrice.toFixed(2) : undefined }, hover, onEnter);
  const stockChart = barChart({ id: "d-stock", title: "Stock Availability 1P + 3P Trend", subtitle: "In-stock rate at this retailer" + realNote, badge: "Target 98%",
    labels, values: t.stock, valueName: "In stock", lo: 60, hi: 100, ticks: [60, 70, 80, 90, 100], fmt: (v) => v.toFixed(1) + "%", target: 98,
    fill: (v) => (v >= 98 ? "var(--status-positive-fg)" : "var(--color-accent-300)") }, hover, onEnter);
  const ratingChart = lineChart({ id: "d-rating", title: "Rating Trend", subtitle: "Average rating" + realNote + " · Star breakdown illustrative — no per-star rating data in the raw crawl",
    labels, lo: 3.4, hi: 5, ticks: [3.4, 4, 4.5, 5], fmt: (v) => v.toFixed(2), hideLegend: true, series: [{ name: "Rating", values: t.rating }],
    footer: detail.reviewMix.map((m: any) => ({ label: m.stars + " star", value: m.count.toLocaleString(), color: m.count === maxStars ? "var(--status-positive-fg)" : "var(--status-neutral-fg)" })) }, hover, onEnter);
  const reviewsChart = lineChart({ id: "d-reviews", title: "Review Count Trend", subtitle: "Total tracked reviews over the period" + realNote,
    labels, lo: reviewsLo * 0.97, hi: reviewsHi * 1.04, ticks: [reviewsLo, (reviewsLo + reviewsHi) / 2, reviewsHi], fmt: (v) => Math.round(v).toLocaleString(), hideLegend: true,
    series: [{ name: "Review count", values: t.reviews }] }, hover, onEnter);

  /* One export per chart -- same labels/series the chart itself draws, plus
     MAP as an extra flat column on the price chart when tracked. */
  const exportChart = (filename: string, label: string, series: Array<{ name: string; values: number[] }>, extra?: { name: string; value: number }) => {
    downloadCsv(filename, seriesToCsv(labels, series, extra));
    toast("Exported " + label + ".");
  };

  const facts = [
    { label: "Stock Availability 1P + 3P", value: p.inStockRate.toFixed(1) + "%", sub: p.stockStatus },
    { label: "Average price", value: "$" + p.avgSellingPrice.toFixed(2), sub: "$" + p.price.toFixed(2) + " current price" },
    { label: "Content completeness", value: p.contentScore + "%", sub: "of content checks passed" },
    { label: "Rating", value: p.rating.toFixed(2), sub: "average rating" },
    { label: "Review count", value: p.reviews.toLocaleString(), sub: "tracked reviews" },
    { label: "Buy Box Ownership 1P", value: p.buyBoxRate + "%", sub: detail.note },
  ];
  const exportFacts = () => {
    downloadCsv("shelfline-" + p.id + "-key-facts.csv", rowsToCsv(["Metric", "Value", "Detail"], facts.map((f) => [f.label, f.value, f.sub])));
    toast("Exported key facts.");
  };

  const eff = p.currentPrice ?? p.price;
  const underMap = p.mapPrice != null && eff < p.mapPrice;
  const onPromotion = (p.listPrice != null && eff < p.listPrice) || p.couponValue != null;
  const priceFields = [
    { label: "List Price", value: p.listPrice != null ? "$" + p.listPrice.toFixed(2) : "—" },
    { label: "Current Price", value: "$" + eff.toFixed(2) },
    { label: "Average Selling Price", value: "$" + p.avgSellingPrice.toFixed(2) },
    { label: "Subscription Price", value: p.subscriptionPrice != null ? "$" + p.subscriptionPrice.toFixed(2) : "—" },
    { label: "MAP Price", value: p.mapPrice != null ? "$" + p.mapPrice.toFixed(2) : "Not tracked" },
    { label: "Coupon", value: p.couponValue ?? "—" },
  ];

  const contentChecklistTable = table("Content checklist", "Requirement-level detail behind the content score",
    [{ label: "Requirement", align: "left" }, { label: "Status", align: "left" }],
    detail.contentBreakdown.map((c: any) => ({ cells: [
      cell(c.name),
      cell(c.pass ? "Pass" : "Fix needed", { tone: c.pass ? "positive" : "warning" }),
    ] })),
    "9 equally-weighted binary checks (~11.1% each) -- Content Score is simply (checks passing ÷ 9) × 100.");

  /* Real cross-retailer comparison -- "listed: true" only when a genuine
     match exists in our own sample (same brand, >=45% name overlap, see
     CROSS_RETAILER_MATCH); every other retailer honestly reads "Not
     tracked" instead of fabricating a listing we have no evidence of. */
  const retailerTable = table("Where else this SKU is tracked", "Real cross-retailer match when one genuinely exists -- honest \"Not tracked\" otherwise, never a fabricated listing",
    [{ label: "Retailer", align: "left" }, { label: "Price", align: "right" }, { label: "In Stock", align: "right" }, { label: "Rating", align: "right" }, { label: "Content", align: "right" }],
    detail.retailerPerformance.map((r: any) => ({ cells: [
      cell(r.retailer, { strong: r.isSelf, sub: r.isSelf ? "This listing" : (r.listed ? undefined : "Not tracked") }),
      cell(r.listed ? "$" + r.price.toFixed(2) : "—", { align: "right" }),
      cell(r.listed ? r.inStock.toFixed(1) + "%" : "—", { align: "right" }),
      cell(r.listed ? r.rating.toFixed(2) : "—", { align: "right" }),
      cell(r.listed ? r.content + "%" : "—", { align: "right" }),
    ] })),
    "Matches are found by same brand + ≥45% product-name overlap within our own tracked sample -- not every retailer's full catalog, so \"Not tracked\" can mean genuinely absent or simply outside this sample.");

  return (
    <PageShell title={p.name} subtitle={`${p.brand} · ${p.category} · ${p.retailerName}`}
      backTo={{ label: "Back", onClick: () => navigate(-1) }}
    >
      <Card padding="20px 22px">
        <div style={{ display: "flex", alignItems: "flex-start", gap: 18, flexWrap: "wrap" }}>
          {photoStage === "initials" ? (
            <span className="sl-avatar" style={{ width: 56, height: 56, fontSize: 17, borderRadius: "var(--radius-md)" }}>{initials}</span>
          ) : (
            <img
              src={photoStage === "local" ? `${import.meta.env.BASE_URL}product-images/${p.id}.jpg` : p.imageUrl}
              alt="" width={56} height={56}
              style={{ borderRadius: "var(--radius-md)", objectFit: "cover", flex: "none", background: "var(--surface-secondary)" }}
              onError={() => setPhotoStage((s) => (s === "local" && p.imageUrl ? "remote" : "initials"))}
            />
          )}
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
            <div className="sl-eyebrow" style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "flex-end" }}>Shelf score<InfoTip text="Composite of this SKU's real keyword coverage (25%), in-stock rate (30%), content score (25%) and rating (20%), minus a penalty when priced over 5% above its own average selling price." /></div>
            <div style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 30, lineHeight: 1.1 }}>{p.shelfScore}</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 20, paddingTop: 18, borderTop: "1px solid var(--border-subtle)" }}>
          <div className="sl-eyebrow" style={{ display: "flex", alignItems: "center", gap: 6 }}>Key facts<InfoTip text="Each figure is the same real value shown elsewhere on this page -- collected here as a quick-reference summary." /></div>
          <button type="button" className="btn btn-ghost" onClick={exportFacts} style={{ fontSize: 12, padding: "5px 10px", minHeight: "auto" }}>⬇ Export</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 18, marginTop: 12 }}>
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
        <ChartCard c={priceChart} onLeave={onLeave} onExportCsv={() => exportChart("shelfline-" + p.id + "-price-trend.csv", "Price Trend", [{ name: "Price", values: t.price }], p.mapPrice != null ? { name: "MAP Price", value: p.mapPrice } : undefined)} />
        <ChartCard c={stockChart} onLeave={onLeave} onExportCsv={() => exportChart("shelfline-" + p.id + "-stock-availability-trend.csv", "Stock Availability Trend", [{ name: "In Stock %", values: t.stock }])} />
      </div>

      <Card padding="20px 22px">
        <div className="sl-eyebrow" style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
          Pricing details
          <InfoTip text="Every field below is the real Price-tab value for this SKU, exactly as posted -- List/Current/Subscription/MAP prices and coupon come straight from the crawl; MAP is a separate brand-policy reference file." />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 18, marginBottom: 18 }}>
          {priceFields.map((f) => (
            <div key={f.label} style={{ minWidth: 0 }}>
              <div className="sl-muted" style={{ fontSize: 12.5 }}>{f.label}</div>
              <div style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 17, lineHeight: 1.3, marginTop: 3 }}>{f.value}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", paddingTop: 14, borderTop: "1px solid var(--border-subtle)" }}>
          <Badge tone={p.mapPrice == null ? "neutral" : underMap ? "critical" : "positive"}>
            {p.mapPrice == null ? "MAP Not Tracked" : underMap ? "Under MAP" : "MAP Compliant"}
          </Badge>
          <Badge tone={onPromotion ? "positive" : "neutral"}>{onPromotion ? "On Promotion" : "Not on Promotion"}</Badge>
        </div>
        <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--border-subtle)" }}>
          <div className="sl-muted" style={{ fontSize: 12.5, display: "flex", alignItems: "center", gap: 5, marginBottom: 8 }}>
            Other sellers<InfoTip text="Real competing offers on this listing beyond whoever holds the buy box, up to 10 -- from the Price tab's Other Seller columns." />
          </div>
          {p.otherSellers.length === 0 ? (
            <div className="sl-faint" style={{ fontSize: 12.5 }}>None observed on the latest crawl.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {p.otherSellers.map((s: { name: string; price: number | null }, i: number) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span>{s.name}</span>
                  <span style={{ fontWeight: 600 }}>{s.price != null ? "$" + s.price.toFixed(2) : "—"}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,220px),1fr))", gap: "var(--app-gap)" }}>
        <Card padding="18px 20px">
          <div className="sl-muted" style={{ fontSize: 12.5, display: "flex", alignItems: "center", gap: 5 }}>
            Price Change<InfoTip text="Real whole-month change: first vs. last real observed price this September -- not a single-day comparison." />
          </div>
          <div style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 28, lineHeight: 1, marginTop: 8, color: deltaColor(p.priceChangePct) }}>{delta(p.priceChangePct, "%")}</div>
        </Card>
        <Card padding="18px 20px">
          <div className="sl-muted" style={{ fontSize: 12.5, display: "flex", alignItems: "center", gap: 5 }}>
            Price Index<InfoTip text="Current price ÷ this SKU's own average selling price this period, ×100. Above 100 = priced above its own norm right now; below 100 = a markdown." />
          </div>
          <div style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 28, lineHeight: 1, marginTop: 8 }}>{(p.priceIndex * 100).toFixed(0)}</div>
        </Card>
        <Card padding="18px 20px">
          <div className="sl-muted" style={{ fontSize: 12.5, display: "flex", alignItems: "center", gap: 5 }}>
            Buy Box Ownership 1P<InfoTip text="Real % of tracked days this SKU's own listing (not a 3rd-party seller) held the buy box." />
          </div>
          <div style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 28, lineHeight: 1, marginTop: 8 }}>{p.buyBoxRate}%</div>
          <div className="sl-faint" style={{ fontSize: 11.5, marginTop: 6 }}>{detail.note}</div>
        </Card>
      </div>

      <Card padding="20px 22px">
        <div className="sl-eyebrow" style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
          Current listing content
          <InfoTip text="The real crawled title, description and bullets exactly as they exist on the live retailer listing -- what the Content checklist below is scored against." />
        </div>
        <div style={{ marginBottom: 16 }}>
          <div className="sl-muted" style={{ fontSize: 12.5 }}>Title ({p.titleLength} chars)</div>
          <div style={{ fontSize: 14, fontWeight: 500, marginTop: 4, lineHeight: 1.4 }}>{p.name}</div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <div className="sl-muted" style={{ fontSize: 12.5 }}>Description ({p.descriptionLength} chars)</div>
          <div style={{ fontSize: 13.5, marginTop: 4, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{p.descriptionText || <span className="sl-faint">— none crawled</span>}</div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <div className="sl-muted" style={{ fontSize: 12.5 }}>Bullet points ({p.bulletCount})</div>
          {p.bulletsText && p.bulletsText.length > 0 ? (
            <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
              {p.bulletsText.map((b: string, i: number) => <li key={i} style={{ fontSize: 13.5, marginBottom: 4, lineHeight: 1.4 }}>{b}</li>)}
            </ul>
          ) : <div className="sl-faint" style={{ fontSize: 13, marginTop: 4 }}>— none crawled</div>}
        </div>
        {p.variations && p.variations.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div className="sl-muted" style={{ fontSize: 12.5 }}>Variations ({p.variations.length})</div>
            <div style={{ fontSize: 13, marginTop: 4, lineHeight: 1.5 }}>{p.variations.join(", ")}</div>
          </div>
        )}
        <div style={{ display: "flex", gap: 28, flexWrap: "wrap", paddingTop: 4 }}>
          <div><div className="sl-muted" style={{ fontSize: 12.5 }}>Images</div><div style={{ fontWeight: 600, fontSize: 15, marginTop: 2 }}>{p.imageCount}</div></div>
          <div><div className="sl-muted" style={{ fontSize: 12.5 }}>Videos</div><div style={{ fontWeight: 600, fontSize: 15, marginTop: 2 }}>{p.videoCount}</div></div>
          <div><div className="sl-muted" style={{ fontSize: 12.5 }}>Enhanced content</div><div style={{ fontWeight: 600, fontSize: 15, marginTop: 2 }}>{p.enhancedContent ? "Yes" : "No"}</div></div>
        </div>
      </Card>

      <DataTable t={contentChecklistTable} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,430px),1fr))", gap: "var(--app-gap)" }}>
        <ChartCard c={ratingChart} onLeave={onLeave} onExportCsv={() => exportChart("shelfline-" + p.id + "-rating-trend.csv", "Rating Trend", [{ name: "Rating", values: t.rating }])} />
        <ChartCard c={reviewsChart} onLeave={onLeave} onExportCsv={() => exportChart("shelfline-" + p.id + "-review-count-trend.csv", "Review Count Trend", [{ name: "Review Count", values: t.reviews }])} />
      </div>

      <DataTable t={retailerTable} />
    </PageShell>
  );
}
