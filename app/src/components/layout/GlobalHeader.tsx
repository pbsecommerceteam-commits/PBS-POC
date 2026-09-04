import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useFilters } from "../../context/FiltersContext";
import { useUi } from "../../context/UiContext";
import { useAuth } from "../../context/AuthContext";
import { FilterSelect } from "../ui/FilterSelect";
import { DateRangePicker } from "../ui/DateRangePicker";
import { SearchPalette } from "./SearchPalette";
import { user, catalog } from "../../data/mockData";

const SEVERITY_GROUP: Record<string, { label: string; order: number }> = {
  high: { label: "Critical", order: 0 },
  medium: { label: "Attention", order: 1 },
  low: { label: "Information", order: 2 },
};

/* Every tracked SKU, real name + the retailer's own native product id
   (what the user searches "by retailer ID or Product name") -- built once
   at module scope since catalog never changes at runtime. */
const SKU_OPTIONS = [
  { id: "", name: "All SKUs" },
  ...catalog.map((p) => ({ id: p.id, name: p.name, sub: p.retailerId || undefined })),
];

export function GlobalHeader() {
  const { retailer, category, dateRange, sku, setRetailer, setCategory, setDateRange, setSku, retailers, categories } = useFilters();
  const categoryOptions = [{ id: "", name: "All categories" }, ...categories.map((c) => ({ id: c, name: c }))];
  const { notifDismissed, notifications, markAllRead } = useUi();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  /* Picking a SKU is "go look at this one item", not just a background
     scope change -- jump to Overview (where the product table can show its
     row) the same way a notification/search-palette pick jumps straight
     to Product Detail, just staying one level up so the surrounding real
     portfolio context (retailer/category performance) is still visible. */
  const onSkuChange = (id: string) => {
    setSku(id);
    if (id && location.pathname !== "/") navigate("/");
  };

  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setSearchOpen(true); setNotifOpen(false); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) { setNotifOpen(false); setProfileOpen(false); }
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  const handleLogout = () => { setProfileOpen(false); logout(); navigate("/login", { replace: true }); };

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
        <FilterSelect label="Category" value={category} onChange={setCategory} options={categoryOptions} width={178} />
        <FilterSelect label="SKU" value={sku} onChange={onSkuChange} options={SKU_OPTIONS} width={190} searchable searchPlaceholder="Product name or retailer ID…" />
        <DateRangePicker value={dateRange} onChange={setDateRange} />
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

      <div style={{ position: "relative" }}>
        <button
          className="sl-profile" onClick={() => setProfileOpen((o) => !o)}
          style={{ border: "none", background: "transparent", cursor: "pointer", font: "inherit", color: "inherit" }}
        >
          <span className="sl-avatar" style={{ width: 30, height: 30 }}>{user.initials}</span>
          <div style={{ lineHeight: 1.25, textAlign: "left" }}>
            <div style={{ fontSize: 12.5, fontWeight: 500 }}>{user.name}</div>
            <div className="sl-faint" style={{ fontSize: 11 }}>{user.role}</div>
          </div>
        </button>
        {profileOpen && (
          <div className="sl-panel sl-pop-in" onClick={(e) => e.stopPropagation()} style={{ position: "absolute", top: 44, right: 0, width: 180, zIndex: 30, padding: "6px 0" }}>
            <button className="sl-palette__row" onClick={handleLogout} style={{ gap: 9 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"></path><path d="M16 17l5-5-5-5"></path><path d="M21 12H9"></path></svg>
              <span style={{ fontSize: 13 }}>Log out</span>
            </button>
          </div>
        )}
      </div>

      <SearchPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
}
