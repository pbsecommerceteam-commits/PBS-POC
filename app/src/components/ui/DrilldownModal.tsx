import { Fragment, useState } from "react";
import { InfoTip } from "./InfoTip";
import type { Cell, TableConfig } from "../../lib/format";

export interface DrillRow {
  cells: Cell[];
  /** Optional per-row expandable breakdown -- e.g. the real day-by-day
   *  buy-box-holder or price series behind this row's summary number.
   *  Rows without this render as plain, non-expandable rows; DrilldownModal
   *  only adds the toggle column at all when at least one row in the table
   *  has one. */
  detail?: { cols: string[]; rows: string[][] };
}

export interface DrillTableConfig extends Omit<TableConfig, "rows"> {
  rows: DrillRow[];
}

/** A KPI tile's "which SKUs" drill-down -- same table() / cell() shape as
 *  DataTable (so a page can build its rows with the exact same helpers),
 *  just rendered inside the shared modal chrome instead of a page-anchored
 *  Card, since a KPI number needs an on-demand list rather than a
 *  permanent section on the page. Unlike DataTable, text is never
 *  truncated here -- a modal opened specifically to answer "which SKUs"
 *  shouldn't then hide the answer behind an ellipsis. */
export function DrilldownModal({ t, onClose }: { t: DrillTableConfig; onClose: () => void }) {
  const [expanded, setExpanded] = useState<number | null>(null);
  const hasDetail = t.rows.some((r) => r.detail);

  return (
    <div className="sl-modal-backdrop sl-fade-in" onClick={onClose} style={{ alignItems: "center" }}>
      <div className="sl-modal sl-modal--wide sl-pop-in" onClick={(e) => e.stopPropagation()}>
        <div className="sl-modal__header">
          <div>
            <div className="sl-modal__title" style={{ display: "flex", alignItems: "center", gap: 6 }}>{t.title}{t.info && <InfoTip text={t.info} />}</div>
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
                <thead><tr>
                  {t.cols.map((c, i) => <th key={i} style={{ textAlign: c.align }}>{c.label}</th>)}
                  {hasDetail && <th style={{ textAlign: "center" }}>Dates</th>}
                </tr></thead>
                <tbody>
                  {t.rows.map((r, ri) => (
                    <Fragment key={ri}>
                      <tr className="sl-row">
                        {r.cells.map((c, ci) => (
                          <td key={ci} style={{ textAlign: c.align, whiteSpace: "normal", overflow: "visible", textOverflow: "clip", maxWidth: "none" }}>
                            <span
                              onClick={c.onClick ? (e) => { e.stopPropagation(); c.onClick!(); } : undefined}
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
                        {hasDetail && (
                          <td style={{ textAlign: "center" }}>
                            {r.detail ? (
                              <button className="btn btn-ghost" onClick={() => setExpanded(expanded === ri ? null : ri)} style={{ fontSize: 11.5, padding: "4px 9px", minHeight: "auto" }}>
                                {expanded === ri ? "Hide dates" : "View dates"}
                              </button>
                            ) : <span className="sl-faint">—</span>}
                          </td>
                        )}
                      </tr>
                      {expanded === ri && r.detail && (
                        <tr>
                          <td colSpan={r.cells.length + 1} style={{ padding: 0, background: "var(--surface-secondary)" }}>
                            <div style={{ padding: "10px 14px", maxHeight: 260, overflowY: "auto" }}>
                              <table className="sl-table" style={{ fontSize: 12.5 }}>
                                <thead><tr>{r.detail.cols.map((c, i) => <th key={i} style={{ textAlign: i === 0 ? "left" : "center" }}>{c}</th>)}</tr></thead>
                                <tbody>
                                  {r.detail.rows.map((row, rri) => (
                                    <tr key={rri}>
                                      {row.map((v, vi) => <td key={vi} style={{ textAlign: vi === 0 ? "left" : "center", whiteSpace: "normal", overflow: "visible", textOverflow: "clip", maxWidth: "none" }}>{v}</td>)}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
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
