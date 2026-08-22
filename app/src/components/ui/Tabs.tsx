export interface TabOption<T extends string> {
  id: T;
  label: string;
}

/** A pill-track segmented control — replaces the prototype's radio-based
 *  `.seg` control and the "mode" button rows on charts. Used for both page
 *  view switches (Trend | Retailer | Category) and table view switches
 *  (Top sellers | Fastest growing | Declining). */
export function Tabs<T extends string>({ options, value, onChange, size = "md" }: {
  options: Array<TabOption<T>>;
  value: T;
  onChange: (id: T) => void;
  size?: "sm" | "md";
}) {
  return (
    <div className="sl-tabs" role="tablist" style={size === "sm" ? { padding: 2 } : undefined}>
      {options.map((o) => (
        <button
          key={o.id} type="button" role="tab" aria-selected={value === o.id}
          className={"sl-tab" + (value === o.id ? " is-active" : "")}
          style={size === "sm" ? { padding: "4px 10px", fontSize: 12 } : undefined}
          onClick={() => onChange(o.id)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
