/** A small "i" hint icon with a hover/focus tooltip explaining what a KPI,
 *  chart or table actually shows -- pure CSS hover (see .sl-info-tip in
 *  app.css), no state, so it's cheap to sprinkle on every metric across the
 *  app. Keyboard-reachable via tabIndex + :focus-visible, same trigger as
 *  hover so it works without a mouse too. */
export function InfoTip({ text }: { text: string }) {
  return (
    <span className="sl-info-tip" tabIndex={0} role="note" aria-label={text}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9.5"></circle>
        <line x1="12" y1="11" x2="12" y2="16.5"></line>
        <circle cx="12" cy="7.8" r="0.75" fill="currentColor" stroke="none"></circle>
      </svg>
      <span className="sl-info-tip__bubble">{text}</span>
    </span>
  );
}
