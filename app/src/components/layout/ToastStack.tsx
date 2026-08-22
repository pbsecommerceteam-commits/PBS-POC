import { useUi } from "../../context/UiContext";

export function ToastStack() {
  const { toasts } = useUi();
  return (
    <div style={{ position: "fixed", bottom: 22, right: 24, zIndex: 80, display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end", pointerEvents: "none" }}>
      {toasts.map((t) => (
        <div key={t.id} className="sl-panel sl-toast" style={{ padding: "11px 15px", display: "flex", alignItems: "center", gap: 10, maxWidth: 360 }}>
          <span style={{ width: 20, height: 20, flex: "none", borderRadius: "50%", background: "var(--status-positive-bg)", display: "grid", placeItems: "center" }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--status-positive-fg)" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"></path></svg>
          </span>
          <span style={{ fontSize: 13 }}>{t.text}</span>
        </div>
      ))}
    </div>
  );
}
