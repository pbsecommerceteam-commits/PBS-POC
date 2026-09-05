import { NavLink } from "react-router-dom";
import { useUi } from "../../context/UiContext";
import { alertRules } from "../../data/mockData";

interface NavItem { to: string; label: string; icon: React.ReactNode }

const ANALYTICS_ITEMS: NavItem[] = [
  { to: "/overview", label: "Overview", icon: <g><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></g> },
  { to: "/sales-share", label: "Pricing Intelligence", icon: <g><path d="M3 17l6-6 4 4 7-7"></path><path d="M14 8h6v6"></path></g> },
  { to: "/content", label: "Content Intelligence", icon: <g><path d="M5 3h9l5 5v13H5z"></path><path d="M14 3v5h5"></path><path d="M9 13h6"></path><path d="M9 17h4"></path></g> },
  { to: "/reviews", label: "Ratings & Reviews", icon: <path d="M12 4l2.5 5.2 5.5.8-4 3.9.9 5.6L12 16.9 7.1 19.5l.9-5.6-4-3.9 5.5-.8z"></path> },
  { to: "/competitors", label: "Competitive Intelligence", icon: <g><circle cx="9" cy="8" r="3"></circle><path d="M3 20c0-3.3 2.7-5 6-5s6 1.7 6 5"></path><path d="M16 6.2a3 3 0 010 5.6"></path><path d="M18 20c0-2.6-1-4.2-2.5-5"></path></g> },
];

const WORKSPACE_ITEMS: NavItem[] = [
  { to: "/alerts", label: "Alerts", icon: <g><path d="M18 15V10a6 6 0 10-12 0v5l-1.5 3h15z"></path><path d="M10 21h4"></path></g> },
  { to: "/reports", label: "Reports", icon: <g><path d="M5 3h9l5 5v13H5z"></path><path d="M9 17v-4"></path><path d="M12.5 17v-6"></path><path d="M16 17v-2"></path></g> },
  { to: "/import", label: "Data Import", icon: <g><path d="M12 3v12"></path><path d="M7 10l5 5 5-5"></path><path d="M4 21h16"></path></g> },
  { to: "/settings", label: "Settings", icon: <g><path d="M4 7h9"></path><path d="M17 7h3"></path><path d="M4 17h5"></path><path d="M13 17h7"></path><circle cx="15" cy="7" r="2"></circle><circle cx="11" cy="17" r="2"></circle></g> },
];

function Icon({ children }: { children: React.ReactNode }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" style={{ flex: "none" }}>
      {children}
    </svg>
  );
}

export function Sidebar() {
  const { collapsed, toggleCollapse } = useUi();
  const labelDisplay = collapsed ? "none" : "block";
  const activeRuleCount = alertRules.filter((r) => r.status === "Active").length;

  const link = (item: NavItem) => (
    <NavLink
      key={item.to}
      to={item.to}
      className={({ isActive }) => "sl-nav-item" + (isActive ? " is-active" : "")}
      title={item.label}
    >
      <span className="sl-nav-item__indicator" />
      <Icon>{item.icon}</Icon>
      <span style={{ display: labelDisplay, whiteSpace: "nowrap", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>{item.label}</span>
      {item.label === "Alerts" && <span className="sl-nav-item__count" style={{ display: labelDisplay }}>{activeRuleCount}</span>}
    </NavLink>
  );

  return (
    <aside className="sl-sidebar" style={{ width: collapsed ? 68 : 252 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 10px 22px" }}>
        <div className="sl-brand-mark">SL</div>
        <div style={{ display: labelDisplay, minWidth: 0 }}>
          <div style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 16, lineHeight: 1.1, whiteSpace: "nowrap" }}>Shelfline</div>
          <div className="sl-faint" style={{ fontSize: 10.5, whiteSpace: "nowrap" }}>Digital shelf intelligence</div>
        </div>
      </div>

      <div className="sl-eyebrow" style={{ display: labelDisplay, padding: "0 12px 8px" }}>Analytics</div>
      <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {ANALYTICS_ITEMS.map(link)}
      </nav>

      <div className="sl-eyebrow" style={{ display: labelDisplay, padding: "22px 12px 8px" }}>Workspace</div>
      <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {WORKSPACE_ITEMS.map(link)}
      </nav>

      <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 10, paddingTop: 18 }}>
        <div style={{ display: labelDisplay, padding: "0 12px" }}>
          <div className="sl-faint" style={{ fontSize: 10.5 }}>Last crawl</div>
          <div style={{ fontSize: 12.5 }}>Today, 06:40 UTC</div>
        </div>
        <button className="sl-collapse-btn" onClick={toggleCollapse} title="Toggle sidebar">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" style={{ transform: collapsed ? "rotate(180deg)" : undefined, transition: "transform var(--duration-base) var(--ease)" }}><path d="M15 6l-6 6 6 6"></path></svg>
          <span style={{ display: labelDisplay, whiteSpace: "nowrap" }}>Collapse</span>
        </button>
      </div>
    </aside>
  );
}
