import type { ReactNode } from "react";
import { useFilters } from "../../context/FiltersContext";
import { useDashboardData } from "../../context/DataContext";
import { useUi } from "../../context/UiContext";

/** Shared page frame: a small breadcrumb, a large title and supporting
 *  description, page-level actions, optional Summary/Benchmarks/Products
 *  sub-tabs, and the loading-skeleton / error states every analytics page
 *  shares. `tabs` renders even while loading, so switching sub-tabs never
 *  makes the page lose its place. */
export function PageShell({
  title, subtitle, backTo, tabs, onExportCsv, exportDisabled, onSaveView, children,
}: {
  title: string;
  subtitle: string;
  backTo?: { label: string; onClick: () => void };
  tabs?: ReactNode;
  onExportCsv?: () => void;
  exportDisabled?: boolean;
  onSaveView?: () => void;
  children: ReactNode;
}) {
  const { retailerName, categoryName, dateRange } = useFilters();
  const { snap, loading, error, reload } = useDashboardData();
  const rangeNote = dateRange ? snap?.dateRange?.note : null;
  const { openAlert } = useUi();
  const fmtDate = (d: string) => new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const windowLabel = dateRange ? `${fmtDate(dateRange.start)} – ${fmtDate(dateRange.end)}` : "Last 4 weeks";

  return (
    <main style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "28px 28px 48px" }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 20, flexWrap: "wrap", marginBottom: 24 }}>
        <div style={{ minWidth: 0, display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
          {backTo && (
            <button className="btn btn-ghost" onClick={backTo.onClick} style={{ gap: 6, marginBottom: 8, whiteSpace: "nowrap", alignSelf: "flex-start", paddingLeft: 0, fontSize: 12.5 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6"></path></svg>
              {backTo.label}
            </button>
          )}
          <div className="sl-eyebrow">{retailerName}{categoryName !== "All categories" ? " · " + categoryName : ""} — {windowLabel}</div>
          <h1 style={{ margin: "6px 0 5px", fontSize: 26, fontWeight: 600, letterSpacing: "-.01em" }}>{title}</h1>
          <div className="sl-muted" style={{ fontSize: 14, maxWidth: "62ch", lineHeight: 1.5 }}>{subtitle}</div>
        </div>
        <div style={{ display: "flex", gap: 8, flex: "none", alignItems: "center" }}>
          {onSaveView && (
            <button className="btn btn-secondary" onClick={onSaveView} style={{ whiteSpace: "nowrap", minHeight: 34 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"></path></svg>
              Save view
            </button>
          )}
          {onExportCsv && (
            <button className="btn btn-secondary" onClick={onExportCsv} disabled={exportDisabled} style={{ whiteSpace: "nowrap", minHeight: 34 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"><path d="M12 4v11"></path><path d="M7 11l5 5 5-5"></path><path d="M4 20h16"></path></svg>
              Export
            </button>
          )}
          <button className="btn btn-primary" onClick={openAlert} style={{ whiteSpace: "nowrap", minHeight: 34 }}>Create alert</button>
        </div>
      </div>

      {tabs}

      {error && (
        <div className="sl-card-surface" style={{ padding: "24px 22px", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 10 }}>
          <div style={{ fontWeight: 600, fontSize: 16 }}>Could not load this view</div>
          <div className="sl-muted" style={{ fontSize: 13 }}>{error}</div>
          <button className="btn btn-secondary" onClick={reload}>Try again</button>
        </div>
      )}

      {!error && loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div className="sl-muted" style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 12.5 }}>
            <span className="sl-skel" style={{ width: 11, height: 11, borderRadius: "50%", display: "block" }}></span>
            Loading {windowLabel.toLowerCase()} for {retailerName}…
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: "var(--app-gap)" }}>
            {[0, 1, 2, 3].map((i) => <div key={i} className="sl-skel" style={{ height: 152 }}></div>)}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,430px),1fr))", gap: "var(--app-gap)" }}>
            <div className="sl-skel" style={{ height: 320 }}></div>
            <div className="sl-skel" style={{ height: 320 }}></div>
          </div>
          <div className="sl-skel" style={{ height: 220 }}></div>
        </div>
      )}

      {!error && !loading && rangeNote && (
        <div className="sl-card-surface" style={{ padding: "12px 16px", marginBottom: 16, fontSize: 13, color: "var(--text-muted)" }}>
          {rangeNote}
        </div>
      )}

      {!error && !loading && (
        <div className="sl-fade-in" style={{ display: "flex", flexDirection: "column", gap: "var(--app-section-gap)" }}>
          {children}
        </div>
      )}
    </main>
  );
}
