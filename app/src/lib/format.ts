/** Shared display formatters — ported from the prototype's Component methods
 *  (cell/table/pct/delta/deltaColor/money/kpiCard). Kept as plain functions
 *  so any component can format a raw metric consistently. Status tone
 *  mapping (stock/opportunity/growth/sentiment) lives in components/ui/Badge. */
import type { BadgeTone } from "../components/ui/Badge";
import type { Column } from "../components/table/SortableTable";

/** RFC4180-ish quoting for one CSV cell -- the one escaping rule every CSV
 *  builder below shares. */
function csvCell(v: unknown): string {
  const s = String(v == null ? "" : v);
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

/** Generic header+rows -> CSV string. The primitive every export in the
 *  app builds on, so a new export shape never has to re-implement quoting. */
export function rowsToCsv(headers: string[], rows: Array<Array<string | number>>): string {
  return [headers.map(csvCell).join(","), ...rows.map((r) => r.map(csvCell).join(","))].join("\n");
}

/** Turns whatever `Column<T>[]` a page is currently showing (already
 *  filtered to the visible/ordered subset it wants) into a CSV string,
 *  using each column's `csv` extractor -- so an export is always exactly
 *  the columns + rows the page had on screen when Export was clicked,
 *  never a fixed generic shape. Columns with no `csv` extractor are
 *  skipped rather than exported blank. */
export function columnsToCsv<T>(rows: T[], columns: Column<T>[]): string {
  const withCsv = columns.filter((c): c is Column<T> & { csv: (row: T) => string | number | null | undefined } => !!c.csv);
  return rowsToCsv(withCsv.map((c) => c.label), rows.map((row) => withCsv.map((c) => c.csv(row) ?? "")));
}

/** Turns a chart's raw labels + series into a downloadable CSV -- the same
 *  x-axis labels the chart itself renders, one column per series (and an
 *  optional flat reference column, e.g. a target/MAP price line), so the
 *  export always matches exactly what's on screen. */
export function seriesToCsv(labels: string[], series: Array<{ name: string; values: number[] }>, extra?: { name: string; value: number }, xLabel = "Date"): string {
  const headers = [xLabel, ...series.map((s) => s.name), ...(extra ? [extra.name] : [])];
  const rows = labels.map((l, i) => [l, ...series.map((s) => s.values[i]), ...(extra ? [extra.value] : [])]);
  return rowsToCsv(headers, rows);
}

/** The one Blob-download mechanics every CSV export in the app uses --
 *  centralized so a chart's "Export" button and a page's "Export" button
 *  don't each redefine the same six lines. */
export function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

export interface Cell {
  text: string;
  sub: string;
  align: "left" | "right" | "center";
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

export function cell(text: string, o: { sub?: string; align?: "left" | "right" | "center"; tone?: BadgeTone; strong?: boolean; color?: string; wrap?: boolean; onClick?: () => void } = {}): Cell {
  return {
    text, sub: o.sub || "", align: o.align || "left", tone: o.tone,
    font: o.strong ? "var(--font-heading)" : "var(--font-body)",
    size: o.strong ? "15px" : "13.5px", color: o.color || "inherit", wrap: o.wrap, onClick: o.onClick,
  };
}

export interface TableConfig {
  title: string;
  subtitle: string;
  cols: Array<{ label: string; align?: "left" | "right" | "center"; minWidth?: number }>;
  rows: Array<{ cells: Cell[] }>;
  /** Optional "what is this" hover hint rendered next to the title (see
   *  InfoTip) -- not every table needs one, so callers opt in per-table. */
  info?: string;
}

export function table(title: string, subtitle: string, cols: TableConfig["cols"], rows: TableConfig["rows"], info?: string): TableConfig {
  return { title, subtitle, cols, rows, info };
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

/** "What does this actually mean" hover text, keyed by KPI id -- one place
 *  to maintain instead of every KpiCard call site across every page, since
 *  the same id (e.g. "content", "pidx", "buybox") is reused identically
 *  everywhere it appears. Every claim here reflects this app's real data
 *  derivation (see mockData.ts/build_mock_data.py), not a generic label. */
export const KPI_INFO: Record<string, string> = {
  sos: "Real Share of Search across your tracked keywords -- a genuinely small % (real crawl finding), not the old ~90% scale. Backend-only, not shown on any page.",
  instock: "Real % of tracked days each SKU was in stock, pooled across the current filter scope.",
  pidx: "Real average selling price, pooled from raw daily crawl prices across the period (or the exact scoped value under a custom date range).",
  content: "Real Content Completeness -- average of a 9-check binary rubric (title, images, videos, bullets, description, rating, enhanced content) evaluated against each product's latest crawled listing.",
  buybox: "Real % of tracked days your own listing (not a 3rd-party seller) held the buy box.",
  rating: "Real average star rating across tracked SKUs, weighted by product.",
  oos: "Count of tracked SKUs currently out of stock in this scope.",
  avgcoverage: "Real average Keyword Coverage (of 10 tracked keywords) across tracked SKUs -- kept for backend use, not shown on any page.",
  reviews: "Real crawled review count -- summed across tracked SKUs on portfolio pages, or this SKU's own total on its Product Detail page.",
  sales: "Illustrative estimated sales -- no real transaction/units-sold data exists in this crawl; not shown on any page.",
  growth: "Illustrative sales growth -- derived from the illustrative sales estimate above, not real transaction data; not shown on any page.",
  share: "Illustrative market share -- no real competitor sales data exists to compute an actual share against; not shown on any page.",
  catgrowth: "Illustrative category growth benchmark; not shown on any page.",
  issues: "Count of tracked SKUs currently scoring under 80% on Content Completeness.",
};

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
  sparkW: number;
  /** One entry per spark point, in the same order as k.spark, for the
   *  card's hover tooltip -- label is the point's date (empty if the
   *  caller had none), value is formatted the same way as valueText. */
  sparkPoints: Array<{ x: number; y: number; label: string; value: string }>;
  /** "What is this" hover hint for KpiCard's InfoTip, looked up from
   *  KPI_INFO by id -- undefined (no icon shown) for any id not in the map. */
  info?: string;
}

/** Turns a raw KPI metric (value/delta/target/spark) into everything the
 *  KpiCard component renders. Ported verbatim from Component#kpiCard. */
export function kpiCard(k: { id: string; label: string; unit: string; value: number; delta: number; target: number; spark: number[]; labels?: string[] }, sparkFn: (vals: number[]) => { d: string; area: string; points: Array<{ x: number; y: number }>; W: number }): KpiVM {
  const inverted = ["oos", "rank", "gap", "issues", "pidx"].indexOf(k.id) >= 0;
  const digits = k.id === "rating" || k.id === "pidx" ? 2 : (k.id === "rank" || k.id === "avgcoverage" || k.unit === "%") ? 1 : 0;
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
  const fmtPoint = (v: number) => (isMoney ? money(v)
    : k.id === "pidx" ? "$" + v.toFixed(2)
    : k.id === "reviews" ? Math.round(v).toLocaleString()
    : v.toFixed(digits).replace("-", "−")) + (isMoney || k.id === "pidx" ? "" : k.unit);
  const labels = k.labels || [];
  const sparkPoints = sp.points.map((pt, i) => ({ x: pt.x, y: pt.y, label: labels[i] || "", value: fmtPoint(k.spark[i]) }));
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
    sparkD: sp.d, sparkArea: sp.area, sparkW: sp.W, sparkPoints,
    info: KPI_INFO[k.id],
  };
}
