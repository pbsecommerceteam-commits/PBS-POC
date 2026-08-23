import { useOutletContext } from "react-router-dom";
import { DataTable } from "../../components/table/DataTable";
import { cell, table } from "../../lib/format";
import type { Product } from "../../models/types";
import type { ReviewsContext } from "./Layout";

function groupBy(products: Product[], key: "retailerName" | "category") {
  const map = new Map<string, { skus: number; ratingSum: number; reviews: number }>();
  products.forEach((p) => {
    const k = p[key];
    const g = map.get(k) || { skus: 0, ratingSum: 0, reviews: 0 };
    g.skus++; g.ratingSum += p.rating; g.reviews += p.reviews;
    map.set(k, g);
  });
  return Array.from(map.entries())
    .map(([name, g]) => ({ name, avgRating: g.ratingSum / g.skus, reviews: g.reviews, skus: g.skus }))
    .sort((a, b) => b.avgRating - a.avgRating);
}

export default function ReviewsBenchmarks() {
  const { products } = useOutletContext<ReviewsContext>();

  const retailerTable = table("Retailer comparison", "Average rating and review count at each monitored retailer",
    [{ label: "Retailer", align: "left" }, { label: "Tracked SKUs", align: "right" }, { label: "Avg rating", align: "right" }, { label: "Review count", align: "right" }],
    groupBy(products, "retailerName").map((r) => ({ cells: [
      cell(r.name, { strong: true }), cell(String(r.skus), { align: "right" }),
      cell(r.avgRating.toFixed(2), { align: "right", strong: true }),
      cell(r.reviews.toLocaleString(), { align: "right" }),
    ] })));

  const categoryTable = table("Category comparison", "Average rating and review count by tracked category",
    [{ label: "Category", align: "left" }, { label: "Tracked SKUs", align: "right" }, { label: "Avg rating", align: "right" }, { label: "Review count", align: "right" }],
    groupBy(products, "category").map((c) => ({ cells: [
      cell(c.name, { strong: true }), cell(String(c.skus), { align: "right" }),
      cell(c.avgRating.toFixed(2), { align: "right", strong: true }),
      cell(c.reviews.toLocaleString(), { align: "right" }),
    ] })));

  return (
    <>
      <DataTable t={retailerTable} />
      <DataTable t={categoryTable} />
    </>
  );
}
