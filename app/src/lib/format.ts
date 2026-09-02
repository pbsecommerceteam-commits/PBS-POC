/** Shared display formatters — ported from the prototype's Component methods
 *  (cell/table/pct/delta/deltaColor/money/kpiCard). Kept as plain functions
 *  so any component can format a raw metric consistently. Status tone
 *  mapping (stock/opportunity/growth/sentiment) lives in components/ui/Badge. */
import type { BadgeTone } from "../components/ui/Badge";

export interface Cell {
  text: string;
  sub: string;
  align: "left" | "right";
  tone?: BadgeTone;
  font: string;
  size: string;
  color: string;
}

export function cell(text: string, o: { sub?: string; align?: "left" | "right"; tone?: BadgeTone; strong?: boolean; color?: string } = {}): Cell {
  return {
    text, sub: o.sub || "", align: o.align || "left", tone: o.tone,
    font: o.strong ? "var(--font-heading)" : "var(--font-body)",
    size: o.strong ? "15px" : "13.5px", color: o.color || "inherit",
  };
}

export interface TableConfig {
  title: string;
  subtitle: string;
  cols: Array<{ label: string; align?: "left" | "right" }>;
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
  const digits = k.id === "rating" ? 2 : (k.id === "rank" || k.id === "pidx" || k.unit === "%") ? 1 : 0;
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
  /* Price Index has no target -- it's a read of current pricing against
     this period's own average, not a goal to hit, so it gets no status
     band and no "Target ___" line, unlike every other KPI here. */
  const statusText = k.id === "pidx" ? ""
    : growthKind
    ? (k.value < 0 ? "Declining" : diff >= 0 ? "Ahead of benchmark" : diff >= -1 ? "Near benchmark" : "Behind benchmark")
    : k.id === "sales" ? (k.delta >= 0 ? "Above previous period" : "Below previous period")
    : ratio >= 1 ? "On target" : ratio >= 0.95 ? "Near target" : "Below target";
  const isMoney = k.id === "sales";
  return {
    label: k.label, unit: k.unit,
    valueText: isMoney ? money(k.value)
      : k.id === "reviews" ? k.value.toLocaleString()
      : k.value.toFixed(digits).replace("-", "−"),
    deltaText: isMoney
      ? (up ? "↑ " : "↓ ") + money(Math.abs(k.delta))
      : (k.delta === 0 ? "→ " : up ? "↑ " : "↓ ") + Math.abs(k.delta).toFixed(digits) + (k.unit === "%" ? " pts" : ""),
    deltaColor: deltaColor(good ? 1 : -1),
    statusText,
    statusColor: ratio >= 1 ? "var(--color-accent-800)"
      : ratio >= 0.95 ? "var(--color-accent-500)" : "var(--color-neutral-600)",
    goalText: k.id === "reviews" ? "Target 20k"
      : k.id === "pidx" ? "vs. this period's average"
      : isMoney ? "Previous " + money(k.value - k.delta)
      : k.id === "catgrowth" ? "Portfolio " + k.target.toFixed(1) + "%"
      : "Target " + k.target + k.unit,
    sparkD: sp.d, sparkArea: sp.area,
  };
}
