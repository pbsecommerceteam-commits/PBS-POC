import { useOutletContext } from "react-router-dom";
import { KpiCard } from "../../components/ui/KpiCard";
import { DataTable } from "../../components/table/DataTable";
import { Card } from "../../components/ui/Card";
import { InfoTip } from "../../components/ui/InfoTip";
import { kpiCard, cell, table } from "../../lib/format";
import { spark } from "../../lib/charts";
import type { ProductDetailContext } from "./Layout";

export default function ProductContent() {
  const { p, t, labels, detail } = useOutletContext<ProductDetailContext>();

  const contentKpi = { id: "content", label: "Content Completeness", unit: "%", value: p.contentScore, target: 95, delta: 0, spark: t.stock.map((_v: number, i: number) => Math.round(p.contentScore - 4 + (i / labels.length) * 4)), labels };

  const contentChecklistTable = table("Content checklist", "Requirement-level detail behind the content score",
    [{ label: "Requirement", align: "left" }, { label: "Status", align: "left" }],
    detail.contentBreakdown.map((c: any) => ({ cells: [
      cell(c.name),
      cell(c.pass ? "Pass" : "Fix needed", { tone: c.pass ? "positive" : "warning" }),
    ] })),
    "9 equally-weighted binary checks (~11.1% each) -- Content Score is simply (checks passing ÷ 9) × 100.");

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,238px),1fr))", gap: "var(--app-gap)" }}>
        <KpiCard k={kpiCard(contentKpi, spark)} />
      </div>

      <Card padding="20px 22px">
        <div className="sl-eyebrow" style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
          Current listing content
          <InfoTip text="The real crawled title, description and bullets exactly as they exist on the live retailer listing -- what the Content checklist below is scored against." />
        </div>
        <div style={{ marginBottom: 16 }}>
          <div className="sl-muted" style={{ fontSize: 12.5 }}>Title ({p.titleLength} chars)</div>
          <div style={{ fontSize: 14, fontWeight: 500, marginTop: 4, lineHeight: 1.4 }}>{p.name}</div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <div className="sl-muted" style={{ fontSize: 12.5 }}>Description ({p.descriptionLength} chars)</div>
          <div style={{ fontSize: 13.5, marginTop: 4, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{p.descriptionText || <span className="sl-faint">— none crawled</span>}</div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <div className="sl-muted" style={{ fontSize: 12.5 }}>Bullet points ({p.bulletCount})</div>
          {p.bulletsText && p.bulletsText.length > 0 ? (
            <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
              {p.bulletsText.map((b: string, i: number) => <li key={i} style={{ fontSize: 13.5, marginBottom: 4, lineHeight: 1.4 }}>{b}</li>)}
            </ul>
          ) : <div className="sl-faint" style={{ fontSize: 13, marginTop: 4 }}>— none crawled</div>}
        </div>
        {p.variations && p.variations.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div className="sl-muted" style={{ fontSize: 12.5 }}>Variations ({p.variations.length})</div>
            <div style={{ fontSize: 13, marginTop: 4, lineHeight: 1.5 }}>{p.variations.join(", ")}</div>
          </div>
        )}
        <div style={{ display: "flex", gap: 28, flexWrap: "wrap", paddingTop: 4 }}>
          <div><div className="sl-muted" style={{ fontSize: 12.5 }}>Images</div><div style={{ fontWeight: 600, fontSize: 15, marginTop: 2 }}>{p.imageCount}</div></div>
          <div><div className="sl-muted" style={{ fontSize: 12.5 }}>Videos</div><div style={{ fontWeight: 600, fontSize: 15, marginTop: 2 }}>{p.videoCount}</div></div>
          <div><div className="sl-muted" style={{ fontSize: 12.5 }}>Enhanced content</div><div style={{ fontWeight: 600, fontSize: 15, marginTop: 2 }}>{p.enhancedContent ? "Yes" : "No"}</div></div>
        </div>
      </Card>

      <DataTable t={contentChecklistTable} />
    </>
  );
}
