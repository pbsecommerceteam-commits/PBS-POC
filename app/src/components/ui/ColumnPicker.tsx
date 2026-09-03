import { useEffect, useRef, useState } from "react";

export interface ColumnOption {
  id: string;
  label: string;
}

/** "Customize columns" checkbox popover for a product table -- toggling an
 *  option shows/hides that column without touching any other filter/search
 *  state. `lockedIds` (e.g. the identity column) render checked and
 *  disabled, since hiding them would leave a row with nothing to identify
 *  it. Mirrors the click-to-open/click-outside-to-close popover pattern
 *  GlobalHeader's notifications/profile menus already use. */
export function ColumnPicker({ columns, selected, onChange, lockedIds = [] }: {
  columns: ColumnOption[];
  selected: Set<string>;
  onChange: (next: Set<string>) => void;
  lockedIds?: string[];
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  const toggle = (id: string) => {
    if (lockedIds.includes(id)) return;
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    onChange(next);
  };

  return (
    <div ref={rootRef} style={{ position: "relative" }}>
      <button type="button" className="btn btn-secondary" onClick={() => setOpen((o) => !o)} style={{ minHeight: 32, fontSize: 12.5 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="7" height="16" rx="1"></rect><rect x="14" y="4" width="7" height="16" rx="1"></rect></svg>
        Customize columns
      </button>
      {open && (
        <div className="sl-panel sl-pop-in" onClick={(e) => e.stopPropagation()} style={{ position: "absolute", top: 38, right: 0, width: 240, zIndex: 30, padding: "6px 0" }}>
          <div style={{ padding: "8px 14px 6px", fontWeight: 600, fontSize: 12.5 }}>Show columns</div>
          <div style={{ maxHeight: 320, overflowY: "auto" }}>
            {columns.map((c) => {
              const locked = lockedIds.includes(c.id);
              return (
                <label key={c.id} className="sl-facet-option" style={{ padding: "6px 14px", opacity: locked ? 0.6 : 1, cursor: locked ? "default" : "pointer" }}>
                  <input type="checkbox" checked={selected.has(c.id) || locked} disabled={locked} onChange={() => toggle(c.id)} />
                  <span>{c.label}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
