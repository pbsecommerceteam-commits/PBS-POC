import { Outlet } from "react-router-dom";
import { PageShell } from "../../components/layout/PageShell";
import { PageTabs } from "../../components/ui/PageTabs";
import { useDashboardData } from "../../context/DataContext";
import { useUi } from "../../context/UiContext";
import { toCsv } from "../../data/mockData";
import type { Product } from "../../models/types";

export interface ReviewsContext {
  snap: any;
  products: Product[];
}

export default function ReviewsLayout() {
  const { snap } = useDashboardData();
  const { toast } = useUi();

  return (
    <PageShell title="Reviews" subtitle="Rating trajectory, review volume and recurring themes"
      tabs={<PageTabs items={[
        { label: "Summary", to: "/reviews", end: true },
        { label: "Benchmarks", to: "/reviews/benchmarks" },
        { label: "Products", to: "/reviews/products" },
      ]} />}
      onSaveView={() => toast("View saved.")}
      onExportCsv={snap ? () => {
        const rows: Product[] = snap.products;
        if (!rows.length) { toast("Nothing to export."); return; }
        const blob = new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "shelfline-products-reviews.csv";
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 2000);
        toast(`Exported ${rows.length} rows.`);
      } : undefined}
    >
      {!snap ? <div /> : <Outlet context={{ snap, products: snap.products } satisfies ReviewsContext} />}
    </PageShell>
  );
}
