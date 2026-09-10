import { useFilters } from "../../context/FiltersContext";
import { catalog, retailers } from "../../data/mockData";

/** Gates the whole authenticated app behind a company picker -- with more
 *  than one client's real data now sharing this workspace, there's no
 *  honest "default" view: blending Perfality's numbers with an unrelated
 *  company's would produce a meaningless average. Nothing renders as "the
 *  workspace" until a company is explicitly chosen (see FiltersContext's
 *  `company` field), same principle as RequireAuth gating on sign-in. */
export function RequireCompany({ children }: { children: React.ReactNode }) {
  const { company, setCompany, companies } = useFilters();
  if (!company) {
    return <CompanyPicker companies={companies} onPick={setCompany} />;
  }
  return <>{children}</>;
}

function CompanyPicker({ companies, onPick }: { companies: string[]; onPick: (name: string) => void }) {
  const stats = companies.map((name) => {
    const rows = (catalog as any[]).filter((p) => p.company === name);
    const retailerCodes = new Set(rows.map((p) => p.retailer));
    return { name, skus: rows.length, retailerCount: retailerCodes.size };
  });

  return (
    <div style={{ minHeight: "100vh", width: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "var(--surface-page)", padding: 32 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <div className="sl-brand-mark" style={{ width: 34, height: 34, fontSize: 14 }}>PI</div>
        <div style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 18 }}>Perfality Intelligence System</div>
      </div>
      <h1 style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 22, margin: "18px 0 6px" }}>Choose a company</h1>
      <p className="sl-muted" style={{ fontSize: 13.5, margin: "0 0 28px", textAlign: "center", maxWidth: 420 }}>
        This workspace now tracks {companies.length} companies' real crawl data. Pick one to scope every page to its own
        retailers, products and numbers — never blended across companies.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 14, width: "100%", maxWidth: 760 }}>
        {stats.map((s) => (
          <button
            key={s.name}
            onClick={() => onPick(s.name)}
            className="sl-card-surface sl-card-surface--interactive"
            style={{ textAlign: "left", padding: "18px 20px", cursor: "pointer", border: "1px solid var(--border-subtle)", background: "var(--surface-primary)" }}
          >
            <div style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 16 }}>{s.name}</div>
            <div className="sl-muted" style={{ fontSize: 12.5, marginTop: 6 }}>{s.skus} tracked SKUs · {s.retailerCount} retailer{s.retailerCount === 1 ? "" : "s"}</div>
          </button>
        ))}
      </div>
      <div className="sl-faint" style={{ fontSize: 11.5, marginTop: 28 }}>{retailers.length - 1} retailer codes tracked in total across every company</div>
    </div>
  );
}
