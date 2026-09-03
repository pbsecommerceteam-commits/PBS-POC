import { useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { Card } from "../../components/ui/Card";
import { Badge, opportunityTone } from "../../components/ui/Badge";
import { Tabs } from "../../components/ui/Tabs";
import { Pagination } from "../../components/table/Pagination";
import { spark } from "../../lib/charts";
import { deltaColor } from "../../lib/format";
import type { CompetitorsContext } from "./Layout";

const OPP_TABS: Array<{ id: "All" | "High" | "Medium" | "Low"; label: string }> = [
  { id: "All", label: "All" }, { id: "High", label: "High" }, { id: "Medium", label: "Medium" }, { id: "Low", label: "Low" },
];

export default function CompetitorsKeywords() {
  const { sh } = useOutletContext<CompetitorsContext>();
  const navigate = useNavigate();
  const [kwQuery, setKwQuery] = useState("");
  const [kwOpp, setKwOpp] = useState<"All" | "High" | "Medium" | "Low">("All");
  const [kwPage, setKwPage] = useState(1);
  const [keywordId, setKeywordId] = useState<string | null>(null);

  const kq = kwQuery.trim().toLowerCase();
  const kwAll = sh.keywords.filter((k: any) => (!kq || k.term.includes(kq)) && (kwOpp === "All" || k.opportunity === kwOpp));
  const kwSize = 6;
  const kwPages = Math.max(1, Math.ceil(kwAll.length / kwSize));
  const kwCurrent = Math.min(kwPage, kwPages);
  const kwRows = kwAll.slice((kwCurrent - 1) * kwSize, kwCurrent * kwSize);
  const kwSel = sh.keywords.find((k: any) => k.id === keywordId);

  return (
    <Card padding="20px 22px 14px">
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 16 }}>
        <div><h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Search performance</h3><div className="sl-muted" style={{ fontSize: 12.5, marginTop: 2 }}>{kwAll.length} of {sh.keywords.length} tracked keywords, pulled from the real Share of Search crawl — rank and the "Competitor" column are illustrative</div></div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <input className="input" type="search" placeholder="Search keywords" value={kwQuery} onChange={(e) => { setKwQuery(e.target.value); setKwPage(1); }} style={{ width: 190, minHeight: 34, fontSize: 13 }} />
          <Tabs options={OPP_TABS} value={kwOpp} onChange={(v) => { setKwOpp(v); setKwPage(1); }} size="sm" />
        </div>
      </div>
      {kwSel && (
        <Card padding="14px 16px" style={{ borderColor: "var(--border-accent)", marginBottom: 16, display: "flex", gap: 20, flexWrap: "wrap", alignItems: "flex-start" }}>
          <div style={{ flex: "1 1 260px", minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <span style={{ fontWeight: 600, fontSize: 15 }}>{kwSel.term}</span>
              <button className="btn btn-ghost" onClick={() => setKeywordId(null)} style={{ fontSize: 12 }}>Close</button>
            </div>
            <div className="sl-muted" style={{ fontSize: 12.5, lineHeight: 1.5, marginTop: 3 }}>Rank #{kwSel.rank} · {kwSel.visibility}% visibility · {kwSel.volume.toLocaleString()} monthly searches · {kwSel.competitor} ranks #{kwSel.competitorRank}</div>
            <svg viewBox="0 0 130 30" preserveAspectRatio="none" style={{ width: "100%", height: 32, marginTop: 10, overflow: "visible" }}>
              <path d={spark(kwSel.trend.map((v: number) => 45 - v)).d} fill="none" stroke="var(--color-accent-700)" strokeWidth={1.5} vectorEffect="non-scaling-stroke"></path>
            </svg>
            <div className="sl-faint" style={{ fontSize: 11, marginTop: 4 }}>Rank trajectory — higher is better</div>
          </div>
          <div style={{ flex: "1 1 260px", minWidth: 0 }}>
            <div className="sl-eyebrow" style={{ marginBottom: 6 }}>Your ranking products</div>
            {kwSel.products.map((p: any) => (
              <button key={p.id} className="sl-palette__row" onClick={() => navigate("/product/" + p.id)} style={{ padding: "6px 0" }}>
                <span style={{ flex: 1, textAlign: "left" }}>
                  <span style={{ display: "block", fontSize: 13.5 }}>{p.name}</span>
                  <span className="sl-muted" style={{ fontSize: 11.5 }}>{p.retailerName} · rank #{p.rank}</span>
                </span>
              </button>
            ))}
            {kwSel.products.length === 0 && <div className="sl-muted" style={{ fontSize: 12.5 }}>No tracked SKU currently ranks on this term at the selected retailer.</div>}
          </div>
        </Card>
      )}
      <div style={{ overflowX: "auto" }}>
        <table className="sl-table">
          <thead><tr><th style={{ minWidth: 200 }}>Keyword</th><th style={{ textAlign: "right" }}>Rank</th><th style={{ textAlign: "right" }}>Previous</th><th style={{ textAlign: "right" }}>Change</th><th style={{ textAlign: "right", minWidth: 130 }}>Visibility</th><th style={{ textAlign: "right" }}>Competitor</th><th>Opportunity</th></tr></thead>
          <tbody>
            {kwRows.map((k: any) => (
              <tr className={"sl-row is-clickable" + (keywordId === k.id ? " is-selected" : "")} key={k.id} onClick={() => setKeywordId(keywordId === k.id ? null : k.id)}>
                <td><div className="sl-table-name">{k.term}</div><div className="sl-table-sub">{k.volume.toLocaleString()} searches</div></td>
                <td style={{ textAlign: "right", fontWeight: 600 }}>#{k.rank}</td>
                <td className="sl-muted" style={{ textAlign: "right" }}>#{k.prevRank}</td>
                <td style={{ textAlign: "right", color: deltaColor(k.change) }}>{k.change === 0 ? "—" : (k.change > 0 ? "↑ " : "↓ ") + Math.abs(k.change)}</td>
                <td style={{ textAlign: "right" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 9, justifyContent: "flex-end" }}>
                    <span className="sl-progress-track" style={{ width: 48 }}><span className="sl-progress-fill" style={{ width: k.visibility + "%" }}></span></span>
                    <span>{k.visibility}%</span>
                  </div>
                </td>
                <td style={{ textAlign: "right", whiteSpace: "nowrap" }}><div>#{k.competitorRank}</div><div className="sl-table-sub">{k.competitor}</div></td>
                <td><Badge tone={opportunityTone(k.opportunity)}>{k.opportunity}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {kwAll.length === 0 && <div className="sl-muted" style={{ padding: "24px 4px", fontSize: 13 }}>No keywords match this search or opportunity filter.</div>}
      <Pagination page={kwCurrent} totalPages={kwPages} total={kwAll.length} pageSize={kwSize} onPage={setKwPage} />
    </Card>
  );
}
