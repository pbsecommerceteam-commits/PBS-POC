import { useCallback, useState } from "react";
import { Outlet } from "react-router-dom";
import { PageShell } from "../../components/layout/PageShell";
import { PageTabs } from "../../components/ui/PageTabs";
import { useDashboardData } from "../../context/DataContext";
import { useUi } from "../../context/UiContext";
import { columnsToCsv } from "../../lib/format";
import { CONTENT_COLUMNS, DEFAULT_CONTENT_COLUMN_ORDER } from "./Products";
import type { Product } from "../../models/types";

export interface ContentContext {
  snap: any;
  products: Product[];
  /** Lets the mounted child page (currently only Products, which has its
     own filters + column customization) take over what the shared header's
     Export button does while it's on screen -- pass a function to make
     Export produce exactly that page's current filtered rows/columns,
     or null to hand control back to this Layout's own full-section,
     all-columns default (what Summary/Benchmarks export, and what
     Products falls back to before any filter/column state exists). */
  registerExport: (fn: (() => void) | null) => void;
}

export default function ContentLayout() {
  const { snap } = useDashboardData();
  const { toast } = useUi();
  const [pageExport, setPageExport] = useState<(() => void) | null>(null);
  const registerExport = useCallback((fn: (() => void) | null) => setPageExport(() => fn), []);

  const defaultExport = () => {
    const rows: Product[] = snap.products;
    if (!rows.length) { toast("Nothing to export."); return; }
    const columns = ["name", ...DEFAULT_CONTENT_COLUMN_ORDER].map((id) => CONTENT_COLUMNS.find((c) => c.key === id)!);
    const blob = new Blob([columnsToCsv(rows, columns)], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "shelfline-products-content.csv";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    toast(`Exported ${rows.length} rows.`);
  };

  return (
    <PageShell title="Content Intelligence" subtitle="Measure product-content completeness across monitored retailers."
      tabs={<PageTabs items={[
        { label: "Summary", to: "/content", end: true },
        { label: "Benchmarks", to: "/content/benchmarks" },
        { label: "Products", to: "/content/products" },
      ]} />}
      onSaveView={() => toast("View saved.")}
      onExportCsv={snap ? (pageExport ?? defaultExport) : undefined}
    >
      {!snap ? <div /> : <Outlet context={{ snap, products: snap.products, registerExport } satisfies ContentContext} />}
    </PageShell>
  );
}
