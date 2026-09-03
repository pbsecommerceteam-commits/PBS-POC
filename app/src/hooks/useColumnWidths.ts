import { useCallback, useEffect, useRef, useState } from "react";

/** Drag-to-resize column widths, opt-in per table (SortableTable/DataTable
 *  both take a `resizable` prop that wires this in). `defaults` seeds each
 *  column's starting width, keyed however the caller identifies its
 *  columns (a `Column.key` string, or a plain array index for the
 *  cols-array-shaped DataTable). Widths live in this hook's own state for
 *  the table's mounted lifetime -- same no-localStorage, resets-on-
 *  navigation lifetime as this app's other per-page customization state
 *  (column order/visibility), not a new persistence pattern. Re-seeding
 *  only ADDS missing keys (e.g. a column the user just made visible via a
 *  column picker) rather than overwriting a width the user already
 *  dragged. */
export function useColumnWidths(defaults: Record<string, number>, min = 60) {
  const [widths, setWidths] = useState<Record<string, number>>(defaults);
  const drag = useRef<{ key: string; startX: number; startWidth: number } | null>(null);

  useEffect(() => {
    setWidths((w) => {
      let changed = false;
      const next = { ...w };
      for (const [k, v] of Object.entries(defaults)) {
        if (!(k in next)) { next[k] = v; changed = true; }
      }
      return changed ? next : w;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Object.keys(defaults).join(",")]);

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!drag.current) return;
    const { key, startX, startWidth } = drag.current;
    setWidths((w) => ({ ...w, [key]: Math.max(min, startWidth + (e.clientX - startX)) }));
  }, [min]);

  const onMouseUp = useCallback(() => {
    drag.current = null;
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
  }, [onMouseMove]);

  const startResize = useCallback((key: string) => (e: { clientX: number; preventDefault(): void; stopPropagation(): void }) => {
    e.preventDefault();
    e.stopPropagation();
    drag.current = { key, startX: e.clientX, startWidth: widths[key] ?? min };
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }, [widths, min, onMouseMove, onMouseUp]);

  return { widths, startResize };
}
