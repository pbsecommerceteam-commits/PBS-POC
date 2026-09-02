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
  stockStatus: (a, b) => STOCK_ORDER[a.stockStatus] - STOCK_ORDER[b.stockStatus],
  inStockRate: (a, b) => a.inStockRate - b.inStockRate,
  rating: (a, b) => a.rating - b.rating,
  contentScore: (a, b) => a.contentScore - b.contentScore,
  shelfScore: (a, b) => a.shelfScore - b.shelfScore,
  opportunity: (a, b) => OPP_ORDER[a.opportunity] - OPP_ORDER[b.opportunity],
  sales: (a, b) => a.sales - b.sales,
  salesGrowth: (a, b) => a.salesGrowth - b.salesGrowth,
  units: (a, b) => a.units - b.units,
};
