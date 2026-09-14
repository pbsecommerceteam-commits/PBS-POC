import { useMemo, useState } from "react";
import { Card } from "../../components/ui/Card";
import { Badge, type BadgeTone } from "../../components/ui/Badge";
import { InfoTip } from "../../components/ui/InfoTip";
import { ChartCard } from "../../components/charts/ChartCard";
import { SortableTable, type Column } from "../../components/table/SortableTable";
import { Pagination } from "../../components/table/Pagination";
import { useFilters } from "../../context/FiltersContext";
import { useUi } from "../../context/UiContext";
import { useChartHover } from "../../hooks/useChartHover";
import { useSortedPage } from "../../hooks/useSortedPage";
import { barChart } from "../../lib/charts";
import { downloadCsv } from "../../lib/format";
import { PETWISE_NEW_ITEMS, PETWISE_NEW_ITEM_REVIEWS, type PetwiseNewItemReview } from "../../data/petwiseNewItemReviews";

const SENTIMENT_TONE: Record<string, BadgeTone> = { positive: "positive", neutral: "neutral", negative: "critical" };
const SENTIMENT_LABEL: Record<string, string> = { positive: "Positive", neutral: "Neutral", negative: "Negative" };
const SENTIMENT_COLOR: Record<string, string> = { positive: "var(--status-positive-fg)", neutral: "var(--status-neutral-fg)", negative: "var(--status-negative-fg)" };

const round1 = (v: number) => Math.round(v * 10) / 10;

const REVIEW_SORTERS: Record<string, (a: PetwiseNewItemReview, b: PetwiseNewItemReview) => number> = {
  date: (a, b) => a.date.localeCompare(b.date),
  itemName: (a, b) => a.itemName.localeCompare(b.itemName),
  customerName: (a, b) => a.customerName.localeCompare(b.customerName),
  rating: (a, b) => a.rating - b.rating,
  sentiment: (a, b) => a.sentiment.localeCompare(b.sentiment),
};

const fmtDate = (iso: string) => { const [, m, d] = iso.split("-").map(Number); return ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][m - 1] + " " + d; };

/** Ratings & Reviews > New Items -- real customer review data for 6 brand-
 *  new PetWise items (see data/petwiseNewItemReviews.ts for the full
 *  provenance note). These items were never crawled -- no price/content/
 *  stock data exists for them -- so this page deliberately reads its own
 *  isolated data file rather than `snap`/`catalog`, and nothing here feeds
 *  any other page, KPI, or company. The Layout only shows this tab at all
 *  when the selected company is PetWise; this page also guards itself in
 *  case someone lands here directly (e.g. a saved link) under a different
 *  company. */
