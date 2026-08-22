import { PageShell } from "../components/layout/PageShell";
import { DataTable } from "../components/table/DataTable";
import { reports } from "../data/mockData";
import { cell, table } from "../lib/format";

export default function Reports() {
  const reportsTable = table("Scheduled reports", "Exports and briefings delivered to your teams",
    [{ label: "Report", align: "left" }, { label: "Contents", align: "left" }, { label: "Cadence", align: "left" },
     { label: "Recipients", align: "left" }, { label: "Last sent", align: "left" }, { label: "Format", align: "left" }, { label: "Status", align: "left" }],
    reports.map((r) => ({ cells: [
      cell(r.name, { strong: true }), cell(r.contents), cell(r.cadence),
      cell(r.recipients), cell(r.lastSent), cell(r.format),
      cell(r.status, { tone: r.status === "Scheduled" ? "positive" : "neutral" }),
    ] })));

  return (
    <PageShell title="Reports" subtitle="Scheduled exports and briefings sent to your teams">
      <DataTable t={reportsTable} />
    </PageShell>
  );
}
