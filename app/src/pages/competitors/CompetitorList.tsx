import { useOutletContext } from "react-router-dom";
import { DataTable } from "../../components/table/DataTable";
import { cell, table, pct, delta, deltaColor } from "../../lib/format";
import type { CompetitorsContext } from "./Layout";

export default function CompetitorList() {
  const { snap } = useOutletContext<CompetitorsContext>();

  const competitorsTable = table("Tracked competitors", "Rival portfolios measured on the same keyword set",
    [{ label: "Brand", align: "left" }, { label: "Share of search", align: "right" }, { label: "Change", align: "right" },
     { label: "Tracked SKUs", align: "right" }, { label: "Avg price", align: "right" }, { label: "Avg rating", align: "right" }, { label: "Content", align: "right" }],
    snap.competitors.map((c: any) => ({ cells: [
      cell(c.name, { strong: true }), cell(pct(c.share), { align: "right", strong: true }),
      cell(delta(c.delta, " pts"), { align: "right", color: deltaColor(c.delta, true) }),
      cell(String(c.skus), { align: "right" }), cell("$" + c.price.toFixed(2), { align: "right" }),
      cell(c.rating.toFixed(2), { align: "right" }), cell(String(c.content), { align: "right" }),
    ] })));

  return <DataTable t={competitorsTable} />;
}
