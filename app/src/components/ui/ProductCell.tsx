import { useState } from "react";

/** The product identity cell used in every product table and list. Shows the
 *  real crawled product photo when one downloaded cleanly (115 of 116 did —
 *  see reports/shelfline_assessment.pdf); falls back to a deterministic
 *  monogram tile for the one dead image link or if a photo is missing. */
export function ProductCell({ id, name, sku, meta, nameLines = 1, imageSize = 34 }: { id?: string; name: string; sku?: string; meta?: string; nameLines?: number; imageSize?: number }) {
  const initials = name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("");
  const [broken, setBroken] = useState(false);
  const showPhoto = id && !broken;
  /* nameLines > 1 shows the full product name across a fixed number of
     lines instead of clipping to one -- still bounded (so every row in a
     table stays the same height), but much less likely to actually
     truncate a real product title than the 1-line default used in dense
     tables. */
  const nameStyle = nameLines > 1
    // whiteSpace must be set explicitly here -- it's inherited, and the
    // ancestor table cell forces nowrap (see app.css's row-height-
    // consistency rule), which would otherwise stop this box from ever
    // wrapping past line 1 regardless of WebkitLineClamp. minHeight (not
    // just the line-clamp max) is what makes row height actually uniform --
    // line-clamp alone only caps how tall a *long* name can get, so a short
    // 1-line name would otherwise render shorter than its neighbors. 58px =
    // 3 lines at this font-size/line-height -- must match content/
    // Products.tsx's own text-column CLAMP_STYLE (also 58px) so every
    // clamped cell in a row bottoms out at the same height.
    ? { display: "-webkit-box", WebkitLineClamp: nameLines, WebkitBoxOrient: "vertical" as const, overflow: "hidden", textOverflow: "ellipsis", lineHeight: 1.35, whiteSpace: "normal" as const, minHeight: 58 }
    : { whiteSpace: "nowrap" as const, overflow: "hidden", textOverflow: "ellipsis" };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
      {showPhoto ? (
        <img
          src={`${import.meta.env.BASE_URL}product-images/${id}.jpg`}
          alt=""
          width={imageSize}
          height={imageSize}
          style={{ borderRadius: "var(--radius-sm)", objectFit: "cover", flex: "none", background: "var(--surface-secondary)" }}
          onError={() => setBroken(true)}
        />
      ) : (
        <span className="sl-avatar" style={imageSize !== 34 ? { width: imageSize, height: imageSize } : undefined}>{initials}</span>
      )}
      <div style={{ minWidth: 0 }}>
        <div className="sl-table-name" style={nameStyle}>{name}</div>
        {(sku || meta) && <div className="sl-table-sub">{[sku, meta].filter(Boolean).join(" · ")}</div>}
      </div>
    </div>
  );
}
