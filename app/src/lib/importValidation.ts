/** Client-side structural + row-level validation for an uploaded Shelfline
 *  data-import workbook -- runs entirely in the browser (no backend exists
 *  to do it server-side) using SheetJS to parse the .xlsx. Deliberately does
 *  NOT re-implement build_mock_data.py's scoring/rollup math in JS -- that
 *  would fork the "real logic" into two copies that could silently drift.
 *  This only checks the file is well-formed enough to run through that
 *  existing pipeline: right tabs, right columns, right types per cell --
 *  exactly the class of mistake a person filling in a spreadsheet by hand
 *  actually makes, caught before it reaches the pipeline. */
import { SHEET_NAMES, SHEET_HEADERS, COMPANY_COL, REQUIRED_SHEETS, KNOWN_RETAILER_SITES, type SheetName, type RowError, type SheetIssue } from "./importSchema";

export interface ParsedSheet {
  sheet: SheetName;
  headers: string[];
  /** Row objects keyed by header name, one per data row (header row excluded). */
  rows: Record<string, unknown>[];
}

export interface ValidationResult {
  fileName: string;
  parsedAt: string;
  sheets: ParsedSheet[];
  sheetIssues: SheetIssue[];
  rowErrors: RowError[];
  counts: Record<SheetName, number>;
  ok: boolean;
}

function isBlankRow(row: unknown[]) {
  return row.every((c) => c === null || c === undefined || c === "");
}

function numericOrBlank(v: unknown) {
  if (v === null || v === undefined || v === "") return true;
  return typeof v === "number" || (typeof v === "string" && v.trim() !== "" && !isNaN(Number(v)));
}

function parsesAsDate(v: unknown) {
  if (v === null || v === undefined || v === "") return false;
  if (v instanceof Date) return !isNaN(v.getTime());
  if (typeof v === "number") return true; // Excel serial date
  if (typeof v === "string") return !isNaN(Date.parse(v));
  return false;
}

/** Per-sheet extra checks beyond "required column non-empty" / "known
 *  retailer site" / "numeric field" -- one small function per tab, mirroring
 *  exactly the fields build_mock_data.py's content_completeness()/
 *  price_value()/load_map_price() read. */
const SITE_COLUMN: Partial<Record<SheetName, string>> = {
  "Content": "Retailer site",
  "Price": "Retailer site",
  "Share Of Search": "site",
  "MAP Price": "Retailer site",
};

const DATE_COLUMN: Partial<Record<SheetName, string>> = {
  "Content": "Crawl date",
  "Price": "Crawl date",
  "Share Of Search": "Crawl_date",
};

const REQUIRED_TEXT_COLUMNS: Partial<Record<SheetName, string[]>> = {
  "Content": ["Retailer id", "Category/account name", "Brand", "Title"],
  "Price": ["Retailer id"],
  "Share Of Search": ["keyword"],
  "MAP Price": ["Retailer id"],
};

const OTHER_SELLER_PRICE_COLUMNS = Array.from({ length: 10 }, (_, i) => `Other Seller ${i + 1} Price`);

const NUMERIC_COLUMNS: Partial<Record<SheetName, string[]>> = {
  "Content": ["No of images", "No of videos", "No of bullets", "No of questions", "Rating", "Total reviews"],
  "Price": ["List everyday price", "Current price", "Subscription price", ...OTHER_SELLER_PRICE_COLUMNS],
  "MAP Price": ["Map Price"],
};

