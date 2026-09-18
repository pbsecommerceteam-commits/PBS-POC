import type { Product } from "../models/types";

const STOCK_ORDER: Record<string, number> = { "In Stock": 0, "Low Stock": 1, "Out of Stock": 2 };
const OPP_ORDER: Record<string, number> = { High: 0, Medium: 1, Low: 2 };

/** % gap between effective price and real MAP price (negative = priced
 *  under MAP, a violation) -- Infinity for SKUs with no MAP tracked, so
 *  they always sort as the least urgent, never mixed in among genuine
 *  violations. */
const mapGapPct = (p: Product) => {
  const eff = p.currentPrice ?? p.price;
  return p.mapPrice && eff != null ? ((eff - p.mapPrice) / p.mapPrice) * 100 : Infinity;
};

/** Wraps any comparator so a URL-failed SKU (no data ever scraped) always
 *  sorts after every genuinely-tracked row, regardless of which column is
 *  being sorted -- its price/rating/content/etc. are all real zeros/nulls
 *  that would otherwise put it first under the default ascending sort on
 *  ANY column, not just shelfScore. Exported so a page with its own extra,
 *  locally-defined sorter (e.g. content/Products.tsx's "completeness") can
 *  apply the same treatment. Reliable for the default ascending direction
 *  every table loads with; a user who manually re-sorts descending gets
 *  the same pre-existing direction-flip behavior every "?? Infinity"
 *  null-handling comparator below already has. */
export function urlFailedLast<T extends { urlFailed: boolean }>(cmp: (a: T, b: T) => number) {
  return (a: T, b: T) => (a.urlFailed !== b.urlFailed ? (a.urlFailed ? 1 : -1) : cmp(a, b));
}

/** One comparator per sortable product column, shared by every product
 *  table (Overview, Digital Shelf, Performance Intelligence) so sort behavior — and
 *  the string/enum/numeric special-casing — is defined once. Every entry is
 *  wrapped in urlFailedLast (see above) so a URL-failed SKU sorts last no
 *  matter which column the table is currently sorted by. */
const RAW_SORTERS: Record<string, (a: Product, b: Product) => number> = {
  name: (a, b) => a.name.localeCompare(b.name),
  category: (a, b) => a.category.localeCompare(b.category),
  retailerName: (a, b) => a.retailerName.localeCompare(b.retailerName),
  keywordCoverage: (a, b) => a.keywordCoverage - b.keywordCoverage,
  // A SKU the crawl never priced (null) always sorts last, either direction
  // -- same convention as listPrice/subscriptionPrice/mapPrice below.
  price: (a, b) => (a.price ?? Infinity) - (b.price ?? Infinity),
  priceIndex: (a, b) => (a.priceIndex ?? Infinity) - (b.priceIndex ?? Infinity),
  currentPrice: (a, b) => (a.currentPrice ?? a.price ?? Infinity) - (b.currentPrice ?? b.price ?? Infinity),
  listPrice: (a, b) => (a.listPrice ?? Infinity) - (b.listPrice ?? Infinity),
  subscriptionPrice: (a, b) => (a.subscriptionPrice ?? Infinity) - (b.subscriptionPrice ?? Infinity),
  mapPrice: (a, b) => (a.mapPrice ?? Infinity) - (b.mapPrice ?? Infinity),
  mapStatus: (a, b) => mapGapPct(a) - mapGapPct(b),
  couponValue: (a, b) => (a.couponValue ?? "").localeCompare(b.couponValue ?? ""),
  priceChangePct: (a, b) => a.priceChangePct - b.priceChangePct,
  stockStatus: (a, b) => STOCK_ORDER[a.stockStatus] - STOCK_ORDER[b.stockStatus],
  stockStatusRaw: (a, b) => (a.stockStatusRaw ?? "").localeCompare(b.stockStatusRaw ?? ""),
  brand: (a, b) => a.brand.localeCompare(b.brand),
  inStockRate: (a, b) => a.inStockRate - b.inStockRate,
  rating: (a, b) => a.rating - b.rating,
  contentScore: (a, b) => a.contentScore - b.contentScore,
  titleLength: (a, b) => a.titleLength - b.titleLength,
  bulletCount: (a, b) => a.bulletCount - b.bulletCount,
  descriptionLength: (a, b) => a.descriptionLength - b.descriptionLength,
  imageCount: (a, b) => a.imageCount - b.imageCount,
  videoCount: (a, b) => a.videoCount - b.videoCount,
  questionCount: (a, b) => a.questionCount - b.questionCount,
  retailerId: (a, b) => a.retailerId.localeCompare(b.retailerId),
  sku: (a, b) => (a.sku ?? "").localeCompare(b.sku ?? ""),
  siteCategory: (a, b) => (a.siteCategory ?? "").localeCompare(b.siteCategory ?? ""),
  buyBoxRate: (a, b) => a.buyBoxRate - b.buyBoxRate,
  buyBoxSeller: (a, b) => (a.buyBoxSeller ?? "").localeCompare(b.buyBoxSeller ?? ""),
  buyBoxShipper: (a, b) => (a.buyBoxShipper ?? "").localeCompare(b.buyBoxShipper ?? ""),
  has360Image: (a, b) => Number(b.has360Image) - Number(a.has360Image),
  enhancedContent: (a, b) => Number(b.enhancedContent) - Number(a.enhancedContent),
  shelfScore: (a, b) => a.shelfScore - b.shelfScore,
  opportunity: (a, b) => OPP_ORDER[a.opportunity] - OPP_ORDER[b.opportunity],
  sales: (a, b) => a.sales - b.sales,
  salesGrowth: (a, b) => a.salesGrowth - b.salesGrowth,
  units: (a, b) => a.units - b.units,
};

export const productSorters: Record<string, (a: Product, b: Product) => number> = Object.fromEntries(
  Object.entries(RAW_SORTERS).map(([key, cmp]) => [key, urlFailedLast(cmp)]),
);
