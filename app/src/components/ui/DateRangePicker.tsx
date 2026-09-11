import { useEffect, useRef, useState } from "react";
import type { DateRange } from "../../data/mockData";

const fmtDate = (d: string) => new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });

/** A custom date-range override for the global Period filter, styled and
 *  behaving exactly like FilterSelect (button chip -> click-outside-to-
 *  close popover) so the three global filter chips are visually and
 *  interactively consistent, instead of Date range being permanently
 *  expanded inline while Retailer/Category are click-to-open. Two native
 *  <input type="date"> inside the popover give start/end full keyboard/a11y
 *  support without hand-building a calendar widget.
 *
 *  `minDate`/`maxDate` are this company's own real earliest/latest crawl
 *  dates (see GlobalHeader, sourced from REAL_WEEK_DATES) -- never
 *  hardcoded, so a company whose real data lands anywhere in time (this
 *  dataset already spans 2022-2026 across companies, and will keep
 *  growing) gets a picker that actually covers it. Picking outside them
 *  still works (the native input only *suggests* the bound), the data
 *  layer just falls back to the full real window and flags that
 *  explicitly rather than fabricating a number for a range with no crawl
 *  coverage.
 *
 *  The two fields default to `maxDate` (the latest real date) whenever the
 *  popover opens with no range already applied -- so a user opening the
 *  picker lands on the most recent data instead of having to scroll a
 *  native calendar back from "today" to wherever the real crawl actually
 *  sits, without that default being silently applied as a filter: nothing
 *  reaches `onChange` (and the dashboard stays on its true default of
 *  every real date, `value: null`) until the user actually edits a field. */
export function DateRangePicker({ value, onChange, minDate, maxDate }: {
  value: DateRange | null;
  onChange: (range: DateRange | null) => void;
  minDate: string;
  maxDate: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const [draftStart, setDraftStart] = useState(value?.start ?? maxDate);
  const [draftEnd, setDraftEnd] = useState(value?.end ?? maxDate);

  useEffect(() => {
    if (open) {
      setDraftStart(value?.start ?? maxDate);
      setDraftEnd(value?.end ?? maxDate);
    }
  }, [open, value, maxDate]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("click", onClick); document.removeEventListener("keydown", onKey); };
  }, []);

  const commitStart = (s: string) => {
    setDraftStart(s);
    if (!s) { onChange(null); return; }
    const e = draftEnd && draftEnd >= s ? draftEnd : s;
    setDraftEnd(e);
    onChange({ start: s, end: e });
  };
  const commitEnd = (e: string) => {
    setDraftEnd(e);
    if (!e) { onChange(null); return; }
    const s = draftStart && draftStart <= e ? draftStart : e;
    setDraftStart(s);
    onChange({ start: s, end: e });
  };

  const valueLabel = value ? `${fmtDate(value.start)} – ${fmtDate(value.end)}` : "All dates";

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
            <input type="date" className="input" value={draftStart} min={minDate} max={draftEnd || maxDate} onChange={(e) => commitStart(e.target.value)} aria-label="Range start" style={{ minHeight: 32, fontSize: 13 }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label className="sl-filter__label" style={{ fontSize: 11 }}>End</label>
            <input type="date" className="input" value={draftEnd} min={draftStart || minDate} max={maxDate} onChange={(e) => commitEnd(e.target.value)} aria-label="Range end" style={{ minHeight: 32, fontSize: 13 }} />
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
