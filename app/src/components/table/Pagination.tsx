/** Shared pager for every paginated table (products, keywords) — page
 *  numbers, previous/next, and a "Showing X–Y of Z" label. */
export function Pagination({ page, totalPages, total, pageSize, onPage, label }: {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPage: (p: number) => void;
  label?: string;
}) {
  if (total <= pageSize) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", paddingTop: 14, marginTop: 4, borderTop: "1px solid var(--border-subtle)" }}>
      <div className="sl-muted" style={{ fontSize: 12.5 }}>{label || `Showing ${from}–${to} of ${total}`}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <button className="btn btn-secondary" onClick={() => onPage(Math.max(1, page - 1))} disabled={page === 1} style={{ minHeight: 30, fontSize: 12.5 }}>Previous</button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
          <button key={n} className={"btn " + (n === page ? "btn-primary" : "btn-secondary")} onClick={() => onPage(n)} style={{ minWidth: 30, minHeight: 30, fontSize: 12.5 }}>{n}</button>
        ))}
        <button className="btn btn-secondary" onClick={() => onPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} style={{ minHeight: 30, fontSize: 12.5 }}>Next</button>
      </div>
    </div>
  );
}
