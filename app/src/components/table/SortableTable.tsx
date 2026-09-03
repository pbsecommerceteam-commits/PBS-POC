import type { ReactNode } from "react";

export interface Column<T> {
  key: string;
  label: string;
  align?: "left" | "right";
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
 *  centralized here instead of repeated per page. */
export function SortableTable<T>({ columns, rows, sortKey, sortDir, onSort, onRowClick, rowKey }: {
  columns: Column<T>[];
  rows: T[];
  sortKey?: string;
  sortDir?: "asc" | "desc";
  onSort?: (key: string) => void;
  onRowClick?: (row: T) => void;
  rowKey: (row: T) => string;
}) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table className="sl-table">
        <thead>
          <tr>
            {columns.map((c) => {
              const sorted = sortKey === c.key;
              return (
                <th
                  key={c.key}
                  className={(c.sortable ? "is-sortable" : "") + (sorted ? " is-sorted" : "")}
                  style={{ textAlign: c.align, minWidth: c.minWidth }}
                  onClick={c.sortable && onSort ? () => onSort(c.key) : undefined}
                >
                  {c.label}
                  {sorted && <span className="sl-sort-caret">{sortDir === "asc" ? "▲" : "▼"}</span>}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr className={"sl-row" + (onRowClick ? " is-clickable" : "")} key={rowKey(row)} onClick={onRowClick ? () => onRowClick(row) : undefined}>
              {columns.map((c) => (
                <td key={c.key} style={{ textAlign: c.align }}>{c.render(row)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
