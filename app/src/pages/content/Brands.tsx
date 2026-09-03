import { useOutletContext } from "react-router-dom";
import { DataTable } from "../../components/table/DataTable";
import { cell, table } from "../../lib/format";
import { passFail, CHECK_COLUMNS } from "./contentChecks";
import type { Product } from "../../models/types";
import type { ContentContext } from "./Layout";

/* Content Score plus every individual rubric check (see contentChecks.ts),
   each rolled up to a brand-level pass rate instead of a per-SKU value --
   Content Score's own "pass" threshold (>=80) matches the color cutoff
   its column already uses on the Products table. */
const SCORE_COLUMNS: { id: string; label: string; passFn: (p: Product) => boolean }[] = [
  { id: "contentScore", label: "Content Score", passFn: (p) => p.contentScore >= 80 },
  ...CHECK_COLUMNS.map((c) => ({ id: c.id, label: c.label.replace(" Score", ""), passFn: (p: Product) => passFail(p, c.id) })),
];
const pctColor = (pct: number) => (pct >= 80 ? "var(--status-positive-fg)" : pct >= 50 ? "var(--status-warning-fg)" : "var(--status-critical-fg)");

export default function ContentBrands() {
  const { products } = useOutletContext<ContentContext>();

  const byBrand = new Map<string, Product[]>();
  products.forEach((p) => { const arr = byBrand.get(p.brand) ?? []; arr.push(p); byBrand.set(p.brand, arr); });

  const brandTable = table(
    "Content Score by Brand", "Real per-check pass counts and pass rate, grouped by brand",
    [{ label: "Brand", align: "left" }, { label: "SKUs", align: "right" }, ...SCORE_COLUMNS.map((sc) => ({ label: sc.label, align: "right" as const }))],
    Array.from(byBrand.entries()).sort((a, b) => b[1].length - a[1].length).map(([brandName, prods]) => {
      const n = prods.length;
      return { cells: [
        cell(brandName, { strong: true }),
        cell(String(n), { align: "right" }),
        ...SCORE_COLUMNS.map((sc) => {
          const passing = prods.filter(sc.passFn).length;
          const pct = n ? Math.round((passing / n) * 1000) / 10 : 0;
          return cell(`${passing} (${pct.toFixed(1)}%)`, { align: "right", color: pctColor(pct) });
        }),
      ] };
    }),
  );

  return <DataTable t={brandTable} />;
}
