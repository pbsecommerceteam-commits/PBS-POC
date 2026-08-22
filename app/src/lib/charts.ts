/** Chart math — ported from the prototype's Component methods (geom, scales,
 *  linePath, spark, hover, lineChart, barChart). Pure functions producing the
 *  exact render config the <ChartCard> component draws as inline SVG, so the
 *  visual output matches the original pixel-for-pixel. The one piece of
 *  state a chart needs (which x-index is hovered) is passed in rather than
 *  owned here, so a page can share one hover slot across several charts
 *  exactly like the original component did with `this.state.hover`. */

export interface HoverState {
  id: string;
  idx: number;
}

export interface SeriesInput {
  name: string;
  values: number[];
  color?: string;
  muted?: boolean;
}

export function geom() {
  return { W: 880, H: 262, L: 48, R: 14, T: 16, B: 30 };
}

export function scales(n: number, lo: number, hi: number, invert?: boolean) {
  const g = geom();
  const x = (i: number) => g.L + (g.W - g.L - g.R) * (n < 2 ? 0 : i / (n - 1));
  const y = (v: number) => {
    const t = (Math.min(Math.max(v, lo), hi) - lo) / (hi - lo || 1);
    return g.T + (g.H - g.T - g.B) * (invert ? t : 1 - t);
  };
  return { x, y, g };
}

export function linePath(vals: number[], x: (i: number) => number, y: (v: number) => number) {
  return vals.map((v, i) => (i ? "L" : "M") + x(i).toFixed(1) + " " + y(v).toFixed(1)).join(" ");
}

export function spark(vals: number[]) {
  const W = 130, H = 30, p = 3;
  const lo = Math.min(...vals), hi = Math.max(...vals), span = hi - lo || 1;
  const x = (i: number) => p + (W - p * 2) * (vals.length < 2 ? 0 : i / (vals.length - 1));
  const y = (v: number) => p + (H - p * 2) * (1 - (v - lo) / span);
  const d = linePath(vals, x, y);
  return { d, area: d + " L " + x(vals.length - 1).toFixed(1) + " " + H + " L " + x(0).toFixed(1) + " " + H + " Z" };
}

function labelStride(n: number) {
  return n > 12 ? 2 : 1;
}

/** One hover model for every chart: hit rects per x index, a guide line and
 *  a tooltip built from the same series the chart draws. */
function buildHover(
  hover: HoverState | null,
  id: string,
  labels: string[],
  x: (i: number) => number,
  step: number,
  rows: Array<{ name: string; values: number[] }>,
  fmt: (v: number) => string,
  onEnter: (idx: number) => void,
) {
  const hits = labels.map((_l, i) => ({
    x: (x(i) - step / 2).toFixed(1), w: step.toFixed(1),
    enter: () => onEnter(i),
  }));
  if (!hover || hover.id !== id) return { hits, guideX: "", tip: null as any };
  const px = x(hover.idx);
  return {
    hits, guideX: px.toFixed(1),
    tip: {
      label: labels[hover.idx],
      left: ((px / 880) * 100).toFixed(2) + "%",
      top: "52px",
      shift: px > 660 ? "-96%" : px < 220 ? "-4%" : "-50%",
      rows: rows.map((r) => ({ name: r.name, value: fmt(r.values[hover.idx]) })),
    },
  };
}

export interface ChartConfig {
  title: string;
  subtitle?: string;
  span: string;
  badge: string;
  modes: Array<{ label: string; cls: string; go: () => void }>;
  series: Array<{ name: string; color: string; width: number; dash: string; legendStyle: string; last: string; d: string; area: string }>;
  bars: Array<{ x: string; w: string; y: string; h: string; fill: string }>;
  legend: ChartConfig["series"];
  points: Array<{ cx: string; cy: string; r: number }>;
  yTicks: Array<{ y: string; ty: string; label: string }>;
  xTicks: Array<{ x: string; label: string; opacity: number }>;
  targetY: string;
  footer: Array<{ label: string; value: string; color: string }>;
  hasFooter: boolean;
  hits: Array<{ x: string; w: string; enter: () => void }>;
  guideX: string;
  tip: { label: string; left: string; top: string; shift: string; rows: Array<{ name: string; value: string }> } | null;
}

export interface LineChartOptions {
  id: string;
  title: string;
  subtitle?: string;
  labels: string[];
  lo: number;
  hi: number;
  ticks: number[];
  fmt?: (v: number) => string;
  series: SeriesInput[];
  previous?: number[];
  target?: number;
  modes?: Array<{ label: string; cls: string; go: () => void }>;
  span?: string;
  badge?: string;
  footer?: Array<{ label: string; value: string; color: string }>;
  hideLegend?: boolean;
  invert?: boolean;
  chartStyle?: "area" | "line";
}

