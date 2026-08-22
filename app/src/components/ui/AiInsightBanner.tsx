import type { ReactNode } from "react";

/** Shelfline's signature treatment for AI-authored reasoning — the violet
 *  "intelligence" accent, reserved for narrated analysis (diagnosing a
 *  sales move, explaining an anomaly) rather than plain detected-signal
 *  facts. Deliberately used sparingly: most of the app's insight surfaces
 *  (Overview's Key Insights, opportunity cards) stay on the neutral/teal
 *  analytics palette, so violet keeps meaning "this was reasoned, not just
 *  measured" wherever it appears. */
export function AiInsightBanner({ eyebrow, children, action }: {
  eyebrow?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="sl-intelligence" style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
      <span className="sl-intelligence__badge">
        <span aria-hidden style={{ fontSize: 13 }}>✦</span>
        {eyebrow || "Shelfline Intelligence"}
      </span>
      <div style={{ fontSize: 13.5, lineHeight: 1.6, color: "var(--text-primary)" }}>{children}</div>
      {action}
    </div>
  );
}
