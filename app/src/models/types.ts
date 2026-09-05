/** Core domain entities. Mirrors the shapes assembled by data/mockData.ts —
 *  when that layer is swapped for FastAPI calls, these types describe the
 *  JSON each endpoint is expected to return. */

export interface Retailer {
  id: string;
  name: string;
}

export interface Period {
  id: string;
  name: string;
  points: number;
  grain: "day" | "week" | "month";
}

export type StockStatus = "In Stock" | "Low Stock" | "Out of Stock";
export type OpportunityLevel = "High" | "Medium" | "Low";

/** A product row as it appears in a retailer+period snapshot — shelf and
 *  sales metrics live on the same row so every surface reports one number
 *  per SKU. */
export interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  retailer: string;
  retailerName: string;
  /** Real, deterministic: count (0-10) of the 10 tracked generic keywords
   *  this SKU genuinely appeared under in the raw Share Of Search crawl
   *  (any position, any real week) -- see REAL_KEYWORD_MATCH in
   *  mockData.ts. 0 for the vast majority of SKUs, which is an honest
   *  "not found", not a fabricated position. */
  keywordCoverage: number;
  /** Real: week-over-week change in keywordCoverage across the real crawl
   *  weeks. Always 0 in this dataset -- every matched SKU appeared under
   *  the same keyword all 4 real weeks, so there was genuinely no
   *  movement to report. */
  keywordCoverageDelta: number;
  price: number;
  avgSellingPrice: number;
  priceIndex: number;
  priceChangePct: number;
  listPrice: number | null;
  currentPrice: number | null;
  subscriptionPrice: number | null;
  /** Real MAP (Minimum Advertised Price), from a separate reference
   *  workbook the user supplies (not part of the crawl -- MAP is a brand
   *  policy value, not something crawled). Null when that workbook has no
   *  MAP row for this SKU, an honest "not tracked under MAP", not 0. */
  mapPrice: number | null;
  /** Direct link to the crawled retailer listing page (Price tab's "Url"). */
  url: string | null;
  /** Other (non-buy-box) sellers observed on this listing and their price,
   *  up to 10 -- real competing offers beyond whoever holds the buy box.
   *  Empty on the current Sep 2022 crawl (never captured); populated once a
   *  future upload's Price tab fills in the "Other Seller N Name/Price"
   *  columns. */
  otherSellers: Array<{ name: string; price: number | null }>;
  /** The literal crawled availability sentence (Price tab's "Stock status", e.g. "Only 1 left in stock - order soon."), distinct from the derived 3-bucket stockStatus below. */
  stockStatusRaw: string | null;
  /** The retailer's own posted discount, exactly as crawled (Price tab's "Coupon value", e.g. "4.22 (53%)"). */
  couponValue: string | null;
  stockStatus: StockStatus;
  inStockRate: number;
  rating: number;
  reviews: number;
  contentScore: number;
  /** Ids of the 8 real content checks (see CONTENT_CHECK_LABELS) this product currently fails; empty = all pass. */
  contentChecks: string[];
  titleLength: number;
  /** Real front-of-listing photo URL, hotlinked from the retailer's own CDN (Content tab's "Front image"); null if never crawled. */
  imageUrl: string | null;
  imageCount: number;
  bulletCount: number;
  descriptionLength: number;
  enhancedContent: boolean;
  retailerId: string;
  /** The vendor's own SKU / stock-keeping unit (Content/Price tab's "SKU",
   *  formerly "Vendor stock no") -- distinct from retailerId (that
   *  retailer's own native listing id). The same SKU appearing under 2+
   *  different retailers means the same real product is sold in more than
   *  one place; see CROSS_RETAILER_MATCH in mockData.ts, which prefers this
   *  exact match over its brand+name-overlap fallback. */
  sku: string | null;
  siteCategory: string | null;
  buyBoxSeller: string | null;
  buyBoxShipper: string | null;
  videoCount: number;
  questionCount: number;
  has360Image: boolean;
  descriptionText: string | null;
  bulletsText: string[];
  variations: string[];
  /** Real: share of tracked crawl days this listing held the 1P buy box
   *  (0-100). buyBox (Held/Lost) is a deterministic majority read of this
   *  rate (>=50%), not a random roll. */
  buyBoxRate: number;
  buyBox: boolean;
  opportunity: OpportunityLevel;
  shelfScore: number;
  units: number;
  sales: number;
  salesGrowth: number;
  prevSales: number;
  avgPrice: number;
}

export interface Category {
  name: string;
}

export interface Keyword {
  id: string;
  term: string;
  volume: number;
  ownRank: number;
}

export interface Competitor {
  id: string;
  name: string;
  share: number;
  skus: number;
  price: number;
  rating: number;
  content: number;
}

export interface KpiMetric {
  id: string;
  label: string;
  unit: string;
  target: number;
  value: number;
  delta: number;
  spark: number[];
  labels: string[];
}

export interface SalesMetric {
  retailer: string;
  period: string;
  totals: { sales: number; previous: number; units: number; growth: number; share: number; prevShare: number; catGrowth: number };
}

export interface AvailabilityMetric {
  byRetailer: Array<{ name: string; inStock: number; low: number; oos: number; rate: number; total: number }>;
  belowTarget: number;
  belowThreshold: number;
}

export interface ContentMetric {
  overall: number;
  components: Array<{ id: string; name: string; weight: number; hint: string; score: number; delta: number; lost: number; failing: number }>;
}

export interface ReviewMetric {
  id: string;
  theme: string;
  sentiment: "Positive" | "Mixed" | "Negative";
  share: number;
  mentions: number;
  delta: number;
}

export interface Opportunity {
  id: string;
  focus: string;
  title: string;
  problem: string;
  impact: OpportunityLevel;
  count: number;
  why: string;
  action: string;
  target?: string;
  cta?: string;
  value?: string;
}

export interface AlertRule {
  id: string;
  name: string;
  type: string;
  condition: string;
  scope: string;
  retailer: string;
  frequency: string;
  channel: string;
  status: "Active" | "Paused";
  triggered: string;
}
