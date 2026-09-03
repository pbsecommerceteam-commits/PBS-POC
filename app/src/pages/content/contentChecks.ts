import type { Product } from "../../models/types";

/* A product's `contentChecks` array holds the FAILED rubric-check ids (see
   mockData.ts's CONTENT_CHECK_LABELS and build_mock_data.py's
   content_completeness()) -- passing is simply "not in that list",
   already real, computed data with no new ETL field needed. Each check is
   a binary pass/fail (there's no partial-credit rubric underneath), so
   its "score" is exactly 100 or 0 -- matching how Content Score itself is
   built (sum of 8 such 0/100 checks / 8), just not yet averaged across
   checks. Shared by Products.tsx (per-SKU score columns) and Brands.tsx
   (per-brand pass-rate rollup) so the two never define the checks
   differently. */
export const passFail = (p: Product, id: string) => !p.contentChecks.includes(id);

/* One entry per individual rubric check behind Content Score/Content
   Completeness. "Enhanced" is deliberately not included: it's already
   its own Yes/No column on the product table (enhancedContent) with
   identical pass/fail semantics -- the check IS the raw flag, no
   threshold logic. */
export const CHECK_COLUMNS: { key: string; id: string; label: string }[] = [
  { key: "titleScore", id: "title", label: "Title Score" },
  { key: "imagesScore", id: "images", label: "Images Score" },
  { key: "bulletCountScore", id: "bulletCount", label: "Bullet Count Score" },
  { key: "bulletCapsScore", id: "bulletCaps", label: "Bullet Caps Score" },
  { key: "bulletLengthScore", id: "bulletLength", label: "Bullet Length Score" },
  { key: "descriptionScore", id: "description", label: "Description Score" },
  { key: "ratingScore", id: "rating", label: "Rating Score" },
];
