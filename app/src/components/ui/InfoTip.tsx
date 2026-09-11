import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/** A small "i" hint icon with a hover/focus tooltip explaining what a KPI,
 *  chart or table actually shows. The bubble is portaled to `document.body`
 *  and positioned with `position: fixed` from the icon's own measured
 *  rect, rather than a plain CSS `position: absolute` child -- several
 *  places this is used (every SortableTable column header, in particular)
 *  sit inside a horizontally-scrollable `overflow-x: auto` wrapper, whose
 *  computed `overflow-y` becomes `auto` too as soon as `overflow-x` is
 *  anything but `visible` (a CSS interaction, not a bug in that wrapper).
 *  A bubble absolutely positioned above the icon then renders outside that
 *  wrapper's clipped box and is silently invisible -- reported as "the info
 *  icon doesn't show anything" on table-column info icons specifically.
 *  Escaping via a portal sidesteps every such ancestor regardless of its
 *  overflow, with no per-usage opt-in needed. */
export function InfoTip({ text }: { text: string }) {
  const iconRef = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; flip: boolean } | null>(null);

  useLayoutEffect(() => {
    if (!open || !iconRef.current) return;
    const update = () => {
      const r = iconRef.current!.getBoundingClientRect();
      // Flip below the icon when there isn't roughly a bubble's-height of
      // room above it (e.g. the very top row of a table) -- same idea as
      // the horizontal clamp below, just for the vertical axis.
      const flip = r.top < 90;
      const left = Math.min(Math.max(r.left + r.width / 2, 130), window.innerWidth - 130);
      setPos({ top: flip ? r.bottom + 7 : r.top - 7, left, flip });
    };
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open]);

  return (
    <span
      ref={iconRef}
      className="sl-info-tip"
      tabIndex={0}
      role="note"
      aria-label={text}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9.5"></circle>
        <line x1="12" y1="11" x2="12" y2="16.5"></line>
        <circle cx="12" cy="7.8" r="0.75" fill="currentColor" stroke="none"></circle>
      </svg>
      {open && pos && createPortal(
        <span
          className="sl-info-tip__bubble sl-info-tip__bubble--portal"
          style={{
            position: "fixed", top: pos.top, left: pos.left,
            transform: `translate(-50%, ${pos.flip ? "0" : "-100%"})`,
            opacity: 1, visibility: "visible",
          }}
        >
          {text}
        </span>,
        document.body,
      )}
    </span>
  );
}
