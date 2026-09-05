import { useRef, useState } from "react";
import { PageShell } from "../components/layout/PageShell";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { InfoTip } from "../components/ui/InfoTip";
import { useUi } from "../context/UiContext";
import { validateWorkbook, type ValidationResult } from "../lib/importValidation";
import { getPendingImport, savePendingImport, clearPendingImport, getImportHistory, fileToBase64, base64ToBlob, type ImportMode, type PendingImport } from "../lib/importStore";

const TEMPLATE_URL = import.meta.env.BASE_URL + "templates/shelfline-data-import-template.xlsx";

function downloadBlob(filename: string, blob: Blob) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

export default function ImportData() {
  const { toast } = useUi();
  const fileRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<ImportMode>("update");
  const [company, setCompany] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [pending, setPending] = useState<PendingImport | null>(getPendingImport());
  const [history, setHistory] = useState(getImportHistory());

  const onPickFile = (f: File | null) => {
    setFile(f);
    setResult(null);
  };

  const onValidate = async () => {
    if (!file) { toast("Choose a file first."); return; }
    if (mode === "add" && !company.trim()) { toast("Enter the client's Company name for a new-data upload."); return; }
    setBusy(true);
    try {
      const r = await validateWorkbook(file);
      setResult(r);
      if (r.ok) toast(`No errors found across ${r.counts.Content + r.counts.Price} rows.`);
      else toast(`Found ${r.sheetIssues.length + r.rowErrors.length} issue${r.sheetIssues.length + r.rowErrors.length === 1 ? "" : "s"} — fix and re-upload.`);
    } catch {
      toast("Couldn't read that file — make sure it's the .xlsx template.");
    } finally {
      setBusy(false);
    }
  };

  const onSaveStaged = async () => {
    if (!file || !result || !result.ok) return;
    const dataBase64 = await fileToBase64(file);
    const imp: PendingImport = {
      id: crypto.randomUUID(),
      fileName: file.name,
      mode,
      company: company.trim() || "Perfality",
      uploadedAt: new Date().toISOString(),
      counts: result.counts,
      dataBase64,
    };
    savePendingImport(imp);
    setPending(imp);
    setHistory(getImportHistory());
    toast("Saved to this browser. See below for how to make it live.");
  };

  const onClearStaged = () => {
    clearPendingImport();
    setPending(null);
    toast("Removed the staged import.");
  };

  const onDownloadStaged = () => {
    if (!pending) return;
    downloadBlob(pending.fileName, base64ToBlob(pending.dataBase64));
  };

  const errorsToShow = result ? result.rowErrors.slice(0, 200) : [];

  return (
    <PageShell title="Data Import" subtitle="Upload a refreshed or new crawl using the real 4-tab template">
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.3fr) minmax(280px,0.7fr)", gap: "var(--app-gap)", alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--app-gap)" }}>
          <Card padding="20px 22px" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                1. Get the template
                <InfoTip text="A real .xlsx pre-filled with the current 117-SKU crawl (Content, Price, Share Of Search, MAP Price tabs), so you can see exactly the format expected. Fill in changed or new rows, keeping every column header exactly as-is." />
              </h3>
              <div className="sl-muted" style={{ fontSize: 13, marginTop: 4, lineHeight: 1.5 }}>
                Same 4 tabs the data pipeline already reads, plus a Company column so another client's data can use this same template later.
              </div>
            </div>
            <a className="btn btn-secondary btn-block" href={TEMPLATE_URL} download="shelfline-data-import-template.xlsx">
              Download prefilled template (.xlsx)
            </a>
          </Card>

          <Card padding="20px 22px" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>2. Upload your file</h3>

            <div className="field">
              <label>What is this upload?</label>
              <div className="seg">
                <label className="seg-opt">
                  <input type="radio" name="import-mode" checked={mode === "update"} onChange={() => setMode("update")} />
                  Update existing data
                </label>
                <label className="seg-opt">
                  <input type="radio" name="import-mode" checked={mode === "add"} onChange={() => setMode("add")} />
                  Add new data
                </label>
              </div>
              <div className="sl-muted" style={{ fontSize: 12, marginTop: 6 }}>
                {mode === "update"
                  ? "Re-crawled rows for SKUs already tracked (same Company + Retailer site + Retailer id) — refreshes their history."
                  : "New SKUs, a new retailer, or a whole new client — appended rather than replacing anything."}
              </div>
            </div>

            {mode === "add" && (
              <div className="field">
                <label>Company</label>
                <input className="input" placeholder="e.g. Acme Pet Co." value={company} onChange={(e) => setCompany(e.target.value)} />
              </div>
            )}

            <div className="field">
              <label>File</label>
              <input ref={fileRef} className="input" type="file" accept=".xlsx" onChange={(e) => onPickFile(e.target.files?.[0] || null)} />
            </div>

            <button className="btn btn-primary btn-block" onClick={onValidate} disabled={!file || busy}>
              {busy ? "Checking…" : "Check for errors"}
            </button>
          </Card>

          {result && (
            <Card padding="20px 22px" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>3. Review</h3>
                <Badge tone={result.ok ? "positive" : "critical"}>
                  {result.ok ? "No errors" : `${result.sheetIssues.length + result.rowErrors.length} issue${result.sheetIssues.length + result.rowErrors.length === 1 ? "" : "s"}`}
                </Badge>
              </div>
              <div style={{ display: "flex", gap: 18, flexWrap: "wrap", fontSize: 12.5 }}>
                {(["Content", "Price", "Share Of Search", "MAP Price"] as const).map((s) => (
                  <div key={s}><span className="sl-muted">{s}</span> · <strong>{result.counts[s]}</strong> rows</div>
                ))}
              </div>

              {result.sheetIssues.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {result.sheetIssues.map((si, i) => (
                    <div key={i} style={{ fontSize: 12.5, color: "var(--status-critical-fg)" }}>
                      <strong>{si.sheet}:</strong> {si.issue}
                    </div>
                  ))}
                </div>
              )}

              {result.rowErrors.length > 0 && (
                <div style={{ maxHeight: 360, overflow: "auto", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)" }}>
                  <table className="sl-table">
                    <thead>
                      <tr><th>Tab</th><th>Row</th><th>Column</th><th>Issue</th></tr>
                    </thead>
                    <tbody>
                      {errorsToShow.map((e, i) => (
                        <tr key={i}>
                          <td>{e.sheet}</td>
                          <td>{e.row}</td>
                          <td>{e.column}</td>
                          <td style={{ whiteSpace: "normal" }}>{e.issue}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {result.rowErrors.length > errorsToShow.length && (
                    <div className="sl-muted" style={{ fontSize: 12, padding: "8px 12px" }}>
                      +{result.rowErrors.length - errorsToShow.length} more — fix these first, then re-check.
                    </div>
                  )}
                </div>
              )}

              {result.ok ? (
                <>
                  <div className="sl-muted" style={{ fontSize: 12.5, lineHeight: 1.5 }}>
                    This file is well-formed and ready. Shelfline has no backend yet (see Settings → Data source), so
                    saving here keeps the validated file safely on this device — it still needs to be run through the
                    same data pipeline used for every real refresh in this project (build_mock_data.py → splice into
                    mockData.ts → commit) before it shows up on the dashboard.
                  </div>
                  <button className="btn btn-primary btn-block" onClick={onSaveStaged}>Save to this browser</button>
                </>
              ) : (
                <div className="sl-muted" style={{ fontSize: 12.5 }}>Fix the flagged cells in the spreadsheet and upload again — nothing is saved while errors remain.</div>
              )}
            </Card>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "var(--app-gap)" }}>
          <Card padding="18px 20px" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Staged import</h3>
            {pending ? (
              <>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{pending.fileName}</div>
                <div className="sl-muted" style={{ fontSize: 12 }}>
                  {pending.mode === "update" ? "Update" : "Add new"} · {pending.company} · {new Date(pending.uploadedAt).toLocaleString()}
                </div>
                <div className="sl-muted" style={{ fontSize: 12 }}>{pending.counts.Content} content rows · {pending.counts.Price} price rows</div>
                <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                  <button className="btn btn-secondary" style={{ flex: 1 }} onClick={onDownloadStaged}>Download</button>
                  <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClearStaged}>Remove</button>
                </div>
              </>
            ) : (
              <div className="sl-muted" style={{ fontSize: 12.5 }}>No validated file is staged yet.</div>
            )}
          </Card>

          {history.length > 0 && (
            <Card padding="18px 20px" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Recent uploads</h3>
              {history.map((h) => (
                <div key={h.id} style={{ fontSize: 12.5, paddingBottom: 8, borderBottom: "1px solid var(--border-subtle)" }}>
                  <div style={{ fontWeight: 500 }}>{h.fileName}</div>
                  <div className="sl-muted">{h.mode === "update" ? "Update" : "Add new"} · {h.company} · {new Date(h.uploadedAt).toLocaleDateString()}</div>
                </div>
              ))}
            </Card>
          )}

          <Card padding="18px 20px" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>How this works</h3>
            <div className="sl-muted" style={{ fontSize: 12.5, lineHeight: 1.6 }}>
              Shelfline is a proof of concept with no live backend yet — the dashboard is generated from a real crawl
              file, not entered by hand. This page checks a new crawl file is well-formed and keeps it safely staged
              in your browser; turning a staged file into new dashboard numbers is a short manual step (rerunning the
              same pipeline every prior data refresh has used) rather than something this page fabricates on the spot.
            </div>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
