import { useMemo } from "react";
import { Card } from "../ui/Card";
import { InfoTip } from "../ui/InfoTip";
import type { TableConfig } from "../../lib/format";
import { useColumnWidths } from "../../hooks/useColumnWidths";

/** Generic table for the "cell()-built" tables — content coverage, review
 *  themes, competitors, alert rules, scheduled reports, the Content
 *  Intelligence brand rollup. Each cell already carries its own
 *  alignment/font/color/tag, so this component just lays them out; it
 *  doesn't own sort or filter state because these tables don't need it.
 *  `resizable` is opt-in (default off, so every existing table keeps its
 *  current auto-sized layout) -- when on, each column starts at its
 *  `minWidth` and the user can drag a header's right edge to widen/
 *  narrow it. */
export function DataTable({ t, resizable }: { t: TableConfig; resizable?: boolean }) {
  const defaults = useMemo(() => Object.fromEntries(t.cols.map((c, i) => [String(i), c.minWidth ?? 140])), [t.cols]);
  const { widths, startResize } = useColumnWidths(defaults);

  return (
    <Card padding="20px 22px 8px">
      <h4 style={{ margin: 0, fontSize: 15, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>{t.title}{t.info && <InfoTip text={t.info} />}</h4>
      <div className="sl-muted" style={{ fontSize: 12.5, marginTop: 2, marginBottom: 14 }}>{t.subtitle}</div>
      <div style={{ overflowX: "auto" }}>
        <table className="sl-table" style={resizable ? { tableLayout: "fixed" } : undefined}>
          {resizable && (
            <colgroup>
              {t.cols.map((c, i) => <col key={i} style={{ width: widths[String(i)] ?? c.minWidth ?? 140 }} />)}
            </colgroup>
          )}
          <thead>
            <tr>
              {t.cols.map((c, i) => (
                <th key={i} style={{ textAlign: c.align }}>
                  {c.label}
                  {resizable && (
                    <span
                      className="sl-col-resize-handle"
                      onMouseDown={startResize(String(i))}
                      onClick={(e) => e.stopPropagation()}
                      title="Drag to resize"
                      style={{ position: "absolute", right: -3, top: 0, bottom: 0, width: 7, cursor: "col-resize", userSelect: "none" }}
                    />
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {t.rows.map((r, ri) => (
              <tr className="sl-row" key={ri}>
                {r.cells.map((c, ci) => (
                  <td key={ci} style={c.wrap ? { textAlign: c.align, whiteSpace: "normal", overflow: "visible", textOverflow: "clip", maxWidth: "none" } : { textAlign: c.align }}>
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
    </Card>
  );
}
