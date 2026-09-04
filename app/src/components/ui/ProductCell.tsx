import { useState } from "react";

/** The product identity cell used in every product table and list. Tries a
 *  locally-downloaded photo first (public/product-images/{id}.jpg -- fast,
 *  no external dependency, present for a handful of SKUs), then the real
 *  front-of-listing photo the crawl itself captured (`imageUrl`, hotlinked
 *  from the retailer's own CDN -- covers effectively the whole catalog),
 *  and only falls back to a deterministic monogram tile once both a real
 *  local and real remote photo have failed to load. Never falls back to a
 *  placeholder/stock image -- every photo shown is a genuine crawled photo
 *  of that SKU, or it's the monogram. */
export function ProductCell({ id, name, sku, meta, imageUrl, nameLines = 1, noClamp = false, imageSize = 34 }: { id?: string; name: string; sku?: string; meta?: string; imageUrl?: string | null; nameLines?: number; noClamp?: boolean; imageSize?: number }) {
  const initials = name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("");
  const [stage, setStage] = useState<"local" | "remote" | "initials">(id ? "local" : imageUrl ? "remote" : "initials");
  const src = stage === "local" ? `${import.meta.env.BASE_URL}product-images/${id}.jpg` : stage === "remote" ? imageUrl! : undefined;
  /* nameLines > 1 shows the full product name across a fixed number of
     lines instead of clipping to one -- still bounded (so every row in a
     table stays the same height), but much less likely to actually
     truncate a real product title than the 1-line default used in dense
     tables. noClamp drops the line limit entirely -- the name wraps onto
     as many lines as it needs and nothing is ever cut off, at the cost of
     uniform row height (a table asking for this wants the full text, not
     a tidy grid). */
  const nameStyle = noClamp
    ? { whiteSpace: "normal" as const, overflow: "visible", textOverflow: "clip", lineHeight: 1.35 }
    : nameLines > 1
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
      {src ? (
        <img
          src={src}
          alt=""
          width={imageSize}
          height={imageSize}
          style={{ borderRadius: "var(--radius-sm)", objectFit: "cover", flex: "none", background: "var(--surface-secondary)" }}
          onError={() => setStage((s) => (s === "local" && imageUrl ? "remote" : "initials"))}
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
