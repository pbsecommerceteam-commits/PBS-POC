import { useEffect, useRef, useState } from "react";
import type { DateRange } from "../../data/mockData";

const CRAWL_MIN = "2022-09-01";
const CRAWL_MAX = "2022-09-30";

const fmtDate = (d: string) => new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });

/** A custom date-range override for the global Period filter, styled and
 *  behaving exactly like FilterSelect (button chip -> click-outside-to-
 *  close popover) so the three global filter chips are visually and
 *  interactively consistent, instead of Date range being permanently
 *  expanded inline while Retailer/Category are click-to-open. Two native
 *  <input type="date"> inside the popover give start/end full keyboard/a11y
 *  support without hand-building a calendar widget. Bounded to the real
 *  crawl month as a soft guide (min/max) -- picking outside it still works,
 *  the data layer just falls back to the full real window and flags that
 *  explicitly rather than fabricating a number for a range with no crawl
 *  coverage. */
export function DateRangePicker({ value, onChange }: {
  value: DateRange | null;
  onChange: (range: DateRange | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const start = value?.start ?? "";
  const end = value?.end ?? "";

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("click", onClick); document.removeEventListener("keydown", onKey); };
  }, []);

  const setStart = (s: string) => {
    if (!s) { onChange(null); return; }
    onChange({ start: s, end: end && end >= s ? end : s });
  };
  const setEnd = (e: string) => {
    if (!e) { onChange(null); return; }
    onChange({ start: start && start <= e ? start : e, end: e });
  };

  const valueLabel = value ? `${fmtDate(start)} – ${fmtDate(end)}` : "All dates";

  return (
    <div ref={rootRef} style={{ position: "relative", flex: "none" }}>
      <button
        type="button"
        className="sl-filter"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`Date range: ${valueLabel}`}
      >
        <span className="sl-filter__label">Date range</span>
        <span className="sl-filter__value">{valueLabel}</span>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="sl-filter__chevron" style={{ transform: open ? "translateY(-50%) rotate(180deg)" : undefined }}>
          <path d="M6 9l6 6 6-6"></path>
        </svg>
      </button>
      {open && (
        <div className="sl-panel sl-pop-in" onClick={(e) => e.stopPropagation()} style={{ position: "absolute", top: 40, left: 0, zIndex: 30, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10, minWidth: 240 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label className="sl-filter__label" style={{ fontSize: 11 }}>Start</label>
            <input type="date" className="input" value={start} min={CRAWL_MIN} max={end || CRAWL_MAX} onChange={(e) => setStart(e.target.value)} aria-label="Range start" style={{ minHeight: 32, fontSize: 13 }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label className="sl-filter__label" style={{ fontSize: 11 }}>End</label>
            <input type="date" className="input" value={end} min={start || CRAWL_MIN} max={CRAWL_MAX} onChange={(e) => setEnd(e.target.value)} aria-label="Range end" style={{ minHeight: 32, fontSize: 13 }} />
          </div>
          {value && (
            <button type="button" className="btn btn-ghost" onClick={() => { onChange(null); setOpen(false); }} style={{ fontSize: 12.5, alignSelf: "flex-start", padding: 0 }}>
              Clear date range
            </button>
          )}
        </div>
      )}
    </div>
  );
}
