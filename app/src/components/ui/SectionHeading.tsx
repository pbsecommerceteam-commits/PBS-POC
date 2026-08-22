/** A quiet section divider — used sparingly between major page groupings
 *  (Diagnostics, Actions) rather than on every label in the page. */
export function SectionHeading({ label, caption }: { label: string; caption: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "4px 0 -8px" }}>
      <span className="sl-eyebrow">{label}</span>
      <span style={{ flex: 1, height: 1, background: "var(--border-subtle)" }}></span>
      <span className="sl-faint" style={{ fontSize: 12 }}>{caption}</span>
    </div>
  );
}
