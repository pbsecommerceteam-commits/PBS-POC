import { useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { DataTable } from "../../components/table/DataTable";
import { DrilldownModal } from "../../components/ui/DrilldownModal";
import { cell, table, type TableConfig } from "../../lib/format";
import type { Product } from "../../models/types";
import type { ReviewsContext } from "./Layout";

function groupBy(products: Product[], key: "retailerName" | "category") {
  const map = new Map<string, { skus: number; ratingSum: number; reviews: number; products: Product[] }>();
  products.forEach((p) => {
    const k = p[key];
    const g = map.get(k) || { skus: 0, ratingSum: 0, reviews: 0, products: [] };
    g.skus++; g.ratingSum += p.rating; g.reviews += p.reviews; g.products.push(p);
    map.set(k, g);
  });
  return Array.from(map.entries())
    .map(([name, g]) => ({ name, avgRating: g.ratingSum / g.skus, reviews: g.reviews, skus: g.skus, products: g.products }))
    .sort((a, b) => b.avgRating - a.avgRating);
}

export default function ReviewsBenchmarks() {
  const { products } = useOutletContext<ReviewsContext>();
  const navigate = useNavigate();
  const [drill, setDrill] = useState<TableConfig | null>(null);
  const goToProduct = (id: string) => { setDrill(null); navigate("/product/" + id); };

  /* Clicking a retailer/category's rating or review count opens the exact
     SKUs averaged into that number -- same table()/cell() + DrilldownModal
     pattern used on Pricing Intelligence and Content Intelligence Summary,
     so "4.28 average across 30 SKUs" always has a one-click answer to
     "which 30, and what's each one rated". */
  const groupDrill = (groupLabel: string, name: string, prods: Product[]) => table(
    `${groupLabel}: ${name}`, `${prods.length} tracked SKUs behind this row's average`,
    [{ label: "Product", align: "left" }, { label: "Retailer", align: "left" }, { label: "Rating", align: "right" }, { label: "Reviews", align: "right" }],
    prods.slice().sort((a, b) => b.rating - a.rating).map((p) => ({ cells: [
      cell(p.name, { onClick: () => goToProduct(p.id) }),
      cell(p.retailerName),
      cell(p.rating.toFixed(2), { align: "right", strong: true }),
      cell(p.reviews.toLocaleString(), { align: "right" }),
    ] })));

  const retailerGroups = groupBy(products, "retailerName");
  const categoryGroups = groupBy(products, "category");

  const retailerTable = table("Retailer comparison", "Average rating and review count at each monitored retailer -- click a row to see its SKUs",
    [{ label: "Retailer", align: "left" }, { label: "Tracked SKUs", align: "right" }, { label: "Avg rating", align: "right" }, { label: "Review count", align: "right" }],
    retailerGroups.map((r) => ({ cells: [
      cell(r.name, { strong: true, onClick: () => setDrill(groupDrill("Retailer", r.name, r.products)) }),
      cell(String(r.skus), { align: "right" }),
      cell(r.avgRating.toFixed(2), { align: "right", strong: true }),
      cell(r.reviews.toLocaleString(), { align: "right" }),
    ] })));

  const categoryTable = table("Category comparison", "Average rating and review count by tracked category -- click a row to see its SKUs",
    [{ label: "Category", align: "left" }, { label: "Tracked SKUs", align: "right" }, { label: "Avg rating", align: "right" }, { label: "Review count", align: "right" }],
    categoryGroups.map((c) => ({ cells: [
      cell(c.name, { strong: true, onClick: () => setDrill(groupDrill("Category", c.name, c.products)) }),
      cell(String(c.skus), { align: "right" }),
      cell(c.avgRating.toFixed(2), { align: "right", strong: true }),
      cell(c.reviews.toLocaleString(), { align: "right" }),
    ] })));

  return (
    <>
      <DataTable t={retailerTable} />
      <DataTable t={categoryTable} />
      {drill && <DrilldownModal t={drill} onClose={() => setDrill(null)} />}
    </>
  );
}
