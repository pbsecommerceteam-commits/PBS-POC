import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFilters } from "../../context/FiltersContext";
import { useUi } from "../../context/UiContext";
import { FilterSelect } from "../ui/FilterSelect";
import { SearchPalette } from "./SearchPalette";
import { user } from "../../data/mockData";

const SEVERITY_GROUP: Record<string, { label: string; order: number }> = {
  high: { label: "Critical", order: 0 },
  medium: { label: "Attention", order: 1 },
  low: { label: "Information", order: 2 },
};

export function GlobalHeader() {
  const { retailer, period, setRetailer, setPeriod, retailers, periods } = useFilters();
  const { notifDismissed, notifications, markAllRead } = useUi();
  const navigate = useNavigate();

  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setSearchOpen(true); setNotifOpen(false); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => { if (rootRef.current && !rootRef.current.contains(e.target as Node)) setNotifOpen(false); };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  const openProduct = (id: string) => { navigate("/product/" + id); setNotifOpen(false); };

  const grouped = notifDismissed ? [] : Object.entries(
    notifications.reduce<Record<string, typeof notifications>>((acc, n) => {
      (acc[n.severity] ||= []).push(n);
      return acc;
    }, {}),
  ).sort((a, b) => SEVERITY_GROUP[a[0]].order - SEVERITY_GROUP[b[0]].order);

  return (
    <header ref={rootRef} className="sl-header">
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <FilterSelect label="Retailer" value={retailer} onChange={setRetailer} options={retailers} width={168} />
        <FilterSelect label="Period" value={period} onChange={setPeriod} options={periods} width={156} />
      </div>

      <div style={{ flex: 1 }} />

      <button className="sl-search-trigger" onClick={() => setSearchOpen(true)}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round"><circle cx="11" cy="11" r="7"></circle><path d="M20 20l-4.2-4.2"></path></svg>
        <span className="sl-muted" style={{ fontSize: 13 }}>Search products, SKUs, categories</span>
        <kbd className="sl-kbd" style={{ marginLeft: "auto" }}>Ctrl K</kbd>
      </button>

      <div style={{ position: "relative" }}>
        <button className="sl-icon-btn" onClick={() => setNotifOpen((o) => !o)} title="Notifications">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"><path d="M18 15V10a6 6 0 10-12 0v5l-1.5 3h15z"></path><path d="M10 21h4"></path></svg>
          {!notifDismissed && notifications.length > 0 && <span className="sl-icon-btn__dot" />}
        </button>
        {notifOpen && (
          <div className="sl-panel sl-pop-in" onClick={(e) => e.stopPropagation()} style={{ position: "absolute", top: 42, right: 0, width: 368, zIndex: 30, padding: "6px 0" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px 8px" }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>Notifications</div>
              <button className="btn btn-ghost" onClick={markAllRead} style={{ fontSize: 11.5 }}>Mark all read</button>
            </div>
            <div style={{ maxHeight: 360, overflowY: "auto" }}>
              {grouped.map(([sev, items]) => (
                <div key={sev}>
                  <div className="sl-eyebrow" style={{ padding: "8px 14px 4px" }}>{SEVERITY_GROUP[sev].label}</div>
                  {items.map((n) => (
                    <button key={n.id} className="sl-palette__row" onClick={() => openProduct(n.product)} style={{ flexDirection: "column", alignItems: "flex-start", gap: 3 }}>
                      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8, width: "100%" }}>
                        <span style={{ fontWeight: 500, fontSize: 13 }}>{n.title}</span>
                        <span className="sl-faint" style={{ fontSize: 11 }}>{n.time}</span>
                      </div>
                      <span className="sl-muted" style={{ fontSize: 12.5, lineHeight: 1.4 }}>{n.text}</span>
                      <span style={{ fontSize: 11.5, color: "var(--text-link)" }}>View product →</span>
                    </button>
                  ))}
                </div>
              ))}
              {notifDismissed || notifications.length === 0 ? <div className="sl-muted" style={{ fontSize: 13, padding: "14px" }}>No open notifications. You are all caught up.</div> : null}
            </div>
            <div style={{ borderTop: "1px solid var(--border-subtle)", padding: "8px 14px 2px" }}>
              <button className="btn btn-ghost" onClick={() => { setNotifOpen(false); navigate("/alerts"); }} style={{ fontSize: 12.5, paddingLeft: 0 }}>View all alerts →</button>
            </div>
          </div>
        )}
      </div>

      <div className="sl-profile">
        <span className="sl-avatar" style={{ width: 30, height: 30 }}>{user.initials}</span>
        <div style={{ lineHeight: 1.25 }}>
          <div style={{ fontSize: 12.5, fontWeight: 500 }}>{user.name}</div>
          <div className="sl-faint" style={{ fontSize: 11 }}>{user.role}</div>
        </div>
      </div>

      <SearchPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
}
