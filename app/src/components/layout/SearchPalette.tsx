import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDashboardData } from "../../context/DataContext";
import { sectionMeta } from "../../data/mockData";
import { Badge, stockTone } from "../ui/Badge";
import type { Product } from "../../models/types";

const PAGES = [
  { id: "overview", to: "/overview" }, { id: "shelf", to: "/digital-shelf" }, { id: "sales", to: "/sales-share" },
  { id: "content", to: "/content" }, { id: "reviews", to: "/reviews" }, { id: "competitors", to: "/competitors" },
  { id: "alerts", to: "/alerts" }, { id: "reports", to: "/reports" }, { id: "settings", to: "/settings" },
].map((p) => ({ ...p, title: sectionMeta[p.id]?.title || p.id }));

/** A command-palette style search overlay: grouped results across products,
 *  categories and pages, rather than a plain filtered dropdown. Opened by
 *  Ctrl/Cmd+K or the header's search trigger. */
export function SearchPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { snap } = useDashboardData();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (open) { setQuery(""); requestAnimationFrame(() => inputRef.current?.focus()); } }, [open]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const q = query.trim().toLowerCase();
  const products: Product[] = snap?.products || [];
  const productHits = q ? products.filter((p) => (p.name + " " + p.id + " " + p.brand).toLowerCase().includes(q)).slice(0, 5) : products.slice(0, 4);
  const categories = useMemo(() => Array.from(new Set(products.map((p) => p.category))), [products]);
  const categoryHits = categories.filter((c) => !q || c.toLowerCase().includes(q)).slice(0, 4);
  const pageHits = PAGES.filter((p) => !q || p.title.toLowerCase().includes(q)).slice(0, 5);
  const empty = q && !productHits.length && !categoryHits.length && !pageHits.length;

  if (!open) return null;

  const go = (to: string) => { navigate(to); onClose(); };

  return (
    <div className="sl-modal-backdrop sl-fade-in" onClick={onClose} style={{ alignItems: "flex-start", paddingTop: "12vh" }}>
      <div className="sl-palette sl-pop-in" onClick={(e) => e.stopPropagation()}>
        <div className="sl-palette__search">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round"><circle cx="11" cy="11" r="7"></circle><path d="M20 20l-4.2-4.2"></path></svg>
          <input ref={inputRef} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search products, SKUs, categories, pages…" className="sl-palette__input" />
          <kbd className="sl-kbd">Esc</kbd>
        </div>
        <div className="sl-palette__body">
          {empty && <div className="sl-muted" style={{ padding: "18px 16px", fontSize: 13 }}>No matches for "{query}".</div>}

          {productHits.length > 0 && (
            <div className="sl-palette__group">
              <div className="sl-eyebrow" style={{ padding: "10px 16px 4px" }}>Products</div>
              {productHits.map((p) => (
                <button key={p.id} className="sl-palette__row" onClick={() => go("/product/" + p.id)}>
                  <span className="sl-avatar" style={{ width: 28, height: 28, fontSize: 10.5 }}>{p.name.split(" ").slice(0, 2).map((w) => w[0]).join("")}</span>
                  <span style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                    <span style={{ display: "block", fontSize: 13.5, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</span>
                    <span className="sl-muted" style={{ fontSize: 11.5 }}>{p.id.toUpperCase()} · {p.retailerName}</span>
                  </span>
                  <Badge tone={stockTone(p.stockStatus)}>{p.stockStatus}</Badge>
                </button>
              ))}
            </div>
          )}

          {categoryHits.length > 0 && (
            <div className="sl-palette__group">
              <div className="sl-eyebrow" style={{ padding: "10px 16px 4px" }}>Categories</div>
              {categoryHits.map((c) => (
                <button key={c} className="sl-palette__row" onClick={() => go("/digital-shelf")}>
                  <span style={{ flex: 1, textAlign: "left", fontSize: 13.5 }}>{c}</span>
                </button>
              ))}
            </div>
          )}

          {pageHits.length > 0 && (
            <div className="sl-palette__group">
              <div className="sl-eyebrow" style={{ padding: "10px 16px 4px" }}>Pages</div>
              {pageHits.map((p) => (
                <button key={p.id} className="sl-palette__row" onClick={() => go(p.to)}>
                  <span style={{ flex: 1, textAlign: "left", fontSize: 13.5 }}>{p.title}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
