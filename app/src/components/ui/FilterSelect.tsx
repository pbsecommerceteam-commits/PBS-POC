/** A filter control styled as a single polished chip — label, current
 *  value and a chevron — wrapping a native <select> for full keyboard/
 *  a11y support without hand-building a listbox. Used across the global
 *  filter bar and contextual page filters so every dropdown in the app
 *  looks and behaves the same way. */
export function FilterSelect({ label, value, onChange, options, width }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ id: string; name: string }>;
  width?: number;
}) {
  return (
    <label className="sl-filter" style={width ? { width } : undefined}>
      <span className="sl-filter__label">{label}</span>
      <select
        className="sl-native-select sl-filter__value"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
      </select>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="sl-filter__chevron">
        <path d="M6 9l6 6 6-6"></path>
      </svg>
    </label>
  );
}
