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
  searchRank: number;
  rankDelta: number;
  price: number;
  avgSellingPrice: number;
  priceIndex: number;
  stockStatus: StockStatus;
  inStockRate: number;
  rating: number;
  reviews: number;
  contentScore: number;
  buyBox: boolean;
  opportunity: OpportunityLevel;
  searchVisibility: number;
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