export function lineChart(o: LineChartOptions, hover: HoverState | null, onHoverEnter: (id: string, idx: number) => void): ChartConfig {
  const n = o.labels.length;
  const { x, y, g } = scales(n, o.lo, o.hi, o.invert);
  const fmt = o.fmt || ((v: number) => String(v));
  /* Dedicated chart palette: the primary teal always carries series 0 (the
     most important dataset), later series cycle through muted, distinct
     hues rather than tints of the same color — avoids both a rainbow chart
     and a wash of near-identical blues. */
  const colors = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)", "var(--chart-6)"];
  const filled = o.chartStyle !== "line";
  const drawn = o.series.concat(o.previous ? [{ name: "Previous period", values: o.previous, muted: true }] : []);
  const series = drawn.map((s, i) => {
    const d = linePath(s.values, x, y);
    const emph = !s.muted && i === 0;
    return {
      name: s.name,
      color: s.muted ? "var(--color-neutral-400)" : (s.color || colors[i % colors.length]),
      width: emph ? 2.4 : 1.4, dash: emph ? "0" : s.muted ? "2 4" : "4 4",
      legendStyle: emph ? "solid" : "dashed",
      last: fmt(s.values[n - 1]), d,
      area: emph && filled
        ? d + " L " + x(n - 1).toFixed(1) + " " + y(o.invert ? o.hi : o.lo).toFixed(1) +
          " L " + x(0).toFixed(1) + " " + y(o.invert ? o.hi : o.lo).toFixed(1) + " Z"
        : "",
    };
  });
  const step = (g.W - g.L - g.R) / Math.max(1, n - 1);
  const tipRows = drawn.concat(o.target != null ? [{ name: "Target", values: o.labels.map(() => o.target as number) }] : []);
  const hv = buildHover(hover, o.id, o.labels, x, step, tipRows, fmt, (idx) => onHoverEnter(o.id, idx));
  const stride = labelStride(n);
  return {
    title: o.title, subtitle: o.subtitle, span: o.span || "auto", badge: o.badge || "",
    modes: o.modes || [],
    series, bars: [], legend: o.hideLegend ? [] : series,
    points: o.series[0].values.map((v, i) => ({
      cx: x(i).toFixed(1), cy: y(v).toFixed(1),
      r: hover && hover.id === o.id && hover.idx === i ? 5 : 3,
    })),
    yTicks: o.ticks.map((v) => ({ y: y(v).toFixed(1), ty: (y(v) + 4).toFixed(1), label: fmt(v) })),
    xTicks: o.labels.map((l, i) => ({ x: x(i).toFixed(1), label: i % stride === 0 ? l : "", opacity: 0.45 })),
    targetY: o.target != null ? y(o.target).toFixed(1) : "",
    footer: o.footer || [], hasFooter: !!(o.footer && o.footer.length),
    hits: hv.hits, guideX: hv.guideX, tip: hv.tip,
  } as ChartConfig;
}

export interface BarChartOptions {
  id: string;
  title: string;
  subtitle?: string;
  labels: string[];
  values: number[];
  previous?: number[];
  valueName?: string;
  lo: number;
  hi: number;
  ticks: number[];
  fmt?: (v: number) => string;
  target?: number;
  fill?: (v: number) => string;
  modes?: Array<{ label: string; cls: string; go: () => void }>;
  span?: string;
  badge?: string;
  footer?: Array<{ label: string; value: string; color: string }>;
}

export function barChart(o: BarChartOptions, hover: HoverState | null, onHoverEnter: (id: string, idx: number) => void): ChartConfig {
  const n = o.labels.length;
  const { y, g } = scales(n, o.lo, o.hi);
  const fmt = o.fmt || ((v: number) => String(v));
  const step = (g.W - g.L - g.R) / n;
  const bw = step * 0.5;
  const base = y(o.lo);
  const centre = (i: number) => g.L + step * i + step / 2;
  const tipRows = [{ name: o.valueName || "Value", values: o.values }]
    .concat(o.previous ? [{ name: "Previous period", values: o.previous }] : [])
    .concat(o.target != null ? [{ name: "Target", values: o.labels.map(() => o.target as number) }] : []);
  const hv = buildHover(hover, o.id, o.labels, centre, step, tipRows, fmt, (idx) => onHoverEnter(o.id, idx));
  const stride = labelStride(n);
  return {
    title: o.title, subtitle: o.subtitle, span: o.span || "auto", badge: o.badge || "",
    modes: o.modes || [],
    series: [], legend: [], points: [],
    bars: o.values.map((v, i) => {
      const top = y(v);
      const on = hover && hover.id === o.id && hover.idx === i;
      return {
        x: (g.L + step * i + (step - bw) / 2).toFixed(1), w: bw.toFixed(1),
        y: top.toFixed(1), h: Math.max(base - top, 1).toFixed(1),
        fill: on ? "var(--color-accent-800)" : o.fill ? o.fill(v) : "var(--color-accent-700)",
      };
    }),
    yTicks: o.ticks.map((v) => ({ y: y(v).toFixed(1), ty: (y(v) + 4).toFixed(1), label: fmt(v) })),
    xTicks: o.labels.map((l, i) => ({ x: centre(i).toFixed(1), label: i % stride === 0 ? l : "", opacity: 0.45 })),
    targetY: o.target != null ? y(o.target).toFixed(1) : "",
    footer: o.footer || [], hasFooter: !!(o.footer && o.footer.length),
    hits: hv.hits, guideX: hv.guideX, tip: hv.tip,
  } as ChartConfig;
}
