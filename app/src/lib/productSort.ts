import type { Product } from "../models/types";

const STOCK_ORDER: Record<string, number> = { "In Stock": 0, "Low Stock": 1, "Out of Stock": 2 };
const OPP_ORDER: Record<string, number> = { High: 0, Medium: 1, Low: 2 };

/** One comparator per sortable product column, shared by every product
 *  table (Overview, Digital Shelf, Performance Intelligence) so sort behavior — and
 *  the string/enum/numeric special-casing — is defined once. */
export const productSorters: Record<string, (a: Product, b: Product) => number> = {
  name: (a, b) => a.name.localeCompare(b.name),
  category: (a, b) => a.category.localeCompare(b.category),
  retailerName: (a, b) => a.retailerName.localeCompare(b.retailerName),
  searchRank: (a, b) => a.searchRank - b.searchRank,
  searchVisibility: (a, b) => a.searchVisibility - b.searchVisibility,
  price: (a, b) => a.price - b.price,
  priceIndex: (a, b) => a.priceIndex - b.priceIndex,
  currentPrice: (a, b) => (a.currentPrice ?? a.price) - (b.currentPrice ?? b.price),
  listPrice: (a, b) => (a.listPrice ?? Infinity) - (b.listPrice ?? Infinity),
  subscriptionPrice: (a, b) => (a.subscriptionPrice ?? Infinity) - (b.subscriptionPrice ?? Infinity),
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
  vendorStockNo: (a, b) => (a.vendorStockNo ?? "").localeCompare(b.vendorStockNo ?? ""),
  siteCategory: (a, b) => (a.siteCategory ?? "").localeCompare(b.siteCategory ?? ""),
  buyBoxSeller: (a, b) => (a.buyBoxSeller ?? "").localeCompare(b.buyBoxSeller ?? ""),
  buyBoxShipper: (a, b) => (a.buyBoxShipper ?? "").localeCompare(b.buyBoxShipper ?? ""),
  has360Image: (a, b) => Number(b.has360Image) - Number(a.has360Image),
  hasIngredients: (a, b) => Number(b.hasIngredients) - Number(a.hasIngredients),
  enhancedContent: (a, b) => Number(b.enhancedContent) - Number(a.enhancedContent),
  shelfScore: (a, b) => a.shelfScore - b.shelfScore,
  opportunity: (a, b) => OPP_ORDER[a.opportunity] - OPP_ORDER[b.opportunity],
  sales: (a, b) => a.sales - b.sales,
  salesGrowth: (a, b) => a.salesGrowth - b.salesGrowth,
  units: (a, b) => a.units - b.units,
};
