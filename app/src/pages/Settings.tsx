import { PageShell } from "../components/layout/PageShell";
import { Card } from "../components/ui/Card";
import { useFilters } from "../context/FiltersContext";
import { useUi } from "../context/UiContext";

export default function Settings() {
  const { retailer, period, setRetailer, setPeriod, retailers, periods } = useFilters();
  const { toast, openAlert } = useUi();

  return (
    <PageShell title="Settings" subtitle="Workspace defaults, alerting and data refresh">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: "var(--app-gap)" }}>
        <Card padding="20px 22px" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Workspace defaults</h3>
          <div className="field">
            <label>Default retailer</label>
            <select className="input" value={retailer} onChange={(e) => setRetailer(e.target.value)}>
              {retailers.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Default reporting period</label>
            <select className="input" value={period} onChange={(e) => setPeriod(e.target.value)}>
              {periods.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <button className="btn btn-primary btn-block" onClick={() => toast("Workspace defaults saved.")}>Save defaults</button>
        </Card>

        <Card padding="20px 22px" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Thresholds</h3>
          <div className="field"><label>Availability threshold (%)</label><input className="input" type="number" defaultValue={95} min={0} max={100} /></div>
          <div className="field"><label>Share of search target (%)</label><input className="input" type="number" defaultValue={40} min={0} max={100} /></div>
          <div className="field"><label>Content completeness target</label><input className="input" type="number" defaultValue={95} min={0} max={100} /></div>
          <button className="btn btn-secondary btn-block" onClick={openAlert}>Configure an alert</button>
        </Card>

        <Card padding="20px 22px" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Data source</h3>
          <div className="sl-muted" style={{ fontSize: 13, lineHeight: 1.55 }}>Figures are served by the mock data layer. Point fetchSnapshot and fetchProduct at the FastAPI endpoints to go live — no component changes required.</div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, paddingTop: 12, borderTop: "1px solid var(--border-subtle)" }}><span className="sl-muted">Snapshot</span><span style={{ fontFamily: "monospace" }}>GET /api/snapshot</span></div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}><span className="sl-muted">Product detail</span><span style={{ fontFamily: "monospace" }}>GET /api/products/{"{id}"}</span></div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}><span className="sl-muted">Crawl cadence</span><span>Every 6 hours</span></div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}><span className="sl-muted">Retailers monitored</span><span>{retailers.length - 1}</span></div>
        </Card>
      </div>
    </PageShell>
  );
}
