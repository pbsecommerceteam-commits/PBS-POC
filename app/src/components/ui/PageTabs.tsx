import { NavLink } from "react-router-dom";

/** Page-level sub-navigation — Summary / Benchmarks / Products style tabs
 *  that switch nested routes, distinct from the pill-track Tabs used for
 *  in-card view toggles. Sits directly under the page header. */
export function PageTabs({ items }: { items: Array<{ label: string; to: string; end?: boolean }> }) {
  return (
    <nav className="sl-page-tabs">
      {items.map((item) => (
        <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => "sl-page-tab" + (isActive ? " is-active" : "")}>
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
