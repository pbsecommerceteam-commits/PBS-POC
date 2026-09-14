import { useCallback, useState } from "react";
import { Outlet } from "react-router-dom";
import { PageShell } from "../../components/layout/PageShell";
import { PageTabs } from "../../components/ui/PageTabs";
import { useDashboardData } from "../../context/DataContext";
import { useFilters } from "../../context/FiltersContext";
import { useUi } from "../../context/UiContext";
import { columnsToCsv } from "../../lib/format";
import { REVIEWS_COLUMNS } from "./Products";
import type { Product } from "../../models/types";

export interface ReviewsContext {
  snap: any;
  products: Product[];
  /** Lets the mounted Products page (the only child with its own filters)
     take over what the shared header's Export button does while it's on
     screen -- see content/Layout.tsx's ContentContext for the same
     pattern and its full rationale. */
  registerExport: (fn: (() => void) | null) => void;
}

export default function ReviewsLayout() {
  const { snap } = useDashboardData();
  const { company } = useFilters();
  const { toast } = useUi();
  const [pageExport, setPageExport] = useState<(() => void) | null>(null);
  const registerExport = useCallback((fn: (() => void) | null) => setPageExport(() => fn), []);

  const defaultExport = () => {
    const rows: Product[] = snap.products;
    if (!rows.length) { toast("Nothing to export."); return; }
    const blob = new Blob([columnsToCsv(rows, REVIEWS_COLUMNS)], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "shelfline-products-reviews.csv";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    toast(`Exported ${rows.length} rows.`);
  };

  return (
    <PageShell title="Ratings & Reviews" subtitle="Rating trajectory, review volume and retailer/category comparisons"
      tabs={<PageTabs items={[
        { label: "Summary", to: "/reviews", end: true },
        { label: "Products", to: "/reviews/products" },
        /* Real review data for 6 brand-new PetWise items (see
           data/petwiseNewItemReviews.ts) -- there's no price/content/stock
           crawl for them, so this tab (and the data it reads) is scoped to
           PetWise only, never blended into any other company's numbers or
           shown to a company it doesn't belong to. */
        ...(company === "PetWise" ? [{ label: "New Items", to: "/reviews/new-items" }] : []),
      ]} />}
      onSaveView={() => toast("View saved.")}
      onExportCsv={snap ? (pageExport ?? defaultExport) : undefined}
    >
      {!snap ? <div /> : <Outlet context={{ snap, products: snap.products, registerExport } satisfies ReviewsContext} />}
    </PageShell>
  );
}
