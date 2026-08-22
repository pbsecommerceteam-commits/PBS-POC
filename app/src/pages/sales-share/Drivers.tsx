import { useNavigate, useOutletContext } from "react-router-dom";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { AiInsightBanner } from "../../components/ui/AiInsightBanner";
import { useUi } from "../../context/UiContext";
import { delta, deltaColor, signedMoney, signedPct, pct } from "../../lib/format";
import type { SalesShareContext } from "./Layout";

export default function SalesShareDrivers() {
  const { sd, setCategoryFilter } = useOutletContext<SalesShareContext>();
  const { toast } = useUi();
  const navigate = useNavigate();

  const maxDriverAbs = Math.max(...sd.drivers.concat(sd.headwinds).map((x: any) => Math.abs(x.delta)), 1);

  return (
    <>
      <Card padding="20px 22px">
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>{sd.totals.growth >= 0 ? `Sales up ${Math.abs(sd.totals.growth).toFixed(1)}% — shelf signals behind the move` : `Sales down ${Math.abs(sd.totals.growth).toFixed(1)}% — possible shelf drivers`}</h3>
          <span className="sl-muted" style={{ fontSize: 12 }}>Digital shelf signals measured over the same period</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,150px),1fr))", gap: "16px 22px", alignItems: "start" }}>
          <div style={{ minWidth: 0, paddingRight: 18, borderRight: "1px solid var(--border-subtle)" }}>
            <div className="sl-eyebrow">Sales</div>
            <div style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 26, lineHeight: 1.05, marginTop: 5, color: deltaColor(sd.totals.growth) }}>{signedPct(sd.totals.growth)}</div>
            <div className="sl-muted" style={{ fontSize: 11.5 }}>{signedMoney(sd.totals.sales - sd.totals.previous)} vs previous period</div>
          </div>
          {sd.signals.map((s: any) => (
            <div key={s.label} style={{ minWidth: 0 }}>
              <div className="sl-eyebrow">{s.label}</div>
              <div style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 19, lineHeight: 1.1, marginTop: 5 }}>{s.value}</div>
              <div style={{ fontSize: 12, color: deltaColor(s.delta) }}>{delta(s.delta, s.unit)}</div>
            </div>
          ))}
        </div>
      </Card>

      <AiInsightBanner
        action={
          <button className="btn btn-ai" onClick={() => { navigate(`/digital-shelf/products?focus=${sd.diagnosis.focus}`); toast("Digital Shelf filtered to " + sd.diagnosis.actionLabel.replace("Investigate ", "") + "."); }} style={{ alignSelf: "flex-start", minHeight: 32, whiteSpace: "nowrap" }}>
            {sd.diagnosis.actionLabel} →
          </button>
        }
      >
        <strong style={{ fontWeight: 600 }}>{sd.diagnosis.headline}.</strong> {sd.diagnosis.text}
      </AiInsightBanner>

      <Card padding="20px 22px 10px">
        <div style={{ marginBottom: 14 }}><h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Who gained share?</h3><div className="sl-muted" style={{ fontSize: 12.5, marginTop: 2 }}>Share movement across the tracked competitive set</div></div>
        <div style={{ overflowX: "auto" }}>
          <table className="sl-table">
            <thead><tr><th style={{ textAlign: "right", width: 56 }}>Rank</th><th style={{ minWidth: 190 }}>Brand</th><th style={{ textAlign: "right" }}>Current share</th><th style={{ textAlign: "right" }}>Previous share</th><th style={{ textAlign: "right" }}>Change</th><th style={{ minWidth: 130 }}>Share position</th></tr></thead>
            <tbody>
              {sd.share.rows.map((r: any) => (
                <tr className="sl-row is-clickable" key={r.id} onClick={() => { navigate("/competitors"); toast(r.own ? "Opened the competitive set." : "Opened " + r.name + " in Competitors."); }}>
                  <td style={{ textAlign: "right", fontWeight: 600 }}>#{r.rank}</td>
                  <td style={{ fontWeight: r.own ? 600 : 400 }}>{r.name}</td>
                  <td style={{ textAlign: "right", fontWeight: 600 }}>{pct(r.current)}</td>
                  <td className="sl-muted" style={{ textAlign: "right" }}>{pct(r.previous)}</td>
                  <td style={{ textAlign: "right" }}><Badge tone={r.change > 0 ? "positive" : r.change < 0 ? "neutral" : "outline"}>{delta(r.change, " pts")}</Badge></td>
                  <td>
                    <span className="sl-progress-track">
                      <span className="sl-progress-fill" style={{ width: ((r.current / 40) * 100).toFixed(1) + "%", background: r.own ? "var(--color-accent-700)" : "var(--fill-track-strong)" }}></span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,380px),1fr))", gap: "var(--app-gap)" }}>
        <Card padding="20px 22px">
          <div style={{ marginBottom: 16 }}><h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Growth drivers</h3><div className="sl-muted" style={{ fontSize: 12.5, marginTop: 2 }}>Categories adding the most sales this period</div></div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {sd.drivers.map((d: any) => (
              <button key={d.label} className="sl-palette__row" onClick={() => { setCategoryFilter(d.label); toast("Products filtered to " + d.label + "."); }} style={{ flexDirection: "column", alignItems: "stretch", gap: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
                  <span style={{ fontSize: 14 }}>{d.label}</span>
                  <span style={{ display: "flex", gap: 10, alignItems: "baseline" }}><span style={{ fontWeight: 600, fontSize: 15, color: "var(--status-positive-fg)" }}>{signedMoney(d.delta)}</span><span style={{ fontSize: 12, color: "var(--status-positive-fg)" }}>{signedPct(d.growth)}</span></span>
                </div>
                <div className="sl-progress-track"><span className="sl-progress-fill" style={{ width: Math.min(100, (Math.abs(d.delta) / maxDriverAbs) * 100).toFixed(1) + "%", background: "var(--color-accent-700)" }}></span></div>
                <div className="sl-muted" style={{ fontSize: 11.5 }}>{d.reason}</div>
              </button>
            ))}
          </div>
        </Card>
        <Card padding="20px 22px">
          <div style={{ marginBottom: 16 }}><h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Growth headwinds</h3><div className="sl-muted" style={{ fontSize: 12.5, marginTop: 2 }}>Categories holding total sales back</div></div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {sd.headwinds.map((d: any) => (
              <button key={d.label} className="sl-palette__row" onClick={() => { setCategoryFilter(d.label); toast("Products filtered to " + d.label + "."); }} style={{ flexDirection: "column", alignItems: "stretch", gap: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
                  <span style={{ fontSize: 14 }}>{d.label}</span>
                  <span style={{ display: "flex", gap: 10, alignItems: "baseline" }}><span style={{ fontWeight: 600, fontSize: 15, color: "var(--status-negative-fg)" }}>{signedMoney(d.delta)}</span><span style={{ fontSize: 12, color: "var(--status-negative-fg)" }}>{signedPct(d.growth)}</span></span>
                </div>
                <div className="sl-progress-track"><span className="sl-progress-fill" style={{ width: Math.min(100, (Math.abs(d.delta) / maxDriverAbs) * 100).toFixed(1) + "%", background: "var(--fill-track-strong)" }}></span></div>
                <div className="sl-muted" style={{ fontSize: 11.5 }}>{d.reason}</div>
              </button>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
