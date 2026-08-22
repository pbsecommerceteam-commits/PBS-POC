import { Card } from "./Card";

export interface FacetOption {
  id: string;
  label: string;
  count: number;
}

export interface FacetGroup {
  id: string;
  title: string;
  options: FacetOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

/** A left-rail faceted filter — checkbox groups with live counts, each
 *  group ORs its own selections (checking "Critical" and "Warning" shows
 *  either) while groups AND together. Mirrors the filter-rail pattern
 *  mature commerce-analytics tools use on their product list views,
 *  replacing a single-select segmented control with something that scales
 *  to several filter dimensions at once. */
export function FacetPanel({ groups, onClearAll }: { groups: FacetGroup[]; onClearAll?: () => void }) {
  const anySelected = groups.some((g) => g.selected.length > 0);
  const toggle = (g: FacetGroup, id: string) => {
    g.onChange(g.selected.includes(id) ? g.selected.filter((x) => x !== id) : g.selected.concat(id));
  };
  return (
    <Card padding="18px 16px" style={{ width: 220, flex: "none" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 14 }}>
        <span style={{ fontWeight: 600, fontSize: 13.5 }}>Filters</span>
        {anySelected && onClearAll && <button className="btn btn-ghost" onClick={onClearAll} style={{ fontSize: 11.5, padding: 0 }}>Clear all</button>}
      </div>
      <div className="sl-facets">
        {groups.map((g) => (
          <div key={g.id}>
            <div className="sl-facet-group__title">{g.title}</div>
            {g.options.map((o) => {
              const disabled = o.count === 0 && !g.selected.includes(o.id);
              return (
                <label key={o.id} className={"sl-facet-option" + (disabled ? " is-disabled" : "")}>
                  <input type="checkbox" checked={g.selected.includes(o.id)} disabled={disabled} onChange={() => toggle(g, o.id)} />
                  <span>{o.label}</span>
                  <span className="sl-facet-option__count">{o.count.toLocaleString()}</span>
                </label>
              );
            })}
          </div>
        ))}
      </div>
    </Card>
  );
}
