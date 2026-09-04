import type { TableConfig } from "../../lib/format";

/** A KPI tile's "which SKUs" drill-down -- same table() / cell() shape as
 *  DataTable (so a page can build its rows with the exact same helpers),
 *  just rendered inside the shared modal chrome instead of a page-anchored
 *  Card, since a KPI number needs an on-demand list rather than a
 *  permanent section on the page. */
export function DrilldownModal({ t, onClose }: { t: TableConfig; onClose: () => void }) {
  return (
    <div className="sl-modal-backdrop sl-fade-in" onClick={onClose} style={{ alignItems: "center" }}>
      <div className="sl-modal sl-modal--wide sl-pop-in" onClick={(e) => e.stopPropagation()}>
        <div className="sl-modal__header">
          <div>
            <div className="sl-modal__title">{t.title}</div>
            <div className="sl-modal__subtitle">{t.subtitle}</div>
          </div>
          <button className="sl-modal__close" onClick={onClose} aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"></path></svg>
          </button>
        </div>
        <div className="sl-modal__body">
          {t.rows.length === 0 ? (
            <div className="sl-muted" style={{ fontSize: 12.5, padding: "8px 0" }}>No SKUs match this view.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="sl-table">
                <thead><tr>{t.cols.map((c, i) => <th key={i} style={{ textAlign: c.align }}>{c.label}</th>)}</tr></thead>
                <tbody>
                  {t.rows.map((r, ri) => (
                    <tr className="sl-row" key={ri}>
                      {r.cells.map((c, ci) => (
                        <td key={ci} style={{ textAlign: c.align }}>
                          <span
                            onClick={c.onClick}
                            style={{
                              fontFamily: c.font, fontSize: c.size, fontWeight: c.font.includes("heading") ? 600 : 400,
                              color: c.onClick ? "var(--color-accent-700)" : c.color,
                              cursor: c.onClick ? "pointer" : undefined,
                              textDecoration: c.onClick ? "underline" : undefined,
                            }}
                          >{c.text}</span>
                          {c.sub && <div className="sl-table-sub">{c.sub}</div>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
