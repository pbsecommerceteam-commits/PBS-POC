/** The product identity cell used in every product table and list — a
 *  deterministic monogram tile (no real product photography exists in the
 *  mock data, so we don't invent unrelated stock photos), the product name
 *  prominent, and SKU/category/retailer as muted metadata beneath it. */
export function ProductCell({ name, sku, meta }: { name: string; sku?: string; meta?: string }) {
  const initials = name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("");
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
      <span className="sl-avatar">{initials}</span>
      <div style={{ minWidth: 0 }}>
        <div className="sl-table-name" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{name}</div>
        {(sku || meta) && <div className="sl-table-sub">{[sku, meta].filter(Boolean).join(" · ")}</div>}
      </div>
    </div>
  );
}