export async function validateWorkbook(file: File): Promise<ValidationResult> {
  /* Dynamically imported so the ~1MB SheetJS parser only ever loads for
     someone who actually opens Data Import, not on every page load. */
  const XLSX = await import("xlsx");
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array", cellDates: false });

  const sheetIssues: SheetIssue[] = [];
  const rowErrors: RowError[] = [];
  const sheets: ParsedSheet[] = [];
  const counts = { "Content": 0, "Price": 0, "Share Of Search": 0, "MAP Price": 0 } as Record<SheetName, number>;

  for (const name of SHEET_NAMES) {
    const ws = wb.Sheets[name];
    if (!ws) {
      if (REQUIRED_SHEETS.includes(name)) sheetIssues.push({ sheet: name, issue: `Required tab "${name}" is missing from this workbook.` });
      continue;
    }
    const raw: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null, raw: true });
    if (raw.length === 0 || isBlankRow(raw[0] as unknown[])) {
      sheetIssues.push({ sheet: name, issue: `Tab "${name}" has no header row.` });
      continue;
    }
    const headerRow = (raw[0] as unknown[]).map((h) => (h == null ? "" : String(h).trim()));
    const expected = [COMPANY_COL, ...SHEET_HEADERS[name]];
    const missing = expected.filter((h) => !headerRow.includes(h));
    const extra = headerRow.filter((h) => h && !expected.includes(h));
    if (missing.length) sheetIssues.push({ sheet: name, issue: `Missing column${missing.length > 1 ? "s" : ""}: ${missing.join(", ")}` });
    if (extra.length) sheetIssues.push({ sheet: name, issue: `Unexpected column${extra.length > 1 ? "s" : ""} (renamed or extra): ${extra.join(", ")}` });
    if (headerRow[0] !== COMPANY_COL) sheetIssues.push({ sheet: name, issue: `The first column must be "${COMPANY_COL}" (found "${headerRow[0] || "(blank)"}").` });

    const dataRows = raw.slice(1).filter((r) => !isBlankRow(r as unknown[]));
    const rows: Record<string, unknown>[] = dataRows.map((r) => {
      const obj: Record<string, unknown> = {};
      headerRow.forEach((h, i) => { if (h) obj[h] = (r as unknown[])[i] ?? null; });
      return obj;
    });
    sheets.push({ sheet: name, headers: headerRow, rows });
    counts[name] = rows.length;

    const siteCol = SITE_COLUMN[name];
    const dateCol = DATE_COLUMN[name];
    const requiredText = REQUIRED_TEXT_COLUMNS[name] || [];
    const numericCols = NUMERIC_COLUMNS[name] || [];

    rows.forEach((row, i) => {
      const excelRow = i + 2; // +1 for header, +1 for 1-based
      const company = row[COMPANY_COL];
      if (company === null || company === undefined || String(company).trim() === "") {
        rowErrors.push({ sheet: name, row: excelRow, column: COMPANY_COL, issue: "Company is required on every row." });
      }
      for (const col of requiredText) {
        const v = row[col];
        if (v === null || v === undefined || String(v).trim() === "") {
          rowErrors.push({ sheet: name, row: excelRow, column: col, issue: "Required field is blank." });
        }
      }
      if (siteCol) {
        const v = row[siteCol];
        if (v !== null && v !== undefined && String(v).trim() !== "") {
          const norm = String(v).trim().toLowerCase();
          if (!KNOWN_RETAILER_SITES.includes(norm)) {
            rowErrors.push({ sheet: name, row: excelRow, column: siteCol, issue: `Unknown retailer site "${v}" -- must be one of ${KNOWN_RETAILER_SITES.join(", ")}.` });
          }
        } else {
          rowErrors.push({ sheet: name, row: excelRow, column: siteCol, issue: "Retailer site is required." });
        }
      }
      if (dateCol) {
        const v = row[dateCol];
        if (!parsesAsDate(v)) {
          rowErrors.push({ sheet: name, row: excelRow, column: dateCol, issue: `"${v ?? ""}" is not a valid date.` });
        }
      }
      for (const col of numericCols) {
        const v = row[col];
        if (!numericOrBlank(v)) {
          rowErrors.push({ sheet: name, row: excelRow, column: col, issue: `"${v}" is not a number.` });
        }
      }
      if (name === "Content") {
        const rating = row["Rating"];
        if (typeof rating === "number" && (rating < 0 || rating > 5)) {
          rowErrors.push({ sheet: name, row: excelRow, column: "Rating", issue: `Rating ${rating} is outside the valid 0-5 range.` });
        }
        const enhanced = row["Enhanced content"];
        if (enhanced !== null && enhanced !== undefined && String(enhanced).trim() !== "") {
          const norm = String(enhanced).trim().toLowerCase();
          if (norm !== "yes" && norm !== "no") {
            rowErrors.push({ sheet: name, row: excelRow, column: "Enhanced content", issue: `"${enhanced}" should be "Yes" or "No".` });
          }
        }
      }
    });
  }

  return {
    fileName: file.name,
    parsedAt: new Date().toISOString(),
    sheets,
    sheetIssues,
    rowErrors,
    counts,
    ok: sheetIssues.length === 0 && rowErrors.length === 0,
  };
}
