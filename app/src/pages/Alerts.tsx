import { PageShell } from "../components/layout/PageShell";
import { DataTable } from "../components/table/DataTable";
import { alertRules, notificationFeed } from "../data/mockData";
import { cell, table } from "../lib/format";

export default function Alerts() {
  const rulesTable = table("Alert rules", "Conditions watching the portfolio right now",
    [{ label: "Rule", align: "left" }, { label: "Type", align: "left" }, { label: "Scope", align: "left" },
     { label: "Frequency", align: "left" }, { label: "Delivery", align: "left" }, { label: "Status", align: "left" }],
    alertRules.map((r) => ({ cells: [
      cell(r.name, { strong: true, sub: r.condition }),
      cell(r.type), cell(r.scope, { sub: r.retailer }),
      cell(r.frequency, { sub: r.triggered }), cell(r.channel),
      cell(r.status, { tone: r.status === "Active" ? "positive" : "neutral" }),
    ] })));

  const triggersTable = table("Recent triggers", "What these rules have caught in the last 24 hours",
    [{ label: "Alert", align: "left" }, { label: "Detail", align: "left" }, { label: "When", align: "right" }],
    notificationFeed.map((n) => ({ cells: [
      cell(n.title, { strong: true }), cell(n.text),
      cell(n.time, { align: "right" }),
    ] })));

  return (
    <PageShell title="Alerts" subtitle="Rules watching the portfolio and what they have caught">
      <DataTable t={rulesTable} />
      <DataTable t={triggersTable} />
    </PageShell>
  );
}
