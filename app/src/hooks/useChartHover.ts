import { useState } from "react";
import type { HoverState } from "../lib/charts";

/** One hover slot shared by every chart on a page, exactly like the
 *  prototype's single `state.hover` — only one chart's tooltip is visible
 *  at a time, keyed by chart id. */
export function useChartHover() {
  const [hover, setHover] = useState<HoverState | null>(null);
  return {
    hover,
    onEnter: (id: string, idx: number) => setHover({ id, idx }),
    onLeave: () => setHover(null),
  };
}
