import { useOutletContext } from "react-router-dom";
import { DataTable } from "../../components/table/DataTable";
import { cell, table } from "../../lib/format";
import type { ContentContext } from "./Layout";

export default function ContentBenchmarks() {
  const { snap } = useOutletContext<ContentContext>();

  const coverageTable = table("Attribute coverage", "Share of tracked pages meeting each retailer requirement",
    [{ label: "Requirement", align: "left" }, { label: "Coverage", align: "right" }, { label: "Failing SKUs", align: "right" }],
    snap.contentCoverage.map((a: any) => ({ cells: [
      cell(a.name),
      cell(a.coverage + "%", { align: "right", strong: true }),
      cell(String(a.failing), { align: "right", color: a.coverage < 50 ? "var(--status-negative-fg)" : "inherit" }),
    ] })));

  return <DataTable t={coverageTable} />;
}
