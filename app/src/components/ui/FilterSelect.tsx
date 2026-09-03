import { useEffect, useRef, useState } from "react";

/** A filter control styled as a single polished chip — label, current value
 *  and a chevron. Fully custom (no native <select>): a native select's open
 *  option list is rendered by the OS/browser outside the page's own CSS
 *  reach, which made it inherit the OS's dark-mode palette (low-contrast
 *  grey-on-dark text) despite the page declaring color-scheme: light, and
 *  made the popup's exact position/sizing something this app can't fully
 *  control. Building the open state ourselves (matching the click-to-open/
 *  click-outside-to-close popover pattern GlobalHeader's notifications/
 *  profile menus and ColumnPicker already use) guarantees the same
 *  appearance regardless of OS/browser. */
export function FilterSelect({ label, value, onChange, options, width }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ id: string; name: string }>;
  width?: number;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const current = options.find((o) => o.id === value);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("click", onClick); document.removeEventListener("keydown", onKey); };
  }, []);

  return (
    <div ref={rootRef} style={{ position: "relative", flex: "none" }}>
      <button
        type="button"
        className="sl-filter"
        style={width ? { width } : undefined}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${label}: ${current?.name ?? value}`}
      >
        <span className="sl-filter__label">{label}</span>
        <span className="sl-filter__value">{current?.name ?? value}</span>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="sl-filter__chevron" style={{ transform: open ? "translateY(-50%) rotate(180deg)" : undefined }}>
          <path d="M6 9l6 6 6-6"></path>
        </svg>
      </button>
      {open && (
        <div className="sl-panel sl-pop-in" role="listbox" style={{ position: "absolute", top: 40, left: 0, minWidth: Math.max(width ?? 0, 180), maxHeight: 320, overflowY: "auto", zIndex: 30, padding: "6px 0" }}>
          {options.map((o) => (
            <button
              key={o.id}
              type="button"
              role="option"
              aria-selected={o.id === value}
              className="sl-palette__row"
              onClick={() => { onChange(o.id); setOpen(false); }}
              style={{ width: "100%", justifyContent: "space-between", fontWeight: o.id === value ? 600 : 400, color: o.id === value ? "var(--color-accent-700)" : "var(--text-primary)" }}
            >
              {o.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
