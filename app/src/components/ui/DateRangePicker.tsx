import type { DateRange } from "../../data/mockData";

const CRAWL_MIN = "2022-09-01";
const CRAWL_MAX = "2022-09-30";

/** A custom date-range override for the global Period filter, styled to match
 *  FilterSelect's chip. Two native <input type="date"> so start/end get full
 *  keyboard/a11y support without hand-building a calendar widget. Bounded to
 *  the real crawl month as a soft guide (min/max) -- picking outside it still
 *  works, the data layer just falls back to the full real window and flags
 *  that explicitly rather than fabricating a number for a range with no
 *  crawl coverage. */
export function DateRangePicker({ value, onChange }: {
  value: DateRange | null;
  onChange: (range: DateRange | null) => void;
}) {
  const start = value?.start ?? "";
  const end = value?.end ?? "";

  const setStart = (s: string) => {
    if (!s) { onChange(null); return; }
    onChange({ start: s, end: end && end >= s ? end : s });
  };
  const setEnd = (e: string) => {
    if (!e) { onChange(null); return; }
    onChange({ start: start && start <= e ? start : e, end: e });
  };

  return (
    <div className="sl-filter sl-daterange">
      <span className="sl-filter__label">Date range</span>
      <input
        type="date"
        className="sl-daterange__input"
        value={start}
        min={CRAWL_MIN}
        max={end || CRAWL_MAX}
        onChange={(e) => setStart(e.target.value)}
        aria-label="Range start"
      />
      <span className="sl-daterange__sep">–</span>
      <input
        type="date"
        className="sl-daterange__input"
        value={end}
        min={start || CRAWL_MIN}
        max={CRAWL_MAX}
        onChange={(e) => setEnd(e.target.value)}
        aria-label="Range end"
      />
      {value && (
        <button
          type="button"
          className="sl-daterange__clear"
          onClick={() => onChange(null)}
          aria-label="Clear date range"
          title="Clear date range"
        >
          ×
        </button>
      )}
    </div>
  );
}
