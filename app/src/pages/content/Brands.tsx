import { useNavigate, useOutletContext } from "react-router-dom";
import { DataTable } from "../../components/table/DataTable";
import { cell, table } from "../../lib/format";
import { passFail, CHECK_COLUMNS } from "./contentChecks";
import type { Product } from "../../models/types";
import type { ContentContext } from "./Layout";

/* Every individual rubric check (see contentChecks.ts), rolled up to a
   brand-level pass rate instead of a per-SKU value. Content Score itself
   is NOT one of these -- it's a continuous 0-100 average everywhere else
   in the app (Overview, Product Detail, Benchmarks), so showing it here
   as "% of SKUs clearing an 80-point bar" would silently redefine what
   "Content Score" means on this one page, and reads as "0% for nearly
   every brand" once the 9-check rubric makes 80+ genuinely rare (only 1
   of 117 SKUs clears it) -- looks broken even though the per-check math
   is correct. */
const SCORE_COLUMNS: { id: string; label: string; passFn: (p: Product) => boolean }[] =
  CHECK_COLUMNS.map((c) => ({ id: c.id, label: c.label.replace(" Score", ""), passFn: (p: Product) => passFail(p, c.id) }));
const pctColor = (pct: number) => (pct >= 80 ? "var(--status-positive-fg)" : pct >= 50 ? "var(--status-warning-fg)" : "var(--status-critical-fg)");

export default function ContentBrands() {
  const { products } = useOutletContext<ContentContext>();
  const navigate = useNavigate();

  const byBrand = new Map<string, Product[]>();
  products.forEach((p) => { const arr = byBrand.get(p.brand) ?? []; arr.push(p); byBrand.set(p.brand, arr); });

  /* Clicking any score for a brand drills into Products filtered to just
     that brand's SKUs, so "this brand is at 27%" always has an immediate
     "which items, specifically" answer one click away -- Products reads
     this ?brand= param on mount to pre-select its own Brand facet. */
  const goToBrand = (brandName: string) => navigate("/content/products?brand=" + encodeURIComponent(brandName));

  const brandTable = table(
    "Content Score by Brand", "Real average Content Score plus per-check pass rate, grouped by brand -- click a score to see its products",
    [
      { label: "Brand", align: "left", minWidth: 200 },
      { label: "SKUs", align: "right", minWidth: 90 },
      { label: "Content Score", align: "right", minWidth: 150 },
      ...SCORE_COLUMNS.map((sc) => ({ label: sc.label, align: "right" as const, minWidth: 150 })),
    ],
    Array.from(byBrand.entries()).sort((a, b) => b[1].length - a[1].length).map(([brandName, prods]) => {
      const n = prods.length;
      const avgScore = n ? Math.round((prods.reduce((a, p) => a + p.contentScore, 0) / n) * 10) / 10 : 0;
      return { cells: [
        cell(brandName, { strong: true, wrap: true }),
        cell(String(n), { align: "right", wrap: true }),
        cell(`${avgScore.toFixed(1)}%`, { align: "right", color: pctColor(avgScore), wrap: true, onClick: () => goToBrand(brandName) }),
        ...SCORE_COLUMNS.map((sc) => {
          const passing = prods.filter(sc.passFn).length;
          const pct = n ? Math.round((passing / n) * 1000) / 10 : 0;
          return cell(`${passing} (${pct.toFixed(1)}%)`, { align: "right", color: pctColor(pct), wrap: true, onClick: () => goToBrand(brandName) });
        }),
      ] };
    }),
  );

  return <DataTable t={brandTable} resizable />;
}
