import { useState } from "react";
import { Outlet } from "react-router-dom";
import { PageShell } from "../../components/layout/PageShell";
import { PageTabs } from "../../components/ui/PageTabs";
import { useDashboardData } from "../../context/DataContext";
import { useUi } from "../../context/UiContext";
import { toCsv } from "../../data/mockData";
import type { Product } from "../../models/types";

export interface DigitalShelfContext {
  sh: any;
  categoryFilter: string;
  setCategoryFilter: (c: string) => void;
}

export default function DigitalShelfLayout() {
  const { shelf: sh } = useDashboardData();
  const { toast } = useUi();
  const [categoryFilter, setCategoryFilter] = useState("");

  return (
    <PageShell title="Digital Shelf" subtitle="Monitor product visibility, availability, pricing and content across retailers"
      tabs={<PageTabs items={[
        { label: "Summary", to: "/digital-shelf", end: true },
        { label: "Search", to: "/digital-shelf/search" },
        { label: "Benchmarks", to: "/digital-shelf/benchmarks" },
        { label: "Products", to: "/digital-shelf/products" },
      ]} />}
      onSaveView={() => toast("View saved.")}
      onExportCsv={sh ? () => {
        const rows: Product[] = sh.products;
        if (!rows.length) { toast("Nothing to export."); return; }
        const blob = new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "shelfline-products-digital-shelf.csv";
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 2000);
        toast(`Exported ${rows.length} rows.`);
      } : undefined}
    >
      {!sh ? <div /> : <Outlet context={{ sh, categoryFilter, setCategoryFilter } satisfies DigitalShelfContext} />}
    </PageShell>
  );
}
