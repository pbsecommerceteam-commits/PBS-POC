/** Column schema for the Shelfline data-import template -- mirrors, field
 *  for field, the real Content/Price/Share Of Search tabs and the separate
 *  MAP Price workbook that `app/scripts/build_mock_data.py` already reads
 *  (see that script's `load_sheet`/`load_map_price`/`content_completeness`),
 *  plus the new "Company" column every tab gets so a future upload can carry
 *  another client's data through the same template and pipeline. Kept as
 *  data (not duplicated parsing logic) so this module only has to describe
 *  the shape build_mock_data.py expects, never re-implement how it's used --
 *  the actual ETL math stays in one place, the Python script.  */

export type SheetName = "Content" | "Price" | "Share Of Search" | "MAP Price";

export const SHEET_NAMES: SheetName[] = ["Content", "Price", "Share Of Search", "MAP Price"];

/** The 7 retailer domains build_mock_data.py's SITE_TO_CODE recognizes --
 *  any other value in a Retailer site / site column can never map to a
 *  catalog product, so it's flagged at upload time rather than silently
 *  dropped later by the pipeline. */
export const KNOWN_RETAILER_SITES = [
  "amazon.com", "chewy.com", "walmart.com", "homedepot.com", "petsmart.com", "lowes.com", "petco.com",
];

const VARIANT_COLS = Array.from({ length: 22 }, (_, i) => [`Varient label ${i + 1}`, `Varient value ${i + 1}`]).flat();
const RANK_CATEGORY_COLS = ["Rank 1", "Rank 2", "Rank 3", "Rank 4", "Category 1", "Category 2", "Category 3", "Category 4"];
const BULLET_COLS = Array.from({ length: 10 }, (_, i) => `Bullet ${i + 1}`);
const OTHER_SELLER_COLS = Array.from({ length: 10 }, (_, i) => [`Other Seller ${i + 1} Name`, `Other Seller ${i + 1} Price`]).flat();
const SOS_SLOT_COLS = Array.from({ length: 65 }, (_, i) => [`Url_${i + 1}`, `Url_${i + 1}_Sponsored`, `Product_name_${i + 1}`, `Brand_${i + 1}`]).flat();

/** Identifier columns every tab leads with (see build_import_template.py's
 *  `reorder`) -- kept here too since importValidation.ts's per-row checks
 *  (Retailer site enum, required text) key off these same names. */
export const IDENTIFIER_COLS = ["SKU", "Retailer site", "Retailer id", "Url"];

export const CONTENT_HEADERS = [
  "SKU", "Retailer site", "Retailer id", "Url", "Crawl date", "Category/account name", "Brand", "Site category",
  "Buy box seller", "Buy box shipper", "Title", "Enhanced content", "Product description", "No of bullets",
  "Front image", "No of images", "No of videos", "Image 360", "Total reviews", "Rating", "No of questions",
  ...VARIANT_COLS, ...RANK_CATEGORY_COLS, ...BULLET_COLS,
];

export const PRICE_HEADERS = [
  "SKU", "Retailer site", "Retailer id", "Url", "Crawl date", "Product name", "Category/account name",
  "Site brand", "Buy box seller", "Buy box shipper", "Stock status", "List everyday price", "Current price",
  "Subscription price", "Coupon value", ...OTHER_SELLER_COLS,
];

export const SOS_HEADERS = ["site", "Crawl_date", "keyword", ...SOS_SLOT_COLS];

export const MAP_HEADERS = ["SKU", "Retailer site", "Retailer id", "Url", "Map Price"];

export const SHEET_HEADERS: Record<SheetName, string[]> = {
  "Content": CONTENT_HEADERS,
  "Price": PRICE_HEADERS,
  "Share Of Search": SOS_HEADERS,
  "MAP Price": MAP_HEADERS,
};

/** Every tab in the template gets this new first column. */
export const COMPANY_COL = "Company";

/** Sheets a real upload must contain data for -- Share Of Search and MAP
 *  Price are genuinely optional inputs to the pipeline (build_mock_data.py
 *  takes MAP as an optional 2nd file; Share Of Search only feeds
 *  backend-only keyword coverage, not shown on any page), so an upload
 *  missing rows there isn't an error, only Content/Price are. */
export const REQUIRED_SHEETS: SheetName[] = ["Content", "Price"];

export interface RowError {
  sheet: SheetName;
  /** 1-based row number as it appears in Excel (header is row 1). */
  row: number;
  column: string;
  issue: string;
}

export interface SheetIssue {
  sheet: SheetName;
  issue: string;
}
