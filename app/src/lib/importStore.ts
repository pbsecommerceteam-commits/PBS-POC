/** Browser-local staging for a validated data import -- there's no backend
 *  (see CLAUDE.md), so "apply the upload" can't mean writing to a live
 *  database. What it means today: keep the validated file on this device so
 *  it isn't lost, and hand it off to the same Python ETL + splice + commit
 *  workflow every real data refresh in this project has used, run on
 *  request rather than automatically -- that keeps a single source of truth
 *  for the transform logic (build_mock_data.py) instead of forking a second
 *  copy of it into the browser. */

export type ImportMode = "update" | "add";

export interface PendingImport {
  id: string;
  fileName: string;
  mode: ImportMode;
  company: string;
  uploadedAt: string;
  counts: { Content: number; Price: number; "Share Of Search": number; "MAP Price": number };
  /** Base64-encoded .xlsx bytes, so the exact validated file survives a
   *  reload/tab-close and can be handed off later without asking the user
   *  to find and re-attach it. */
  dataBase64: string;
}

export interface ImportHistoryEntry {
  id: string;
  fileName: string;
  mode: ImportMode;
  company: string;
  uploadedAt: string;
  rowCount: number;
}

const PENDING_KEY = "shelfline:pendingImport";
const HISTORY_KEY = "shelfline:importHistory";
const HISTORY_LIMIT = 10;

export function getPendingImport(): PendingImport | null {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    return raw ? (JSON.parse(raw) as PendingImport) : null;
  } catch {
    return null;
  }
}

export function savePendingImport(imp: PendingImport) {
  localStorage.setItem(PENDING_KEY, JSON.stringify(imp));
  const history = getImportHistory();
  history.unshift({ id: imp.id, fileName: imp.fileName, mode: imp.mode, company: imp.company, uploadedAt: imp.uploadedAt, rowCount: imp.counts.Content + imp.counts.Price });
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, HISTORY_LIMIT)));
}

export function clearPendingImport() {
  localStorage.removeItem(PENDING_KEY);
}

export function getImportHistory(): ImportHistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as ImportHistoryEntry[]) : [];
  } catch {
    return [];
  }
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] || "");
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function base64ToBlob(base64: string, mime = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") {
  const bytes = atob(base64);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return new Blob([arr], { type: mime });
}