export default function ReviewsNewItems() {
  const { company } = useFilters();
  const { toast } = useUi();
  const { hover, onEnter, onLeave } = useChartHover();
  const [itemFilter, setItemFilter] = useState("");
  const [sentimentFilter, setSentimentFilter] = useState("");

  const totalReviews = PETWISE_NEW_ITEM_REVIEWS.length;
  const overallAvgRating = round1(PETWISE_NEW_ITEM_REVIEWS.reduce((a, r) => a + r.rating, 0) / totalReviews);
  const sentimentCounts = useMemo(() => {
    const c = { positive: 0, neutral: 0, negative: 0 };
    PETWISE_NEW_ITEM_REVIEWS.forEach((r) => { c[r.sentiment]++; });
    return c;
  }, []);
  const positivePct = round1((sentimentCounts.positive / totalReviews) * 100);
  const negativePct = round1((sentimentCounts.negative / totalReviews) * 100);

  const ratingDist = [5, 4, 3, 2, 1].map((star) => ({ star, count: PETWISE_NEW_ITEM_REVIEWS.filter((r) => r.rating === star).length }));
  const ratingHi = Math.max(4, ...ratingDist.map((d) => d.count)) + 2;
  const ratingChart = barChart({
    id: "petwise-rating-dist", title: "Rating Distribution", subtitle: "All 168 real reviews across the 6 new items, by star rating",
    labels: ratingDist.map((d) => d.star + " star"), valueName: "Reviews", values: ratingDist.map((d) => d.count),
    lo: 0, hi: ratingHi, ticks: [0, Math.round(ratingHi / 2), ratingHi], fmt: (v) => String(Math.round(v)),
    fill: () => "var(--color-accent-700)",
  }, hover, onEnter);

  const sentimentChart = barChart({
    id: "petwise-sentiment-dist", title: "Sentiment Distribution", subtitle: "Genuine per-review sentiment, read from each review's own written text -- not inferred from the star rating alone",
    labels: ["Positive", "Neutral", "Negative"], valueName: "Reviews",
    values: [sentimentCounts.positive, sentimentCounts.neutral, sentimentCounts.negative],
    lo: 0, hi: Math.max(4, sentimentCounts.positive) + 5, ticks: [0, Math.round(sentimentCounts.positive / 2), sentimentCounts.positive],
    fmt: (v) => String(Math.round(v)),
    fill: (v) => (v === sentimentCounts.positive ? SENTIMENT_COLOR.positive : v === sentimentCounts.negative ? SENTIMENT_COLOR.negative : SENTIMENT_COLOR.neutral),
  }, hover, onEnter);

  const exportRatingDist = () => {
    downloadCsv("petwise-new-items-rating-distribution.csv", ["Stars,Reviews", ...ratingDist.map((d) => `${d.star},${d.count}`)].join("\n"));
    toast("Exported Rating Distribution.");
  };
  const exportSentimentDist = () => {
    downloadCsv("petwise-new-items-sentiment-distribution.csv", ["Sentiment,Reviews", `Positive,${sentimentCounts.positive}`, `Neutral,${sentimentCounts.neutral}`, `Negative,${sentimentCounts.negative}`].join("\n"));
    toast("Exported Sentiment Distribution.");
  };

  const filteredReviews = useMemo(() => PETWISE_NEW_ITEM_REVIEWS.filter((r) =>
    (!itemFilter || r.asin === itemFilter) && (!sentimentFilter || r.sentiment === sentimentFilter),
  ), [itemFilter, sentimentFilter]);

  const { slice, sortKey, sortDir, onSort, page, totalPages, setPage, total } = useSortedPage(
    filteredReviews, REVIEW_SORTERS, "date", 10, [itemFilter, sentimentFilter].join("|"),
  );

  const exportReviews = () => {
    const rows = filteredReviews.map((r) => [r.date, r.itemName, r.asin, r.customerName, r.rating, r.sentiment, r.title, r.text]);
    const csv = ["Date,Item,ASIN,Customer,Rating,Sentiment,Title,Review"]
      .concat(rows.map((r) => r.map((c) => '"' + String(c).replace(/"/g, '""') + '"').join(",")))
      .join("\n");
    downloadCsv("petwise-new-items-reviews.csv", csv);
    toast(`Exported ${filteredReviews.length} reviews.`);
  };

  const columns: Column<PetwiseNewItemReview>[] = [
    { key: "date", label: "Date", minWidth: 90, sortable: true, render: (r) => fmtDate(r.date) },
    { key: "itemName", label: "Item", minWidth: 170, sortable: true, render: (r) => r.itemName },
    { key: "customerName", label: "Customer", minWidth: 130, sortable: true, render: (r) => r.customerName },
    { key: "rating", label: "Rating", align: "center", minWidth: 70, sortable: true, render: (r) => <span style={{ fontWeight: 600 }}>{r.rating.toFixed(0)}★</span> },
    { key: "sentiment", label: "Sentiment", align: "center", minWidth: 100, sortable: true, info: "A genuine read of this review's own written text, not just a mirror of its star rating -- a lukewarm or mixed review can carry a high star rating, and vice versa.", render: (r) => <Badge tone={SENTIMENT_TONE[r.sentiment]}>{SENTIMENT_LABEL[r.sentiment]}</Badge> },
    { key: "title", label: "Title & Review", minWidth: 320, render: (r) => (
      <div>
        <div style={{ fontWeight: 600, marginBottom: 2 }}>{r.title}</div>
        <div className="sl-muted" style={{ fontSize: 12, maxWidth: 480, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }} title={r.text}>{r.text}</div>
      </div>
    ) },
  ];

  if (company !== "PetWise") {
    return (
      <Card padding="28px 24px">
        <div style={{ fontWeight: 600, fontSize: 15 }}>Not available for this company</div>
        <div className="sl-muted" style={{ fontSize: 13, marginTop: 6 }}>This review data belongs to 6 new PetWise items only -- switch to PetWise in the header to view it.</div>
      </Card>
    );
  }

  return (
    <>
      <Card padding="18px 20px">
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600 }}>
          New Item Review Sentiment Analysis
          <InfoTip text="6 brand-new PetWise items with no price/content/stock crawl data of their own -- real customer reviews only, from a client-supplied export. Sentiment is a genuine read of each review's own text, done review by review, not a keyword score or a mirror of the star rating." />
        </div>
        <div className="sl-muted" style={{ fontSize: 12.5, marginTop: 4 }}>168 real customer reviews across 6 new items, not yet part of the tracked catalog -- scoped to this page only.</div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,200px),1fr))", gap: "var(--app-gap)" }}>
        <Card padding="16px 18px">
          <div className="sl-muted" style={{ fontSize: 12.5 }}>Total Reviews</div>
          <div style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 26, marginTop: 4 }}>{totalReviews}</div>
          <div className="sl-faint" style={{ fontSize: 11.5, marginTop: 4 }}>Across 6 new items</div>
        </Card>
        <Card padding="16px 18px">
          <div className="sl-muted" style={{ fontSize: 12.5 }}>Overall Rating</div>
          <div style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 26, marginTop: 4 }}>{overallAvgRating.toFixed(2)}<span style={{ fontSize: 14 }}> / 5</span></div>
          <div className="sl-faint" style={{ fontSize: 11.5, marginTop: 4 }}>Simple average across all reviews</div>
        </Card>
        <Card padding="16px 18px">
          <div className="sl-muted" style={{ fontSize: 12.5 }}>Positive Sentiment</div>
          <div style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 26, marginTop: 4, color: "var(--status-positive-fg)" }}>{positivePct}%</div>
          <div className="sl-faint" style={{ fontSize: 11.5, marginTop: 4 }}>{sentimentCounts.positive} of {totalReviews} reviews</div>
        </Card>
        <Card padding="16px 18px">
          <div className="sl-muted" style={{ fontSize: 12.5 }}>Negative Sentiment</div>
          <div style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 26, marginTop: 4, color: "var(--status-negative-fg)" }}>{negativePct}%</div>
          <div className="sl-faint" style={{ fontSize: 11.5, marginTop: 4 }}>{sentimentCounts.negative} of {totalReviews} reviews</div>
        </Card>
      </div>

      <Card padding="20px 22px 14px">
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Item-by-item breakdown</h3>
        <div className="sl-muted" style={{ fontSize: 12.5, marginTop: 2, marginBottom: 14 }}>Review count, average rating and sentiment split per new item -- click a row to filter the reviews table below to it</div>
        <div style={{ overflowX: "auto" }}>
          <table className="sl-table">
            <thead><tr><th>Item</th><th style={{ textAlign: "right" }}>Reviews</th><th style={{ textAlign: "right" }}>Avg rating</th><th style={{ minWidth: 200 }}>Sentiment split</th></tr></thead>
            <tbody>
              {PETWISE_NEW_ITEMS.map((it) => {
                const selected = itemFilter === it.asin;
                return (
                  <tr key={it.asin} className={"sl-row is-clickable" + (selected ? " is-sorted" : "")} onClick={() => { setItemFilter(selected ? "" : it.asin); setPage(1); }}>
                    <td><div className="sl-table-name">{it.name}</div><div className="sl-table-sub">{it.asin}</div></td>
                    <td style={{ textAlign: "right" }}>{it.reviewCount}</td>
                    <td style={{ textAlign: "right", fontWeight: 600 }}>{it.avgRating.toFixed(2)}★</td>
                    <td>
                      <div style={{ display: "flex", height: 8, borderRadius: 4, overflow: "hidden", background: "var(--surface-secondary)" }}>
                        <span style={{ width: (it.positive / it.reviewCount) * 100 + "%", background: SENTIMENT_COLOR.positive }} title={`${it.positive} positive`} />
                        <span style={{ width: (it.neutral / it.reviewCount) * 100 + "%", background: SENTIMENT_COLOR.neutral }} title={`${it.neutral} neutral`} />
                        <span style={{ width: (it.negative / it.reviewCount) * 100 + "%", background: SENTIMENT_COLOR.negative }} title={`${it.negative} negative`} />
                      </div>
                      <div className="sl-faint" style={{ fontSize: 11, marginTop: 3 }}>{it.positive} positive · {it.neutral} neutral · {it.negative} negative</div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,430px),1fr))", gap: "var(--app-gap)" }}>
        <ChartCard c={ratingChart} onLeave={onLeave} onExportCsv={exportRatingDist} />
        <ChartCard c={sentimentChart} onLeave={onLeave} onExportCsv={exportSentimentDist} />
      </div>

      <Card padding="20px 22px 14px">
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 16 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Reviews</h3>
            <div className="sl-muted" style={{ fontSize: 12.5, marginTop: 2 }}>{total} of {totalReviews} reviews{itemFilter ? " · " + PETWISE_NEW_ITEMS.find((i) => i.asin === itemFilter)?.name : ""}{sentimentFilter ? " · " + SENTIMENT_LABEL[sentimentFilter] : ""}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <select className="input" value={itemFilter} onChange={(e) => setItemFilter(e.target.value)} style={{ minHeight: 32, fontSize: 12.5, width: 200 }}>
              <option value="">All items</option>
              {PETWISE_NEW_ITEMS.map((it) => <option key={it.asin} value={it.asin}>{it.name}</option>)}
            </select>
            <select className="input" value={sentimentFilter} onChange={(e) => setSentimentFilter(e.target.value)} style={{ minHeight: 32, fontSize: 12.5, width: 140 }}>
              <option value="">All sentiment</option>
              <option value="positive">Positive</option>
              <option value="neutral">Neutral</option>
              <option value="negative">Negative</option>
            </select>
            {(itemFilter || sentimentFilter) && <button className="btn btn-ghost" onClick={() => { setItemFilter(""); setSentimentFilter(""); }} style={{ fontSize: 12.5 }}>Clear filters</button>}
            <button className="btn btn-secondary" onClick={exportReviews} style={{ fontSize: 12.5 }}>⬇ Export</button>
          </div>
        </div>
        <SortableTable columns={columns} rows={slice} sortKey={sortKey} sortDir={sortDir} onSort={onSort} rowKey={(r) => String(r.id)} wrap />
        <Pagination page={page} totalPages={totalPages} total={total} pageSize={10} onPage={setPage} />
      </Card>
    </>
  );
}
