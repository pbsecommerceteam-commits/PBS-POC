import { Card } from "./Card";
import { Badge, type BadgeTone } from "./Badge";

const ICONS: Record<string, string> = {
  positive: "M3 17l6-6 4 4 7-7",
  warning: "M12 8v5M12 16.5v.5M10.3 4.2L2.6 18a1.6 1.6 0 001.4 2.4h16a1.6 1.6 0 001.4-2.4L13.7 4.2a1.6 1.6 0 00-2.8 0z",
  critical: "M12 8v5M12 16.5v.5M10.3 4.2L2.6 18a1.6 1.6 0 001.4 2.4h16a1.6 1.6 0 001.4-2.4L13.7 4.2a1.6 1.6 0 00-2.8 0z",
  neutral: "M12 16v-5M12 8.5v.5M12 3a9 9 0 100 18 9 9 0 000-18z",
};
const LABELS: Record<string, string> = { positive: "Improving", warning: "Needs attention", critical: "Urgent", neutral: "Watch" };
const TONE: Record<string, BadgeTone> = { positive: "positive", warning: "warning", critical: "critical", neutral: "neutral" };

export interface Insight {
  id: string;
  kind: "positive" | "warning" | "critical" | "neutral";
  title: string;
  body: string;
  action: string;
  target: string;
}

/** A detected signal with a suggested next action — clicking it navigates
 *  to the relevant section, optionally pre-filtering it. */
export function InsightCard({ n, onGo }: { n: Insight; onGo: () => void }) {
  const iconColor = n.kind === "positive" ? "var(--status-positive-fg)" : n.kind === "neutral" ? "var(--text-muted)" : "var(--status-warning-fg)";
  return (
    <Card padding="18px 20px" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <span style={{ width: 30, height: 30, flex: "none", display: "grid", placeItems: "center", borderRadius: "var(--radius-sm)", background: "var(--surface-secondary)", color: iconColor }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"><path d={ICONS[n.kind] || ICONS.neutral}></path></svg>
        </span>
        <Badge tone={TONE[n.kind]}>{LABELS[n.kind]}</Badge>
      </div>
      <div style={{ fontWeight: 600, fontSize: 15, lineHeight: 1.3 }}>{n.title}</div>
      <div className="sl-muted" style={{ fontSize: 13, lineHeight: 1.55, flex: 1 }}>{n.body}</div>
      <button className="btn btn-ghost" onClick={onGo} style={{ alignSelf: "flex-start", paddingLeft: 0, fontSize: 12.5 }}>{n.action} →</button>
    </Card>
  );
}
