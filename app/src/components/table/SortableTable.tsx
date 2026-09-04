import { useMemo, type ReactNode } from "react";
import { useColumnWidths } from "../../hooks/useColumnWidths";

export interface Column<T> {
  key: string;
  label: string;
  align?: "left" | "right" | "center";
  minWidth?: number;
  sortable?: boolean;
  render: (row: T) => ReactNode;
  /** Plain-text/number value for CSV export -- `render` returns JSX, which
   *  a CSV cell can't hold, so any column a page wants exportable supplies
   *  this alongside it. Columns without one (e.g. a pure visual/no export
   *  need) are simply left out of an export by the page that builds it. */
  csv?: (row: T) => string | number | null | undefined;
}

/** Shared sort/click wiring for every product-shaped table (Overview,
 *  Digital Shelf, Performance Intelligence, keywords) — each page supplies its own
 *  column render functions for the bespoke cell visuals (progress bars,
 *  badges, deltas), so only the header-sort and row-click plumbing is
 *  centralized here instead of repeated per page. `resizable` and `wrap`
 *  are both opt-in (default off, so every existing table keeps its
 *  current auto-sized, single-line-ellipsis layout): `resizable` lets the
 *  user drag a header's right edge to widen/narrow that column (starting
 *  at its `minWidth`); `wrap` turns off the default single-line
 *  ellipsis-truncation for every cell in this table, letting long content
 *  wrap onto as many lines as it needs instead of cutting off -- rows
 *  then vary in height with their content, which is the point when a
 *  table is meant to show everything rather than stay uniform. */
export function SortableTable<T>({ columns, rows, sortKey, sortDir, onSort, onRowClick, rowKey, resizable, wrap }: {
  columns: Column<T>[];
  rows: T[];
  sortKey?: string;
  sortDir?: "asc" | "desc";
  onSort?: (key: string) => void;
  onRowClick?: (row: T) => void;
  rowKey: (row: T) => string;
  resizable?: boolean;
  wrap?: boolean;
}) {
  const defaults = useMemo(() => Object.fromEntries(columns.map((c) => [c.key, c.minWidth ?? 140])), [columns]);
  const { widths, startResize } = useColumnWidths(defaults);

  return (
    <div style={{ overflowX: "auto" }}>
      <table className="sl-table" style={resizable ? { tableLayout: "fixed" } : undefined}>
        {resizable && (
          <colgroup>
            {columns.map((c) => <col key={c.key} style={{ width: widths[c.key] ?? c.minWidth ?? 140 }} />)}
          </colgroup>
        )}
        <thead>
          <tr>
            {columns.map((c) => {
              const sorted = sortKey === c.key;
              return (
                <th
                  key={c.key}
                  className={(c.sortable ? "is-sortable" : "") + (sorted ? " is-sorted" : "")}
                  style={{ textAlign: c.align, minWidth: resizable ? undefined : c.minWidth }}
                  onClick={c.sortable && onSort ? () => onSort(c.key) : undefined}
                >
                  {c.label}
                  {sorted && <span className="sl-sort-caret">{sortDir === "asc" ? "▲" : "▼"}</span>}
                  {resizable && (
                    <span
                      className="sl-col-resize-handle"
                      onMouseDown={startResize(c.key)}
                      onClick={(e) => e.stopPropagation()}
                      title="Drag to resize"
                      style={{ position: "absolute", right: -3, top: 0, bottom: 0, width: 7, cursor: "col-resize", userSelect: "none" }}
                    />
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr className={"sl-row" + (onRowClick ? " is-clickable" : "")} key={rowKey(row)} onClick={onRowClick ? () => onRowClick(row) : undefined}>
              {columns.map((c) => (
                <td key={c.key} style={wrap ? { textAlign: c.align, whiteSpace: "normal", overflow: "visible", textOverflow: "clip", maxWidth: "none" } : { textAlign: c.align }}>{c.render(row)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
