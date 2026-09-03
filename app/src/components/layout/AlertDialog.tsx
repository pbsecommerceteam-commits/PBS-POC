import { useUi } from "../../context/UiContext";
import { useFilters } from "../../context/FiltersContext";
import { alertChannels, alertFrequencies, alertScopes, alertTypes } from "../../data/mockData";

export function AlertDialog() {
  const { alertOpen, closeAlert, alertDraft, setAlertDraft, alertError, saveAlert } = useUi();
  const { retailers } = useFilters();
  if (!alertOpen) return null;

  const type = alertTypes.find((t) => t.id === alertDraft.type) || alertTypes[0];
  const scopeName = alertScopes.find((s) => s.id === alertDraft.scope)?.name;
  const retailerName = retailers.find((r) => r.id === alertDraft.retailer)?.name;
  const preview = `${type.condition} ${alertDraft.threshold || "—"}${type.unit} for ${(scopeName || "the portfolio").toLowerCase()} at ${retailerName} — ${alertDraft.frequency.toLowerCase()}, ${alertDraft.channel.toLowerCase()}.`;

  return (
    <div className="sl-modal-backdrop sl-fade-in" onClick={closeAlert} style={{ alignItems: "center" }}>
      <div className="sl-modal sl-pop-in" onClick={(e) => e.stopPropagation()}>
        <div className="sl-modal__header">
          <div>
            <div className="sl-modal__title">Create alert</div>
            <div className="sl-modal__subtitle">Get notified automatically when a metric crosses a threshold</div>
          </div>
          <button className="sl-modal__close" onClick={closeAlert} aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"></path></svg>
          </button>
        </div>
        <div className="sl-modal__body">
          <div className="field">
            <label>Alert type</label>
            <select className="input" value={alertDraft.type} onChange={(e) => {
              const t = alertTypes.find((x) => x.id === e.target.value);
              setAlertDraft({ type: e.target.value, threshold: t ? t.preset : alertDraft.threshold });
            }}>
              {alertTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Product or category</label>
            <select className="input" value={alertDraft.scope} onChange={(e) => setAlertDraft({ scope: e.target.value })}>
              {alertScopes.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="field">
              <label>Retailer</label>
              <select className="input" value={alertDraft.retailer} onChange={(e) => setAlertDraft({ retailer: e.target.value })}>
                {retailers.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Threshold{type.unit ? ` (${type.unit})` : ""}</label>
              <input className="input" type="number" value={alertDraft.threshold} onChange={(e) => setAlertDraft({ threshold: e.target.value })} />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="field">
              <label>Frequency</label>
              <select className="input" value={alertDraft.frequency} onChange={(e) => setAlertDraft({ frequency: e.target.value })}>
                {alertFrequencies.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Notification method</label>
              <select className="input" value={alertDraft.channel} onChange={(e) => setAlertDraft({ channel: e.target.value })}>
                {alertChannels.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="sl-muted" style={{ fontSize: 12.5, lineHeight: 1.55, background: "var(--surface-secondary)", borderRadius: "var(--radius-sm)", padding: "10px 12px" }}>{preview}</div>
          {alertError && <div style={{ fontSize: 12.5, color: "var(--status-critical-fg)" }}>{alertError}</div>}
        </div>
        <div className="sl-modal__actions">
          <button className="btn btn-secondary" onClick={closeAlert}>Cancel</button>
          <button className="btn btn-primary" onClick={saveAlert}>Create alert</button>
        </div>
      </div>
    </div>
  );
}
