import { useState } from "react";

/** The product identity cell used in every product table and list. Shows the
 *  real crawled product photo when one downloaded cleanly (115 of 116 did —
 *  see reports/shelfline_assessment.pdf); falls back to a deterministic
 *  monogram tile for the one dead image link or if a photo is missing. */
export function ProductCell({ id, name, sku, meta, nameLines = 1 }: { id?: string; name: string; sku?: string; meta?: string; nameLines?: number }) {
  const initials = name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("");
  const [broken, setBroken] = useState(false);
  const showPhoto = id && !broken;
  /* nameLines > 1 shows the full product name across a fixed number of
     lines instead of clipping to one -- still bounded (so every row in a
     table stays the same height), but much less likely to actually
     truncate a real product title than the 1-line default used in dense
     tables. */
  const nameStyle = nameLines > 1
    ? { display: "-webkit-box", WebkitLineClamp: nameLines, WebkitBoxOrient: "vertical" as const, overflow: "hidden", textOverflow: "ellipsis", lineHeight: 1.3 }
    : { whiteSpace: "nowrap" as const, overflow: "hidden", textOverflow: "ellipsis" };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
      {showPhoto ? (
        <img
          src={`${import.meta.env.BASE_URL}product-images/${id}.jpg`}
          alt=""
          width={34}
          height={34}
          style={{ borderRadius: "var(--radius-sm)", objectFit: "cover", flex: "none", background: "var(--surface-secondary)" }}
          onError={() => setBroken(true)}
        />
      ) : (
        <span className="sl-avatar">{initials}</span>
      )}
      <div style={{ minWidth: 0 }}>
        <div className="sl-table-name" style={nameStyle}>{name}</div>
        {(sku || meta) && <div className="sl-table-sub">{[sku, meta].filter(Boolean).join(" · ")}</div>}
      </div>
    </div>
  );
}
