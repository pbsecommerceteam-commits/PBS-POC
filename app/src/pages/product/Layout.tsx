import { useEffect, useRef, useState } from "react";
import { Outlet, useNavigate, useParams } from "react-router-dom";
import { PageShell } from "../../components/layout/PageShell";
import { PageTabs } from "../../components/ui/PageTabs";
import { Card } from "../../components/ui/Card";
import { InfoTip } from "../../components/ui/InfoTip";
import { Badge, stockTone, opportunityTone } from "../../components/ui/Badge";
import { useFilters } from "../../context/FiltersContext";
import { useUi } from "../../context/UiContext";
import { fetchProduct } from "../../data/mockData";

// No user-facing period control exists any more (see FiltersContext) --
// pinned to "4w", the one window backed by real crawl data.
const period = "4w";

export interface ProductDetailContext {
  p: any;
  t: any;
  labels: string[];
  detail: any;
}

/** One product's real crawl data, split into tabs the same way the app's
 *  own top-level sections are (Pricing/Content/Ratings) instead of one long
 *  scroll -- fetched once here and handed to whichever tab is mounted via
 *  Outlet context, so switching tabs never re-fetches. */
export default function ProductLayout() {
  const { id = "" } = useParams();
  const { retailer, dateRange } = useFilters();
  const { toast } = useUi();
  const navigate = useNavigate();

  const [detail, setDetail] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  // Tries the local downloaded photo first, then the real crawled front-
  // image URL, then the initials monogram -- same fallback order as
  // ProductCell (see that component's own comment for why).
  const [photoStage, setPhotoStage] = useState<"local" | "remote" | "initials">("local");
  const reqKey = useRef("");

  useEffect(() => { setPhotoStage("local"); }, [id]);

  useEffect(() => {
    const rangeKey = dateRange ? dateRange.start + ".." + dateRange.end : "";
    const key = id + "|" + retailer + "|" + period + "|" + rangeKey;
    reqKey.current = key;
    setLoading(true);
    fetchProduct(id, { retailer, period, dateRange })
      .then((d) => { if (reqKey.current === key) { setDetail(d); setLoading(false); } })
      .catch(() => {
        if (reqKey.current !== key) return;
        setLoading(false);
        toast("That SKU is not tracked at this retailer.");
        navigate(-1);
      });
  }, [id, retailer, period, dateRange]);

  if (loading || !detail) {
    return (
      <main style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "28px 28px 48px" }}>
        <div className="sl-muted" style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 12.5 }}>
          <span className="sl-skel" style={{ width: 11, height: 11, borderRadius: "50%", display: "block" }}></span>
          Loading product…
        </div>
      </main>
    );
  }

  const p = detail.product;
  const t = detail.trends;
  const labels = detail.labels;
  const initials = p.name.split(" ").filter(Boolean).slice(0, 2).map((w: string) => w[0]).join("");
  const base = "/product/" + id;

  return (
    <PageShell title={p.name} subtitle={`${p.brand} · ${p.category} · ${p.retailerName}`}
      backTo={{ label: "Back", onClick: () => navigate(-1) }}
      tabs={<PageTabs items={[
        { label: "Overview", to: base, end: true },
        { label: "Pricing", to: base + "/pricing" },
        { label: "Content", to: base + "/content" },
        { label: "Ratings & Reviews", to: base + "/ratings" },
      ]} />}
    >
      <Card padding="20px 22px">
        <div style={{ display: "flex", alignItems: "flex-start", gap: 18, flexWrap: "wrap" }}>
          {photoStage === "initials" ? (
            <span className="sl-avatar" style={{ width: 56, height: 56, fontSize: 17, borderRadius: "var(--radius-md)" }}>{initials}</span>
          ) : (
            <img
              src={photoStage === "local" ? `${import.meta.env.BASE_URL}product-images/${p.id}.jpg` : p.imageUrl}
              alt="" width={56} height={56}
              style={{ borderRadius: "var(--radius-md)", objectFit: "cover", flex: "none", background: "var(--surface-secondary)" }}
              onError={() => setPhotoStage((s) => (s === "local" && p.imageUrl ? "remote" : "initials"))}
            />
          )}
          <div style={{ flex: "1 1 240px", minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <h2 style={{ margin: 0, fontSize: 19, fontWeight: 600 }}>{p.name}</h2>
              <Badge tone={stockTone(p.stockStatus)}>{p.stockStatus}</Badge>
              <Badge tone={opportunityTone(p.opportunity)}>{p.opportunity} opportunity</Badge>
            </div>
            <div className="sl-muted" style={{ fontSize: 13, marginTop: 4 }}>{p.id.toUpperCase()} · {p.brand} · {p.category} · {p.retailerName}</div>
            <div className="sl-faint" style={{ fontSize: 12, marginTop: 6 }}>Crawled {detail.lastCrawl} · {detail.note}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div className="sl-eyebrow" style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "flex-end" }}>Shelf score<InfoTip text="Composite of this SKU's real keyword coverage (25%), in-stock rate (30%), content score (25%) and rating (20%), minus a penalty when priced over 5% above its own average selling price." /></div>
            <div style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 30, lineHeight: 1.1 }}>{p.shelfScore}</div>
          </div>
        </div>
      </Card>

      <Outlet context={{ p, t, labels, detail } satisfies ProductDetailContext} />
    </PageShell>
  );
}
