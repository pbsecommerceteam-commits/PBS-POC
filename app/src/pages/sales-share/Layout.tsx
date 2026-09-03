import { useCallback, useState } from "react";
import { Outlet } from "react-router-dom";
import { PageShell } from "../../components/layout/PageShell";
import { PageTabs } from "../../components/ui/PageTabs";
import { useDashboardData } from "../../context/DataContext";
import { useUi } from "../../context/UiContext";
import { columnsToCsv } from "../../lib/format";
import { SALES_COLUMNS } from "./Products";
import type { Product } from "../../models/types";

export interface SalesShareContext {
  sd: any;
  sh: any;
  categoryFilter: string;
  setCategoryFilter: (c: string) => void;
  /** Lets the mounted Products page (the only child with its own filters)
     take over what the shared header's Export button does while it's on
     screen -- see content/Layout.tsx's ContentContext for the same
     pattern and its full rationale. */
  registerExport: (fn: (() => void) | null) => void;
}

export default function SalesShareLayout() {
  const { sales: sd, shelf: sh } = useDashboardData();
  const { toast } = useUi();
  const [categoryFilter, setCategoryFilter] = useState("");
  const [pageExport, setPageExport] = useState<(() => void) | null>(null);
  const registerExport = useCallback((fn: (() => void) | null) => setPageExport(() => fn), []);

  const defaultExport = () => {
    const rows: Product[] = sd.products;
    if (!rows.length) { toast("Nothing to export."); return; }
    const blob = new Blob([columnsToCsv(rows, SALES_COLUMNS)], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "shelfline-products-sales-share.csv";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    toast(`Exported ${rows.length} rows.`);
  };

  return (
    <PageShell title={categoryFilter ? `${categoryFilter} — Pricing Intelligence` : "Pricing Intelligence"}
      subtitle={categoryFilter ? `Current, list and subscription pricing, price movement and buy box outcomes for ${categoryFilter}` : "Track current, list and subscription pricing, price movement and buy box outcomes across retailers."}
      tabs={<PageTabs items={[
        { label: "Summary", to: "/sales-share", end: true },
        { label: "Drivers", to: "/sales-share/drivers" },
        { label: "Products", to: "/sales-share/products" },
      ]} />}
      onSaveView={() => toast("View saved.")}
      onExportCsv={sd ? (pageExport ?? defaultExport) : undefined}
    >
      {!sd || !sh ? <div /> : <Outlet context={{ sd, sh, categoryFilter, setCategoryFilter, registerExport } satisfies SalesShareContext} />}
    </PageShell>
  );
}
