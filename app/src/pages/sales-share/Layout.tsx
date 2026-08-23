import { useState } from "react";
import { Outlet } from "react-router-dom";
import { PageShell } from "../../components/layout/PageShell";
import { PageTabs } from "../../components/ui/PageTabs";
import { useDashboardData } from "../../context/DataContext";
import { useUi } from "../../context/UiContext";
import { toCsv } from "../../data/mockData";
import type { Product } from "../../models/types";

export interface SalesShareContext {
  sd: any;
  sh: any;
  categoryFilter: string;
  setCategoryFilter: (c: string) => void;
}

export default function SalesShareLayout() {
  const { sales: sd, shelf: sh } = useDashboardData();
  const { toast } = useUi();
  const [categoryFilter, setCategoryFilter] = useState("");

  return (
    <PageShell title={categoryFilter ? `${categoryFilter} — Performance Intelligence` : "Performance Intelligence"}
      subtitle={categoryFilter ? `Search, pricing, availability and retailer conditions for ${categoryFilter}` : "Understand how products perform across search, pricing, availability and retailer conditions."}
      tabs={<PageTabs items={[
        { label: "Summary", to: "/sales-share", end: true },
        { label: "Drivers", to: "/sales-share/drivers" },
        { label: "Products", to: "/sales-share/products" },
      ]} />}
      onSaveView={() => toast("View saved.")}
      onExportCsv={sd ? () => {
        const rows: Product[] = sd.products;
        if (!rows.length) { toast("Nothing to export."); return; }
        const blob = new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "shelfline-products-sales-share.csv";
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 2000);
        toast(`Exported ${rows.length} rows.`);
      } : undefined}
    >
      {!sd || !sh ? <div /> : <Outlet context={{ sd, sh, categoryFilter, setCategoryFilter } satisfies SalesShareContext} />}
    </PageShell>
  );
}
