import { Card } from "../ui/Card";
import type { TableConfig } from "../../lib/format";

/** Generic table for the "cell()-built" tables — content coverage, review
 *  themes, competitors, alert rules, scheduled reports. Each cell already
 *  carries its own alignment/font/color/tag, so this component just lays
 *  them out; it doesn't own sort or filter state because these tables don't
 *  need it. */
export function DataTable({ t }: { t: TableConfig }) {
  return (
    <Card padding="20px 22px 8px">
      <h4 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>{t.title}</h4>
      <div className="sl-muted" style={{ fontSize: 12.5, marginTop: 2, marginBottom: 14 }}>{t.subtitle}</div>
      <div style={{ overflowX: "auto" }}>
        <table className="sl-table">
          <thead>
            <tr>
              {t.cols.map((c, i) => (
                <th key={i} style={{ textAlign: c.align }}>{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {t.rows.map((r, ri) => (
              <tr className="sl-row" key={ri}>
                {r.cells.map((c, ci) => (
                  <td key={ci} style={{ textAlign: c.align }}>
                    <span style={{ fontFamily: c.font, fontSize: c.size, color: c.color, fontWeight: c.font.includes("heading") ? 600 : 400 }}>{c.text}</span>
                    {c.sub && <div className="sl-table-sub">{c.sub}</div>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
