import { Card } from "./Card";
import { Badge, type BadgeTone } from "./Badge";

/** A ranked, actionable finding — shown on Digital Shelf ("Shelf
 *  Opportunities") and Sales & Share ("Commercial Opportunities"). Clicking
 *  the CTA scopes the product table below to whatever it affects. */
export function OpportunityCard({ impact, impactTone, count, title, problem, why, action, cta, active, showEvidenceLabel, onGo }: {
  impact: string;
  impactTone: BadgeTone;
  count: string;
  title: string;
  problem: string;
  why: string;
  action: string;
  cta: string;
  active?: boolean;
  showEvidenceLabel?: boolean;
  onGo: () => void;
}) {
  return (
    <Card padding="18px 20px" selected={active} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <Badge tone={impactTone}>{impact}</Badge>
        <span className="sl-faint" style={{ fontSize: 12 }}>{count}</span>
      </div>
      <div style={{ fontWeight: 600, fontSize: 15, lineHeight: 1.3 }}>{title}</div>
      {showEvidenceLabel ? (
        <div>
          <div className="sl-faint" style={{ fontSize: 11, marginBottom: 3 }}>Evidence</div>
          <div style={{ fontSize: 13, lineHeight: 1.55 }}>{problem}</div>
        </div>
      ) : (
        <div style={{ fontSize: 13, lineHeight: 1.55 }}>{problem}</div>
      )}
      <div className="sl-muted" style={{ fontSize: 12.5, lineHeight: 1.55, flex: 1 }}>{why}</div>
      <div style={{ paddingTop: 10, borderTop: "1px solid var(--border-subtle)" }}>
        <div className="sl-faint" style={{ fontSize: 11, marginBottom: 3 }}>Recommended action</div>
        <div style={{ fontSize: 13, lineHeight: 1.55 }}>{action}</div>
      </div>
      <button className="btn btn-ghost" onClick={onGo} style={{ alignSelf: "flex-start", paddingLeft: 0, fontSize: 12.5 }}>{cta}</button>
    </Card>
  );
}
