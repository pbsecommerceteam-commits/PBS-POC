import { useOutletContext } from "react-router-dom";
import { ChartCard } from "../../components/charts/ChartCard";
import { Card } from "../../components/ui/Card";
import { InfoTip } from "../../components/ui/InfoTip";
import { Badge } from "../../components/ui/Badge";
import { useUi } from "../../context/UiContext";
import { useChartHover } from "../../hooks/useChartHover";
import { lineChart } from "../../lib/charts";
import { deltaColor, delta, seriesToCsv, downloadCsv } from "../../lib/format";
import type { ProductDetailContext } from "./Layout";

export default function ProductPricing() {
  const { p, t, labels, detail } = useOutletContext<ProductDetailContext>();
  const { toast } = useUi();
  const { hover, onEnter, onLeave } = useChartHover();

  const isReal = detail.dataSource === "real";
  const realWindow = labels.length ? `${labels[0]}–${labels[labels.length - 1]}` : "Sep 8–29";
  const realNote = isReal ? ` · Real crawl data (${realWindow})` : " · Illustrative — crawl covers one month only";

  const lo = Math.min(...t.price), hi = Math.max(...t.price);
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
  const exportPriceChart = () => {
    downloadCsv("shelfline-" + p.id + "-price-trend.csv", seriesToCsv(labels, [{ name: "Price", values: t.price }], p.mapPrice != null ? { name: "MAP Price", value: p.mapPrice } : undefined));
    toast("Exported Price Trend.");
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

  return (
    <>
      <ChartCard c={priceChart} onLeave={onLeave} onExportCsv={exportPriceChart} />

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
    </>
  );
}
