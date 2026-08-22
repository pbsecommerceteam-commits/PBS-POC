export type BadgeTone = "positive" | "warning" | "critical" | "neutral" | "info" | "outline";

/** The one status-chip primitive for the whole app. Every badge in
 *  Shelfline — stock status, opportunity level, alert status, sentiment —
 *  resolves to one of a small set of tones so meaning stays legible instead
 *  of every value turning into decoration. */
export function Badge({ tone = "neutral", children }: { tone?: BadgeTone; children: React.ReactNode }) {
  return <span className={"sl-badge sl-badge--" + tone}>{children}</span>;
}

const STOCK_TONE: Record<string, BadgeTone> = { "In Stock": "positive", "Low Stock": "warning", "Out of Stock": "critical" };
const OPPORTUNITY_TONE: Record<string, BadgeTone> = { High: "critical", Medium: "warning", Low: "neutral" };
const GROWTH_TONE: Record<string, BadgeTone> = { Growing: "positive", Stable: "neutral", Declining: "critical" };
const SENTIMENT_TONE: Record<string, BadgeTone> = { Positive: "positive", Mixed: "warning", Negative: "critical" };

export const stockTone = (status: string) => STOCK_TONE[status] || "neutral";
export const opportunityTone = (level: string) => OPPORTUNITY_TONE[level] || "neutral";
export const growthTone = (status: string) => GROWTH_TONE[status] || "neutral";
export const sentimentTone = (sentiment: string) => SENTIMENT_TONE[sentiment] || "neutral";
