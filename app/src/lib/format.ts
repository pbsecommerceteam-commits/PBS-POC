/** Shared display formatters — ported from the prototype's Component methods
 *  (cell/table/pct/delta/deltaColor/money/kpiCard). Kept as plain functions
 *  so any component can format a raw metric consistently. Status tone
 *  mapping (stock/opportunity/growth/sentiment) lives in components/ui/Badge. */
import type { BadgeTone } from "../components/ui/Badge";
import type { Column } from "../components/table/SortableTable";

/** Turns whatever `Column<T>[]` a page is currently showing (already
 *  filtered to the visible/ordered subset it wants) into a CSV string,
 *  using each column's `csv` extractor -- so an export is always exactly
 *  the columns + rows the page had on screen when Export was clicked,
 *  never a fixed generic shape. Columns with no `csv` extractor are
 *  skipped rather than exported blank. */
export function columnsToCsv<T>(rows: T[], columns: Column<T>[]): string {
  const withCsv = columns.filter((c): c is Column<T> & { csv: (row: T) => string | number | null | undefined } => !!c.csv);
  const cell = (v: unknown) => {
    const s = String(v == null ? "" : v);
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  const lines = [withCsv.map((c) => cell(c.label)).join(",")]
    .concat(rows.map((row) => withCsv.map((c) => cell(c.csv(row))).join(",")));
  return lines.join("\n");
}

export interface Cell {
  text: string;
  sub: string;
  align: "left" | "right";
  tone?: BadgeTone;
  font: string;
  size: string;
  color: string;
  /** Opt out of DataTable's default single-line ellipsis truncation for
   *  this cell -- e.g. a brand/product name column where cutting the
   *  text off is worse than the row occasionally running two lines. */
  wrap?: boolean;
  /** Makes this cell a link-styled click target (e.g. a brand's score,
   *  drilling into the products behind it) instead of plain text. */
  onClick?: () => void;
}

export function cell(text: string, o: { sub?: string; align?: "left" | "right"; tone?: BadgeTone; strong?: boolean; color?: string; wrap?: boolean; onClick?: () => void } = {}): Cell {
  return {
    text, sub: o.sub || "", align: o.align || "left", tone: o.tone,
    font: o.strong ? "var(--font-heading)" : "var(--font-body)",
    size: o.strong ? "15px" : "13.5px", color: o.color || "inherit", wrap: o.wrap, onClick: o.onClick,
  };
}

export interface TableConfig {
  title: string;
  subtitle: string;
  cols: Array<{ label: string; align?: "left" | "right"; minWidth?: number }>;
  rows: Array<{ cells: Cell[] }>;
}

export function table(title: string, subtitle: string, cols: TableConfig["cols"], rows: TableConfig["rows"]): TableConfig {
  return { title, subtitle, cols, rows };
}

export function pct(v: number, d?: number) {
  return v.toFixed(d == null ? 1 : d) + "%";
}

export function delta(v: number, unit?: string) {
  return (v === 0 ? "→ " : v > 0 ? "↑ " : "↓ ") + Math.abs(v).toFixed(1) + (unit || "");
}

export function deltaColor(v: number, invert?: boolean) {
  if (v === 0) return "var(--text-faint)";
  return (invert ? v <= 0 : v >= 0) ? "var(--status-positive-fg)" : "var(--status-negative-fg)";
}

export function money(v: number) {
  const a = Math.abs(v);
  if (a >= 1e6) return "$" + (v / 1e6).toFixed(2) + "M";
  if (a >= 1e3) return "$" + Math.round(v / 1e3) + "K";
  return "$" + Math.round(v);
}

export function signedMoney(v: number) {
  return (v >= 0 ? "+" : "−") + money(Math.abs(v));
}

export function signedPct(v: number) {
  return (v >= 0 ? "+" : "−") + Math.abs(v).toFixed(1) + "%";
}

export interface KpiVM {
  label: string;
  unit: string;
  valueText: string;
  deltaText: string;
  deltaColor: string;
  statusText: string;
  statusColor: string;
  goalText: string;
  sparkD: string;
  sparkArea: string;
}

/** Turns a raw KPI metric (value/delta/target/spark) into everything the
 *  KpiCard component renders. Ported verbatim from Component#kpiCard. */
export function kpiCard(k: { id: string; label: string; unit: string; value: number; delta: number; target: number; spark: number[] }, sparkFn: (vals: number[]) => { d: string; area: string }): KpiVM {
  const inverted = ["oos", "rank", "gap", "issues", "pidx"].indexOf(k.id) >= 0;
  const digits = k.id === "rating" || k.id === "pidx" ? 2 : (k.id === "rank" || k.unit === "%") ? 1 : 0;
  const up = k.delta >= 0;
  const good = inverted ? !up : up;
  const sp = sparkFn(k.spark);
  const growthKind = k.id === "growth" || k.id === "catgrowth";
  const diff = k.value - k.target;
  const ratio = growthKind
    ? (k.value < 0 ? 0.5 : diff >= 0 ? 1 : diff >= -1 ? 0.96 : 0.5)
    : inverted
    ? (k.value <= k.target ? 1.2 : k.target === 0 ? 0.5 : k.target / Math.max(k.value, 0.01))
    : k.value / (k.target || 1);
  /* Average Price has no target -- it's a real dollar figure, not a goal
     to hit, so it gets no status band and no "Target ___" line, unlike
     every other KPI here. */
  const statusText = k.id === "pidx" ? ""
    : growthKind
    ? (k.value < 0 ? "Declining" : diff >= 0 ? "Ahead of benchmark" : diff >= -1 ? "Near benchmark" : "Behind benchmark")
    : k.id === "sales" ? (k.delta >= 0 ? "Above previous period" : "Below previous period")
    : ratio >= 1 ? "On target" : ratio >= 0.95 ? "Near target" : "Below target";
  const isMoney = k.id === "sales";
  return {
    label: k.label, unit: k.unit,
    valueText: isMoney ? money(k.value)
      : k.id === "pidx" ? "$" + k.value.toFixed(2)
      : k.id === "reviews" ? k.value.toLocaleString()
      : k.value.toFixed(digits).replace("-", "−"),
    deltaText: isMoney
      ? (up ? "↑ " : "↓ ") + money(Math.abs(k.delta))
      : k.id === "pidx" ? (k.delta === 0 ? "→ " : up ? "↑ " : "↓ ") + "$" + Math.abs(k.delta).toFixed(2)
      : (k.delta === 0 ? "→ " : up ? "↑ " : "↓ ") + Math.abs(k.delta).toFixed(digits) + (k.unit === "%" ? " pts" : ""),
    deltaColor: deltaColor(good ? 1 : -1),
    statusText,
    statusColor: ratio >= 1 ? "var(--color-accent-800)"
      : ratio >= 0.95 ? "var(--color-accent-500)" : "var(--color-neutral-600)",
    goalText: k.id === "reviews" ? "Target 20k"
      : k.id === "pidx" ? "Previous $" + (k.value - k.delta).toFixed(2)
      : isMoney ? "Previous " + money(k.value - k.delta)
      : k.id === "catgrowth" ? "Portfolio " + k.target.toFixed(1) + "%"
      : "Target " + k.target + k.unit,
    sparkD: sp.d, sparkArea: sp.area,
  };
}
