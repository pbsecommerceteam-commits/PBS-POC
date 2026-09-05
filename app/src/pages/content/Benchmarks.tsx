import { useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { DataTable } from "../../components/table/DataTable";
import { DrilldownModal } from "../../components/ui/DrilldownModal";
import { cell, table, type TableConfig } from "../../lib/format";
import type { ContentContext } from "./Layout";

export default function ContentBenchmarks() {
  const { snap } = useOutletContext<ContentContext>();
  const navigate = useNavigate();
  const [drill, setDrill] = useState<TableConfig | null>(null);
  const goToProduct = (id: string) => { setDrill(null); navigate("/product/" + id); };

  /* Clicking a requirement's Failing SKUs count opens exactly which
     products fail it -- same contentChecks source and table()/cell() +
     DrilldownModal pattern as Content Intelligence Summary's "Products
     With Issues" section, so this page's numbers aren't a dead end. */
  const issueTable = (checkId: string, label: string) => {
    const failing = snap.products.filter((p: any) => (p.contentChecks ?? []).includes(checkId));
    return table(label, `${failing.length} of ${snap.products.length} SKUs currently fail this check`,
      [{ label: "Product", align: "left" }, { label: "Retailer", align: "left" }, { label: "Content Score", align: "right" }],
      failing.map((p: any) => ({ cells: [
        cell(p.name, { onClick: () => goToProduct(p.id) }),
        cell(p.retailerName),
        cell(p.contentScore + "%", { align: "right", color: p.contentScore < 80 ? "var(--status-negative-fg)" : "inherit" }),
      ] })));
  };

  const coverageTable = table("Attribute coverage", "Share of tracked pages meeting each retailer requirement -- click Failing SKUs to see which ones",
    [{ label: "Requirement", align: "left" }, { label: "Coverage", align: "right" }, { label: "Failing SKUs", align: "right" }],
    snap.contentCoverage.map((a: any) => ({ cells: [
      cell(a.name),
      cell(a.coverage + "%", { align: "right", strong: true }),
      cell(String(a.failing), { align: "right", color: a.coverage < 50 ? "var(--status-negative-fg)" : "inherit", onClick: a.failing > 0 ? () => setDrill(issueTable(a.id, a.name)) : undefined }),
    ] })),
    "Real per-check pass rate across the current pool -- the same 9-check rubric behind every Content Score on the app, just shown per-requirement instead of averaged.");

  return (
    <>
      <DataTable t={coverageTable} />
      {drill && <DrilldownModal t={drill} onClose={() => setDrill(null)} />}
    </>
  );
}
