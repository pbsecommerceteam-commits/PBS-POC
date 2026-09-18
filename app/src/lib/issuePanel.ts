import type { Product } from "../models/types";
import { REAL_BUYBOX_COMPETITOR } from "../data/mockData";

export interface IssueCardData {
  id: "buybox" | "urlFailed";
  impact: string;
  impactTone: "critical" | "warning" | "neutral";
  count: string;
  title: string;
  problem: string;
  why: string;
  action: string;
  cta: string;
}

/** Real, concrete "what's actually wrong" cards for a Product Performance
 *  section -- Buy Box Lost to 3P Sellers and Crawl/URL Failed -- both
 *  derived straight from the given product pool, so the count on the card
 *  always matches whatever that page's own filters currently show rather
 *  than a separately-scoped aggregate that could drift out of sync with
 *  it. A card is omitted entirely when its count is 0, same convention as
 *  Overview's Key Insights priority buckets. */
export function buildActionableIssues(pool: Product[]): IssueCardData[] {
  const cards: IssueCardData[] = [];

  const lostTo3P = pool.filter((p) => !!(REAL_BUYBOX_COMPETITOR as any)[p.id]);
  if (lostTo3P.length > 0) {
    const sellerCounts: Record<string, number> = {};
    lostTo3P.forEach((p) => {
      const seller = (REAL_BUYBOX_COMPETITOR as any)[p.id]?.seller;
      if (seller) sellerCounts[seller] = (sellerCounts[seller] || 0) + 1;
    });
    const topSeller = Object.entries(sellerCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
    cards.push({
      id: "buybox", impact: "High", impactTone: "critical",
      count: `${lostTo3P.length} / ${pool.length}`,
      title: "Buy Box Lost to 3P Sellers",
      problem: `${lostTo3P.length} of ${pool.length} SKUs had a 3rd-party seller win the buy box this period${topSeller ? `, led by ${topSeller}` : ""}.`,
      why: "A 3P seller holding the buy box can undercut price and divert the sale away from your own storefront margin.",
      action: "Review pricing and availability on the affected SKUs to win the buy box back.",
      cta: "Review products →",
    });
  }

  const urlFailed = pool.filter((p) => p.urlFailed);
  if (urlFailed.length > 0) {
    cards.push({
      id: "urlFailed", impact: "Data gap", impactTone: "critical",
      count: `${urlFailed.length}`,
      title: "Crawl / URL Failed",
      problem: `${urlFailed.length} SKU${urlFailed.length === 1 ? "" : "s"} never returned data -- excluded from every score, listed separately.`,
      why: "These listings' crawl URL failed outright, so their real content/price/stock is unknown -- a data gap, not a measured quality problem.",
      action: "Re-check the listing URL and re-crawl -- until then this SKU's score of 0 doesn't reflect its real content.",
      cta: "View list →",
    });
  }

  return cards;
}
