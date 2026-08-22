import { useOutletContext } from "react-router-dom";
import { DataTable } from "../../components/table/DataTable";
import { cell, table, pct, delta, deltaColor } from "../../lib/format";
import { sentimentTone } from "../../components/ui/Badge";
import type { ReviewsContext } from "./Layout";

export default function ReviewsBenchmarks() {
  const { snap } = useOutletContext<ReviewsContext>();

  const themesTable = table("Review themes", "Recurring topics extracted from review text",
    [{ label: "Theme", align: "left" }, { label: "Sentiment", align: "left" }, { label: "Mentions", align: "right" }, { label: "Share of reviews", align: "right" }, { label: "Change", align: "right" }],
    snap.reviewThemes.map((t: any) => ({ cells: [
      cell(t.theme), cell(t.sentiment, { tone: sentimentTone(t.sentiment) }),
      cell(t.mentions.toLocaleString(), { align: "right" }),
      cell(pct(t.share), { align: "right", strong: true }),
      cell(delta(t.delta, " pts"), { align: "right", color: deltaColor(t.delta) }),
    ] })));

  return <DataTable t={themesTable} />;
}
