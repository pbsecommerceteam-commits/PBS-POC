/* ─────────────────────────────────────────────────────────────────────────
   Shelfline — mock data layer.

   Everything the UI renders comes from the exported catalogs below and is
   assembled by the query functions further down:

     fetchSnapshot({ retailer, period })   →  GET /dashboard/overview
     fetchShelf({ retailer, period })      →  GET /digital-shelf/summary
     fetchSales({ retailer, period })      →  GET /sales/summary
         .trend      →  GET /sales/trend
         .share      →  GET /sales/share
         .retailers  →  GET /sales/retailers
         .categories →  GET /sales/categories
         .drivers    →  GET /sales/drivers
         .opportunities → GET /sales/opportunities
         .products   →  GET /sales/products
         .retailers  →  GET /digital-shelf/retailers
         .categories →  GET /digital-shelf/categories
         .keywords   →  GET /digital-shelf/keywords
         .opportunities → GET /digital-shelf/opportunities
         .products   →  GET /digital-shelf/products
     fetchProduct(id, { retailer, period })→  GET /products/{product_id}

   Both are async and return plain JSON-shaped objects, so replacing them
   with FastAPI calls is a one-file change:

     export const fetchSnapshot = (q) =>
       fetch(`/api/snapshot?retailer=${q.retailer}&period=${q.period}`)
         .then(r => r.json());

   No component reads a catalog directly except for the static option lists
   (retailers, periods, sectionMeta, user).
   ───────────────────────────────────────────────────────────────────────── */

export const retailers = [
  { id: "all", name: "All retailers" },
  { id: "r1", name: "Northgate Market" },
  { id: "r2", name: "Verdant Grocers" },
  { id: "r3", name: "Halcyon Mega" },
  { id: "r4", name: "Union Pharmacy" },
];

export const periods = [
  { id: "7d", name: "Last 7 days", points: 7, grain: "day" },
  { id: "4w", name: "Last 4 weeks", points: 4, grain: "week" },
  { id: "12w", name: "Last 12 weeks", points: 12, grain: "week" },
  { id: "6m", name: "Last 6 months", points: 6, grain: "month" },
  { id: "12m", name: "Last 12 months", points: 12, grain: "month" },
];

export const user = { name: "R. Vance", role: "Commercial Insights", initials: "RV" };

export const sectionMeta: Record<string, { title: string; subtitle: string }> = {
  overview: { title: "Overview", subtitle: "Portfolio health across the selected retailers and period" },
  shelf: { title: "Digital Shelf", subtitle: "Monitor product visibility, availability, pricing and content across retailers" },
  alerts: { title: "Alerts", subtitle: "Rules watching the portfolio and what they have caught" },
  reports: { title: "Reports", subtitle: "Scheduled exports and briefings sent to your teams" },
  sales: { title: "Sales & Share", subtitle: "Understand sales performance, market share and growth across your monitored retailers" },
  content: { title: "Content", subtitle: "Page completeness, imagery and copy compliance" },
  reviews: { title: "Reviews", subtitle: "Rating trajectory, review volume and recurring themes" },
  competitors: { title: "Competitors", subtitle: "Rival portfolios tracked against the same keyword set" },
  settings: { title: "Settings", subtitle: "Workspace defaults, alerting and data refresh" },
};

export const alertTypes = [
  { id: "instock", name: "Stock availability", condition: "In-stock rate falls below", unit: "%", preset: "95" },
  { id: "price", name: "Price change", condition: "Shelf price moves by more than", unit: "%", preset: "5" },
  { id: "rank", name: "Search rank change", condition: "Search rank drops below position", unit: "", preset: "10" },
  { id: "rating", name: "Rating change", condition: "Average rating falls below", unit: "", preset: "4.2" },
  { id: "content", name: "Content score", condition: "Content score falls below", unit: "/100", preset: "80" },
  { id: "competitor", name: "Competitor movement", condition: "Competitor share of search rises above", unit: "%", preset: "30" },
];

export const alertScopes = [
  { id: "portfolio", name: "Entire portfolio" },
  { id: "cat:Beverages", name: "Category — Beverages" },
  { id: "cat:Dairy alternatives", name: "Category — Dairy alternatives" },
  { id: "cat:Snacks", name: "Category — Snacks" },
  { id: "cat:Personal care", name: "Category — Personal care" },
  { id: "cat:Nutrition", name: "Category — Nutrition" },
  { id: "cat:Home care", name: "Category — Home care" },
];

export const alertFrequencies = ["Real time", "Twice daily", "Daily digest", "Weekly summary"];
export const alertChannels = ["Email digest", "Email + Slack", "In-app only"];

export const alertRules = [
  { id: "ar1", name: "Core SKU availability", type: "Stock availability", condition: "In-stock rate below 95%", scope: "Entire portfolio", retailer: "All retailers", frequency: "Real time", channel: "Email + Slack", status: "Active", triggered: "3 times this week" },
  { id: "ar2", name: "Beverages rank watch", type: "Search rank change", condition: "Rank drops below position 10", scope: "Category — Beverages", retailer: "Northgate Market", frequency: "Daily digest", channel: "Email digest", status: "Active", triggered: "Once this week" },
  { id: "ar3", name: "Competitor price undercut", type: "Price change", condition: "Competitor priced 5% below", scope: "Entire portfolio", retailer: "Halcyon Mega", frequency: "Twice daily", channel: "Email + Slack", status: "Active", triggered: "4 times this week" },
  { id: "ar4", name: "Content compliance sweep", type: "Content score", condition: "Content score below 80", scope: "Entire portfolio", retailer: "All retailers", frequency: "Weekly summary", channel: "In-app only", status: "Paused", triggered: "—" },
  { id: "ar5", name: "Rating erosion", type: "Rating change", condition: "Average rating below 4.2", scope: "Category — Personal care", retailer: "Union Pharmacy", frequency: "Daily digest", channel: "Email digest", status: "Active", triggered: "Twice this week" },
];

export const reports = [
  { id: "rp1", name: "Monday shelf health", contents: "KPIs, availability, rank movement", cadence: "Weekly — Monday 07:00", recipients: "Commercial team (9)", lastSent: "Mon 07:00", format: "PDF + CSV", status: "Scheduled" },
  { id: "rp2", name: "Category share review", contents: "Share of search by category and retailer", cadence: "Monthly — 1st 08:00", recipients: "Category leads (4)", lastSent: "1 Aug 08:00", format: "PDF", status: "Scheduled" },
  { id: "rp3", name: "Content compliance export", contents: "Attribute coverage, failing SKUs", cadence: "Weekly — Thursday 06:00", recipients: "Content ops (6)", lastSent: "Thu 06:00", format: "CSV", status: "Scheduled" },
  { id: "rp4", name: "Competitor pricing brief", contents: "Rival price index and share change", cadence: "On demand", recipients: "Pricing (3)", lastSent: "12 Aug 14:20", format: "XLSX", status: "Draft" },
];

/* ── product catalog ──────────────────────────────────────────────────── */

export const catalog = [
  { id: "sku-1042", name: "Meridian Cold Brew 1L", brand: "Meridian", category: "Beverages", retailer: "r1", rank: 2, price: 6.49, rating: 4.6, reviews: 1284, content: 94, stockBias: 0.92 },
  { id: "sku-1088", name: "Meridian Cold Brew 250ml ×4", brand: "Meridian", category: "Beverages", retailer: "r3", rank: 5, price: 9.99, rating: 4.4, reviews: 812, content: 88, stockBias: 0.7 },
  { id: "sku-1120", name: "Meridian Nitro Cold Brew 500ml", brand: "Meridian", category: "Beverages", retailer: "r2", rank: 11, price: 4.79, rating: 4.2, reviews: 402, content: 79, stockBias: 0.8 },
  { id: "sku-1155", name: "Meridian Decaf Cold Brew 1L", brand: "Meridian", category: "Beverages", retailer: "r1", rank: 17, price: 6.29, rating: 4.0, reviews: 218, content: 66, stockBias: 0.55 },
  { id: "sku-2210", name: "Harbor Oat Milk Barista", brand: "Harbor", category: "Dairy alternatives", retailer: "r2", rank: 1, price: 3.79, rating: 4.7, reviews: 2140, content: 91, stockBias: 0.95 },
  { id: "sku-2244", name: "Harbor Oat Milk Unsweetened", brand: "Harbor", category: "Dairy alternatives", retailer: "r2", rank: 8, price: 3.49, rating: 4.3, reviews: 977, content: 76, stockBias: 0.86 },
  { id: "sku-2261", name: "Harbor Almond Milk Original", brand: "Harbor", category: "Dairy alternatives", retailer: "r3", rank: 14, price: 3.19, rating: 4.1, reviews: 611, content: 72, stockBias: 0.74 },
  { id: "sku-2288", name: "Harbor Barista Multipack ×6", brand: "Harbor", category: "Dairy alternatives", retailer: "r1", rank: 9, price: 19.5, rating: 4.5, reviews: 488, content: 84, stockBias: 0.68 },
  { id: "sku-3301", name: "Kettle & Grain Sourdough Crisps", brand: "Kettle & Grain", category: "Snacks", retailer: "r1", rank: 12, price: 4.25, rating: 4.1, reviews: 431, content: 68, stockBias: 0.35 },
  { id: "sku-3318", name: "Kettle & Grain Sea Salt Crisps", brand: "Kettle & Grain", category: "Snacks", retailer: "r3", rank: 6, price: 4.05, rating: 4.5, reviews: 1508, content: 89, stockBias: 0.9 },
  { id: "sku-3340", name: "Kettle & Grain Black Pepper Crisps", brand: "Kettle & Grain", category: "Snacks", retailer: "r2", rank: 19, price: 4.15, rating: 3.9, reviews: 176, content: 61, stockBias: 0.6 },
  { id: "sku-3366", name: "Kettle & Grain Sharing Bag 300g", brand: "Kettle & Grain", category: "Snacks", retailer: "r3", rank: 10, price: 6.75, rating: 4.3, reviews: 704, content: 81, stockBias: 0.82 },
  { id: "sku-4102", name: "Aster Rinse-Free Cleanser", brand: "Aster", category: "Personal care", retailer: "r4", rank: 3, price: 12.9, rating: 4.2, reviews: 664, content: 82, stockBias: 0.9 },
  { id: "sku-4140", name: "Aster Daily Moisturiser 200ml", brand: "Aster", category: "Personal care", retailer: "r4", rank: 15, price: 18.5, rating: 3.9, reviews: 289, content: 61, stockBias: 0.5 },
  { id: "sku-4177", name: "Aster Barrier Repair Serum", brand: "Aster", category: "Personal care", retailer: "r4", rank: 7, price: 29.0, rating: 4.4, reviews: 921, content: 87, stockBias: 0.88 },
  { id: "sku-4190", name: "Aster Gentle Cleansing Bar ×3", brand: "Aster", category: "Personal care", retailer: "r1", rank: 21, price: 8.4, rating: 4.0, reviews: 143, content: 58, stockBias: 0.66 },
  { id: "sku-5077", name: "Foundry Protein Bar Cocoa", brand: "Foundry", category: "Nutrition", retailer: "r3", rank: 4, price: 2.35, rating: 4.4, reviews: 3021, content: 93, stockBias: 0.93 },
  { id: "sku-5091", name: "Foundry Protein Bar Multipack ×12", brand: "Foundry", category: "Nutrition", retailer: "r1", rank: 9, price: 13.75, rating: 4.0, reviews: 588, content: 74, stockBias: 0.78 },
  { id: "sku-5118", name: "Foundry Whey Isolate 900g", brand: "Foundry", category: "Nutrition", retailer: "r4", rank: 13, price: 42.0, rating: 4.3, reviews: 1102, content: 85, stockBias: 0.72 },
  { id: "sku-5142", name: "Foundry Electrolyte Sachets ×20", brand: "Foundry", category: "Nutrition", retailer: "r4", rank: 22, price: 16.9, rating: 3.8, reviews: 97, content: 54, stockBias: 0.45 },
  { id: "sku-6011", name: "Tidewater Laundry Concentrate", brand: "Tidewater", category: "Home care", retailer: "r2", rank: 7, price: 15.2, rating: 4.5, reviews: 1105, content: 86, stockBias: 0.91 },
  { id: "sku-6042", name: "Tidewater Fabric Softener", brand: "Tidewater", category: "Home care", retailer: "r3", rank: 18, price: 8.6, rating: 3.8, reviews: 212, content: 57, stockBias: 0.3 },
  { id: "sku-6070", name: "Tidewater Dish Gel Lemon", brand: "Tidewater", category: "Home care", retailer: "r1", rank: 11, price: 5.4, rating: 4.2, reviews: 533, content: 77, stockBias: 0.84 },
  { id: "sku-6099", name: "Tidewater Surface Spray Refill", brand: "Tidewater", category: "Home care", retailer: "r2", rank: 16, price: 6.95, rating: 4.1, reviews: 348, content: 70, stockBias: 0.63 },
];

export const competitorBrands = [
  { id: "c1", name: "Corvus Group", share: 36.1, skus: 148, price: 7.2, rating: 4.28, content: 90 },
  { id: "c2", name: "Palisade Foods", share: 25.2, skus: 96, price: 6.1, rating: 4.41, content: 84 },
  { id: "c3", name: "Northwind Labs", share: 11.8, skus: 62, price: 9.4, rating: 4.05, content: 71 },
  { id: "c4", name: "Selby & Co", share: 8.4, skus: 44, price: 5.8, rating: 3.96, content: 66 },
];

export const keywordSet = [
  { id: "k1", term: "cold brew coffee", volume: 148000, ownRank: 2 },
  { id: "k2", term: "oat milk barista", volume: 96400, ownRank: 1 },
  { id: "k3", term: "protein bar", volume: 212000, ownRank: 4 },
  { id: "k4", term: "laundry detergent refill", volume: 74100, ownRank: 7 },
  { id: "k5", term: "sourdough crisps", volume: 31800, ownRank: 12 },
  { id: "k6", term: "sensitive skin moisturiser", volume: 88700, ownRank: 15 },
  { id: "k7", term: "electrolyte powder", volume: 57300, ownRank: 22 },
  { id: "k8", term: "whey isolate protein", volume: 66900, ownRank: 13 },
];

export const contentAttributes = [
  { id: "a1", name: "Title conforms to retailer spec", weight: "High" },
  { id: "a2", name: "Primary image ≥ 1500px", weight: "High" },
  { id: "a3", name: "Six or more gallery images", weight: "Medium" },
  { id: "a4", name: "Bullet copy present (5+)", weight: "High" },
  { id: "a5", name: "A+ / enhanced module", weight: "Medium" },
  { id: "a6", name: "Nutrition or ingredient panel", weight: "High" },
  { id: "a7", name: "Video asset attached", weight: "Low" },
];

export const reviewThemes = [
  { id: "t1", theme: "Flavour and taste", sentiment: "Positive" },
  { id: "t2", theme: "Value for money", sentiment: "Mixed" },
  { id: "t3", theme: "Packaging integrity", sentiment: "Negative" },
  { id: "t4", theme: "Delivery condition", sentiment: "Mixed" },
  { id: "t5", theme: "Texture and consistency", sentiment: "Positive" },
  { id: "t6", theme: "Scent and fragrance", sentiment: "Positive" },
];

export const categories = ["Beverages", "Dairy alternatives", "Snacks", "Personal care", "Nutrition", "Home care"];

export const notificationFeed = [
  { id: "n1", severity: "high", title: "Stock alert", text: "Kettle & Grain Sourdough Crisps out of stock at Northgate Market", time: "12m ago", product: "sku-3301" },
  { id: "n2", severity: "high", title: "Stock alert", text: "Tidewater Fabric Softener out of stock at Halcyon Mega", time: "38m ago", product: "sku-6042" },
  { id: "n3", severity: "medium", title: "Rank alert", text: "Aster Daily Moisturiser dropped 6 search positions", time: "1h ago", product: "sku-4140" },
  { id: "n4", severity: "medium", title: "Price alert", text: "Competitor pricing changed on 4 tracked Nutrition SKUs", time: "2h ago", product: "sku-5142" },
  { id: "n5", severity: "low", title: "Content opportunity", text: "8 products have missing attributes at Halcyon Mega", time: "5h ago", product: "sku-2210" },
];

/* ── deterministic variation helpers ─────────────────────────────────── */

const hash = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
};
const rng = (seed: number) => {
  let s = (seed || 1) >>> 0;
  const next = () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; s ^= s >>> 15; return (s >>> 0) / 4294967296; };
  next(); next(); next();
  return next;
};
/* Per-row generator: every row is seeded from its own identity, never from a
   neighbouring integer, so sibling rows never collapse onto one value. */
const rowRng = (key: string, tag: string, id: string) => rng(hash(key + "|" + tag + "|" + id));
const round = (v: number, p = 1) => Number(v.toFixed(p));
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

const RETAILER_BIAS: Record<string, { sos: number; stock: number; rating: number; content: number }> = {
  all: { sos: 0, stock: 0, rating: 0, content: 0 },
  r1: { sos: 3.4, stock: 1.8, rating: 0.08, content: 3 },
  r2: { sos: -1.2, stock: 0.5, rating: 0.12, content: -2 },
  r3: { sos: 1.8, stock: -2.3, rating: -0.14, content: 5 },
  r4: { sos: -4.1, stock: 1.2, rating: -0.05, content: -6 },
};

const MONTHS = ["Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"];

function labelsFor(periodId: string) {
  const p = periods.find((x) => x.id === periodId) || periods[2];
  if (p.grain === "day") return ["Aug 15", "Aug 16", "Aug 17", "Aug 18", "Aug 19", "Aug 20", "Aug 21"];
  if (p.grain === "week") return Array.from({ length: p.points }, (_, i) => "W" + (26 - p.points + i));
  return MONTHS.slice(12 - p.points);
}

function series(seed: number, n: number, start: number, end: number, amp: number, digits: number) {
  const r = rng(seed);
  return Array.from({ length: n }, (_, i) => {
    const t = n < 2 ? 1 : i / (n - 1);
    return round(start + (end - start) * t + (r() - 0.5) * amp * 2, digits);
  });
}

/* Longer windows show more movement — a 7-day window is nearly flat. */
const swing: Record<string, number> = { "7d": 0.25, "4w": 0.5, "12w": 1, "6m": 1.5, "12m": 2.2 };

function productFor(p: (typeof catalog)[number], key: string) {
  const r = rng(hash(p.id + key));
  const bias = RETAILER_BIAS[key.split("|")[0]] || RETAILER_BIAS.all;
  const roll = r();
  const status = roll < p.stockBias - 0.28 ? "In Stock" : roll < p.stockBias + 0.14 ? "Low Stock" : "Out of Stock";
  return {
    id: p.id,
    name: p.name,
    brand: p.brand,
    category: p.category,
    retailer: p.retailer,
    retailerName: (retailers.find((x) => x.id === p.retailer) || ({} as any)).name,
    searchRank: clamp(Math.round(p.rank + (r() - 0.5) * 6), 1, 40),
    rankDelta: Math.round((r() - 0.5) * 9),
    price: round(p.price * (0.95 + r() * 0.12), 2),
    priceIndex: round(0.9 + r() * 0.3, 2),
    stockStatus: status as "In Stock" | "Low Stock" | "Out of Stock",
    inStockRate: round(clamp(
      99.4 + bias.stock * 0.3 + (r() - 0.5) * 1 -
      (status === "Out of Stock" ? 8 + r() * 8 : status === "Low Stock" ? 2 + r() * 2 : 0),
      70, 100), 1),
    rating: round(clamp(p.rating + (r() - 0.5) * 0.3 + bias.rating, 3.2, 5), 2),
    reviews: Math.round(p.reviews * (0.9 + r() * 0.35)),
    contentScore: clamp(Math.round(p.content + (r() - 0.5) * 12 + bias.content), 40, 100),
    buyBox: r() > 0.22,
    opportunity: "" as string,
  };
}

/* Shelf metrics are derived from the row itself so every surface — overview,
   shelf, product detail, CSV — reports the same number for the same SKU. */
function withShelfMetrics(q: any) {
  q.searchVisibility = clamp(Math.round(90 - (q.searchRank - 1) * 3.4), 6, 96);
  q.shelfScore = clamp(Math.round(
    q.searchVisibility * 0.25 + q.inStockRate * 0.3 + q.contentScore * 0.25 +
    (q.rating / 5) * 100 * 0.2 - Math.max(0, q.priceIndex - 1.05) * 40
  ), 20, 100);
  return q;
}

/* Opportunity = how much upside a fix on this SKU would unlock. Weighted so a
   high-visibility SKU with weak availability or content ranks highest. */
function scoreOpportunity(p: any) {
  let s = 0;
  if (p.stockStatus === "Out of Stock") s += 3; else if (p.stockStatus === "Low Stock") s += 1.5;
  if (p.contentScore < 70) s += 2; else if (p.contentScore < 80) s += 1;
  if (p.searchRank > 15) s += 1.5; else if (p.searchRank > 8) s += 0.75;
  if (p.rating < 4) s += 1;
  if (p.rankDelta < -3) s += 1;
  return s >= 4 ? "High" : s >= 2 ? "Medium" : "Low";
}

/* Commercial metrics live beside the shelf metrics on the same row so a SKU
   reports one sales number everywhere it appears. */
function withSalesMetrics(q: any, key: string) {
  const rr = rowRng(key, "sales", q.id);
  const demand = (41 - q.searchRank) / 40;
  q.units = Math.round(4200 + demand * 34000 * (0.55 + rr() * 0.9) + q.reviews * 1.8);
  q.sales = Math.round(q.units * q.price);
  q.salesGrowth = round((rr() - 0.42) * 26, 1);
  q.prevSales = Math.round(q.sales / (1 + q.salesGrowth / 100));
  q.avgPrice = q.price;
  return q;
}

function poolFor(retailer: string, key: string) {
  return catalog.filter((p) => retailer === "all" || p.retailer === retailer).map((p) => {
    const q = productFor(p, key);
    q.opportunity = scoreOpportunity(q);
    return withSalesMetrics(withShelfMetrics(q), key);
  });
}

function snapshot(retailer: string, period: string) {
  const key = retailer + "|" + period;
  const seed = hash(key);
  const labels = labelsFor(period);
  const n = labels.length;
  const bias = RETAILER_BIAS[retailer] || RETAILER_BIAS.all;
  const sw = swing[period] || 1;

  const sos = series(seed + 1, n, 34.2 - 5 * sw + bias.sos, 34.2 + bias.sos, 0.9, 1);
  const leader = series(seed + 2, n, 41 + 2 * sw, 36.1, 0.8, 1);
  const riser = series(seed + 3, n, 25.2 - 11 * sw, 25.2, 1.1, 1);
  const stockVals = series(seed + 4, n, 96.4 + 1.4 * sw + bias.stock, 96.4 + bias.stock, 0.5, 1)
    .map((v) => round(clamp(v, 88, 100), 1));
  const ratingVals = series(seed + 5, n, 4.32 - 0.14 * sw + bias.rating, 4.32 + bias.rating, 0.03, 2);
  const contentVals = series(seed + 6, n, 87 - 8 * sw + bias.content, 87 + bias.content, 1.2, 0)
    .map((v) => clamp(Math.round(v), 40, 100));

  const pool = poolFor(retailer, key);
  const oos = pool.filter((p) => p.stockStatus === "Out of Stock").length;
  const avgRank = round(pool.reduce((a, p) => a + p.searchRank, 0) / (pool.length || 1), 1);
  const reviewVolume = pool.reduce((a, p) => a + p.reviews, 0);
  const last = (a: number[]) => a[a.length - 1];
  const first = (a: number[]) => a[0];

  const kpi = (id: string, label: string, unit: string, vals: number[], target: number, digits: number) => ({
    id, label, unit, target,
    value: last(vals),
    delta: round(last(vals) - first(vals), digits),
    spark: vals,
  });

  const r = rng(seed + 7);
  const out: any = {
    retailer, period, labels,
    generatedAt: "Today 06:40 UTC",
    kpis: [
      kpi("sos", "Share of Search", "%", sos, 40, 1),
      kpi("instock", "In Stock %", "%", stockVals, 98, 1),
      kpi("rating", "Average Rating", "", ratingVals, 4.5, 2),
      kpi("content", "Content Score", "/100", contentVals, 95, 0),
      { id: "oos", label: "Out of Stock SKUs", unit: "", target: 0, value: oos, delta: Math.round((r() - 0.5) * 4), spark: series(seed + 8, n, oos + 1, oos, 0.7, 0).map((v) => clamp(v, 0, 20)) },
      { id: "rank", label: "Avg Search Rank", unit: "", target: 5, value: avgRank, delta: round((r() - 0.5) * 2, 1), spark: series(seed + 9, n, avgRank + 1.4 * sw, avgRank, 0.5, 1) },
      { id: "reviews", label: "Review Volume", unit: "", target: 20000, value: reviewVolume, delta: Math.round(reviewVolume * 0.04), spark: series(seed + 10, n, reviewVolume * 0.94, reviewVolume, reviewVolume * 0.01, 0) },
      { id: "gap", label: "Gap to Leader", unit: " pts", target: 0, value: round(last(leader) - last(sos), 1), delta: round((first(leader) - first(sos)) * -1 + (last(leader) - last(sos)), 1), spark: leader.map((v, i) => round(v - sos[i], 1)) },
      { id: "issues", label: "Content Issues", unit: "", target: 0, value: pool.filter((p) => p.contentScore < 80).length, delta: -1, spark: series(seed + 11, n, pool.filter((p) => p.contentScore < 80).length + 2, pool.filter((p) => p.contentScore < 80).length, 0.6, 0).map((v) => clamp(v, 0, 30)) },
    ],
    visibility: {
      labels,
      previous: sos.map((v, i) => round(v - 2.4 - (i % 3) * 0.3, 1)),
      series: [
        { id: "brand", name: "Your portfolio", values: sos, emphasis: true },
        { id: "cat", name: "Category leader", values: leader },
        { id: "chal", name: "Fastest riser", values: riser },
      ],
    },
    stock: { labels, values: stockVals, target: 98, previous: stockVals.map((v, i) => round(clamp(v - 0.7 - (i % 4) * 0.15, 85, 100), 1)) },
    ratingTrend: { labels, values: ratingVals, previous: ratingVals.map((v) => round(v - 0.07, 2)) },
    contentTrend: { labels, values: contentVals, previous: contentVals.map((v) => clamp(v - 4, 30, 100)) },
    stockByRetailer: retailers.slice(1).map((rt) => {
      const rr = rowRng(key, "stockByRetailer", rt.id);
      return { retailer: rt.name, inStock: round(clamp(96 + RETAILER_BIAS[rt.id].stock + (rr() - 0.5) * 3, 85, 100), 1) };
    }),
    shareByRetailer: retailers.slice(1).map((rt) => {
      const rr = rowRng(key, "shareByRetailer", rt.id);
      return { retailer: rt.name, share: round(clamp(30 + RETAILER_BIAS[rt.id].sos + (rr() - 0.5) * 6, 8, 55), 1), delta: round((rr() - 0.5) * 5, 1) };
    }),
    categoryShare: categories.map((c) => {
      const rr = rowRng(key, "categoryShare", c);
      return { category: c, share: round(12 + rr() * 34, 1), delta: round((rr() - 0.5) * 6, 1), skus: pool.filter((p) => p.category === c).length };
    }),
    competitors: competitorBrands.map((c) => {
      const rr = rowRng(key, "competitor", c.id);
      return {
        id: c.id, name: c.name,
        share: round(clamp(c.share + (rr() - 0.5) * 5 * sw, 3, 55), 1),
        delta: round((rr() - 0.5) * 6 * sw, 1),
        skus: c.skus, price: round(c.price * (0.95 + rr() * 0.1), 2),
        rating: round(clamp(c.rating + (rr() - 0.5) * 0.2, 3.4, 5), 2),
        priceIndex: round(0.9 + rr() * 0.26, 2),
        content: clamp(Math.round(c.content + (rr() - 0.5) * 8), 40, 100),
      };
    }),
    keywords: keywordSet.map((k) => {
      const rr = rowRng(key, "keyword", k.id);
      return {
        id: k.id, term: k.term, volume: k.volume,
        rank: clamp(Math.round(k.ownRank + (rr() - 0.5) * 6), 1, 40),
        delta: Math.round((rr() - 0.5) * 8),
        share: round(clamp(28 + (rr() - 0.5) * 26 + bias.sos, 3, 62), 1),
        leader: competitorBrands[Math.floor(rr() * 4)].name,
      };
    }),
    contentCoverage: contentAttributes.map((a) => {
      const rr = rowRng(key, "coverage", a.id);
      return { id: a.id, name: a.name, weight: a.weight, coverage: clamp(Math.round(62 + rr() * 38 + bias.content / 2), 20, 100), failing: Math.round(rr() * 6) };
    }),
    contentDistribution: [
      { bucket: "Below 60", count: pool.filter((p) => p.contentScore < 60).length },
      { bucket: "60–69", count: pool.filter((p) => p.contentScore >= 60 && p.contentScore < 70).length },
      { bucket: "70–79", count: pool.filter((p) => p.contentScore >= 70 && p.contentScore < 80).length },
      { bucket: "80–89", count: pool.filter((p) => p.contentScore >= 80 && p.contentScore < 90).length },
      { bucket: "90+", count: pool.filter((p) => p.contentScore >= 90).length },
    ],
    reviewThemes: reviewThemes.map((t) => {
      const rr = rowRng(key, "theme", t.id);
      return { id: t.id, theme: t.theme, sentiment: t.sentiment, share: round(6 + rr() * 26, 1), mentions: Math.round(120 + rr() * 900), delta: round((rr() - 0.5) * 8, 1) };
    }),
    products: pool,
    retailerPerformance: retailers.slice(1).map((rt) => {
      const rr = rowRng(key, "retailerPerf", rt.id);
      const b = RETAILER_BIAS[rt.id];
      const sosR = round(clamp(31 + b.sos + (rr() - 0.5) * 6, 8, 55), 1);
      const inStockR = round(clamp(96.5 + b.stock + (rr() - 0.5) * 3, 85, 100), 1);
      const contentR = clamp(Math.round(85 + b.content + (rr() - 0.5) * 8), 40, 100);
      const ratingR = round(clamp(4.3 + b.rating + (rr() - 0.5) * 0.2, 3.4, 5), 2);
      const overall = Math.round(
        (sosR / 40) * 25 + (inStockR / 100) * 30 + (contentR / 100) * 25 + (ratingR / 5) * 20
      );
      return {
        id: rt.id, name: rt.name, sos: sosR, sosDelta: round((rr() - 0.5) * 4, 1),
        inStock: inStockR, inStockDelta: round((rr() - 0.5) * 2, 1),
        content: contentR, rating: ratingR,
        skus: catalog.filter((p) => p.retailer === rt.id).length,
        overall: clamp(overall, 30, 100),
      };
    }),
    categoryPerformance: categories.map((c) => {
      const rr = rowRng(key, "categoryPerf", c);
      const inCat = pool.filter((p) => p.category === c);
      const avg = (f: (p: any) => number, d: number) => (inCat.length ? round(inCat.reduce((a, p) => a + f(p), 0) / inCat.length, d) : 0);
      const sosC = round(clamp(14 + rr() * 30 + bias.sos / 2, 4, 58), 1);
      const availC = inCat.length ? avg((p) => p.inStockRate, 1) : round(94 + rr() * 5, 1);
      const contentC = inCat.length ? Math.round(avg((p) => p.contentScore, 0)) : Math.round(74 + rr() * 20);
      const overall = Math.round((sosC / 45) * 30 + (availC / 100) * 35 + (contentC / 100) * 35);
      return {
        category: c, skus: inCat.length, sos: sosC, sosDelta: round((rr() - 0.5) * 5, 1),
        availability: availC, content: contentC, overall: clamp(overall, 25, 100),
      };
    }),
    insights: [] as any[],
  };
  out.insights = deriveInsights(out);
  return out;
}

/* Analytics layer: insights are derived from the snapshot, never authored as
   copy in the UI. Each carries the action the user should take next. */
function deriveInsights(s: any) {
  const sos = s.kpis.find((k: any) => k.id === "sos");
  const topCat = s.categoryPerformance.slice().sort((a: any, b: any) => b.sos - a.sos)[0];
  const lowAvail = s.products.filter((p: any) => p.inStockRate < 95);
  const weakContent = s.products.filter((p: any) => p.contentScore < 80);
  const ownIndex = s.products.length
    ? s.products.reduce((a: number, p: any) => a + p.priceIndex, 0) / s.products.length : 1;
  const byIndex = s.competitors.slice().sort((a: any, b: any) => a.priceIndex - b.priceIndex);
  const cheapest = byIndex[0];
  const undercut = round(((ownIndex - cheapest.priceIndex) / ownIndex) * 100, 1);
  const risers = s.competitors.slice().sort((a: any, b: any) => b.delta - a.delta);
  const rising = risers.find((c: any) => c.id !== cheapest.id) || risers[0];

  const list: any[] = [];
  list.push({
    id: "i-sos",
    kind: sos.delta >= 0 ? "positive" : "warning",
    title: sos.delta >= 0 ? "Search visibility improved" : "Search visibility slipped",
    body: "Share of search " + (sos.delta >= 0 ? "increased " : "fell ") + Math.abs(sos.delta).toFixed(1) +
      " pts over the period, led by " + topCat.category + " at " + topCat.sos.toFixed(1) + "% share.",
    action: "View details", target: "sales",
  });
  list.push({
    id: "i-avail",
    kind: lowAvail.length > 4 ? "critical" : lowAvail.length ? "warning" : "positive",
    title: "Availability opportunity",
    body: lowAvail.length === 0
      ? "Every tracked SKU held above the 95% availability threshold across the period."
      : lowAvail.length + " product" + (lowAvail.length === 1 ? "" : "s") +
        " dipped below the 95% availability threshold, an estimated " +
        (lowAvail.length * 0.4).toFixed(1) + " pts of category share at risk.",
    action: "Review products", target: "shelf",
  });
  list.push({
    id: "i-price",
    kind: Math.abs(undercut) > 5 ? "warning" : "neutral",
    title: "Competitive price movement",
    body: cheapest.name + " sits " + Math.abs(undercut).toFixed(1) + "% " +
      (undercut > 0 ? "below" : "above") + " your price index on comparable lines" +
      (rising && rising.id !== cheapest.id && rising.delta > 0
        ? ", and " + rising.name + " gained " + rising.delta.toFixed(1) + " pts of search share."
        : "."),
    action: "View competitors", target: "competitors",
  });
  list.push({
    id: "i-content",
    kind: weakContent.length > 5 ? "warning" : "neutral",
    title: "Content opportunity",
    body: weakContent.length + " product" + (weakContent.length === 1 ? "" : "s") +
      " scored under 80 on attribute completeness, which suppresses discoverability on long-tail terms.",
    action: "Review content", target: "content",
  });
  return list;
}

const LATENCY = 340;

export function fetchSnapshot({ retailer = "all", period = "12w" }: { retailer?: string; period?: string } = {}) {
  return new Promise<any>((resolve) => setTimeout(() => resolve(snapshot(retailer, period)), LATENCY));
}

/* ── digital shelf ────────────────────────────────────────────────────
   One assembled response per retailer+period. Every block is derived from
   the same product pool the overview reads, so the two pages never
   disagree about a SKU. Maps 1:1 onto /digital-shelf/* endpoints.
   ─────────────────────────────────────────────────────────────────────── */

const CONTENT_COMPONENTS = [
  { id: "title", name: "Title", weight: 20, base: 91, hint: "Retailer title spec, keyword placement" },
  { id: "description", name: "Description", weight: 15, base: 83, hint: "Bullet copy length and structure" },
  { id: "images", name: "Images", weight: 25, base: 96, hint: "Hero resolution and gallery depth" },
  { id: "attributes", name: "Attributes", weight: 20, base: 74, hint: "Structured fields feeding filters" },
  { id: "keywords", name: "Keywords", weight: 12, base: 68, hint: "Coverage of tracked search terms" },
  { id: "specs", name: "Specifications", weight: 8, base: 88, hint: "Nutrition, ingredients, dimensions" },
];

function shelfData(retailer: string, period: string) {
  const key = retailer + "|" + period;
  const seed = hash(key);
  const labels = labelsFor(period);
  const n = labels.length;
  const bias = RETAILER_BIAS[retailer] || RETAILER_BIAS.all;
  const sw = swing[period] || 1;
  const pool = poolFor(retailer, key);
  const last = (a: number[]) => a[a.length - 1];
  const first = (a: number[]) => a[0];
  const avg = (arr: any[], f: (x: any) => number, d?: number) => (arr.length ? round(arr.reduce((a, x) => a + f(x), 0) / arr.length, d == null ? 1 : d) : 0);

  /* Same seeds as the overview snapshot so shared KPIs read identically. */
  const sos = series(seed + 1, n, 34.2 - 5 * sw + bias.sos, 34.2 + bias.sos, 0.9, 1);
  const stockVals = series(seed + 4, n, 96.4 + 1.4 * sw + bias.stock, 96.4 + bias.stock, 0.5, 1)
    .map((v) => round(clamp(v, 88, 100), 1));
  const contentVals = series(seed + 6, n, 87 - 8 * sw + bias.content, 87 + bias.content, 1.2, 0)
    .map((v) => clamp(Math.round(v), 40, 100));

  const idxNow = round(avg(pool, (p) => p.priceIndex, 3) * 100, 1);
  const priceIdx = series(seed + 21, n, idxNow - 1.8 * sw, idxNow, 0.6, 1);
  const buyNow = round((pool.filter((p) => p.buyBox).length / (pool.length || 1)) * 100, 0);
  const buyBox = series(seed + 22, n, buyNow + 2 * sw, buyNow, 1.2, 0).map((v) => clamp(Math.round(v), 40, 100));

  const kpi = (id: string, label: string, unit: string, vals: number[], target: number, digits: number) => ({
    id, label, unit, target, value: last(vals),
    delta: round(last(vals) - first(vals), digits), spark: vals,
  });

  const byRetailer = retailers.slice(1).map((rt) => {
    const rr = rowRng(key, "shelfRetailer", rt.id);
    const b = RETAILER_BIAS[rt.id];
    const own = catalog.filter((p) => p.retailer === rt.id).map((p) => withShelfMetrics(productFor(p, key)));
    const visibility = round(clamp(31 + b.sos + (rr() - 0.5) * 6, 8, 58), 1);
    const availability = own.length ? avg(own, (p) => p.inStockRate, 1) : round(clamp(96 + b.stock, 85, 100), 1);
    const content = own.length ? Math.round(avg(own, (p) => p.contentScore, 0)) : clamp(Math.round(85 + b.content), 40, 100);
    const rating = own.length ? avg(own, (p) => p.rating, 2) : round(clamp(4.3 + b.rating, 3.4, 5), 2);
    const priceIndex = own.length ? round(avg(own, (p) => p.priceIndex, 3) * 100, 1) : round(98 + rr() * 8, 1);
    const shelfScore = clamp(Math.round(
      (visibility / 45) * 25 + (availability / 100) * 30 + (content / 100) * 25 + (rating / 5) * 20
    ), 25, 100);
    return {
      id: rt.id, name: rt.name, skus: own.length, visibility, availability, content, rating, priceIndex, shelfScore,
      visibilityDelta: round((rr() - 0.5) * 4.5, 1),
      availabilityDelta: round((rr() - 0.5) * 2.4, 1),
      shelfScoreDelta: round((rr() - 0.5) * 5, 1),
      oos: own.filter((p) => p.stockStatus === "Out of Stock").length,
      low: own.filter((p) => p.stockStatus === "Low Stock").length,
      inStock: own.filter((p) => p.stockStatus === "In Stock").length,
    };
  });

  const byCategory = categories.map((c) => {
    const rr = rowRng(key, "shelfCategory", c);
    const inCat = pool.filter((p) => p.category === c);
    const visibility = inCat.length ? avg(inCat, (p) => p.searchVisibility, 1) : round(20 + rr() * 30, 1);
    const availability = inCat.length ? avg(inCat, (p) => p.inStockRate, 1) : round(93 + rr() * 6, 1);
    const content = inCat.length ? Math.round(avg(inCat, (p) => p.contentScore, 0)) : Math.round(70 + rr() * 25);
    const priceIndex = inCat.length ? round(avg(inCat, (p) => p.priceIndex, 3) * 100, 1) : round(96 + rr() * 10, 1);
    const overall = inCat.length ? Math.round(avg(inCat, (p) => p.shelfScore, 0)) : Math.round(55 + rr() * 30);
    return {
      category: c, skus: inCat.length, visibility, availability, content, priceIndex, overall,
      delta: round((rr() - 0.5) * 6, 1),
    };
  });

  const keywords = keywordSet.map((k) => {
    const rr = rowRng(key, "shelfKeyword", k.id);
    const rank = clamp(Math.round(k.ownRank + (rr() - 0.5) * 6), 1, 40);
    const change = Math.round((rr() - 0.5) * 8);
    const prevRank = clamp(rank + change, 1, 45);
    const competitorRank = clamp(Math.round(rank + (rr() - 0.5) * 8), 1, 40);
    const visibility = round(clamp(84 - (rank - 1) * 3.6 + (rr() - 0.5) * 12 + bias.sos / 2, 4, 96), 0);
    let score = 0;
    if (competitorRank < rank) score += 2;
    if (rank > 8) score += 1.5;
    if (change < -1) score += 1.2;
    if (k.volume > 90000) score += 1;
    const own = pool.filter((p) => k.term.split(" ").some((w) => w.length > 3 && (p.name + " " + p.category).toLowerCase().includes(w)))
      .sort((a, b) => a.searchRank - b.searchRank).slice(0, 3);
    return {
      id: k.id, term: k.term, volume: k.volume, rank, prevRank, change: prevRank - rank,
      visibility, competitorRank, competitor: competitorBrands[Math.floor(rr() * 4)].name,
      opportunity: score >= 3 ? "High" : score >= 1.5 ? "Medium" : "Low",
      trend: series(hash(key + k.id), n, clamp(prevRank + 1, 1, 42), rank, 1.4, 0).map((v) => clamp(Math.round(v), 1, 42)),
      products: own.map((p) => ({ id: p.id, name: p.name, rank: p.searchRank, retailerName: p.retailerName })),
    };
  });

  const ownPrice = avg(pool, (p) => p.price, 2);
  const catAvg = round(ownPrice * (1 + (idxNow - 100) / -100), 2);
  const compPrices = competitorBrands.map((c) => {
    const rr = rowRng(key, "shelfPrice", c.id);
    return { name: c.name, price: round(ownPrice * (0.82 + rr() * 0.36), 2) };
  }).sort((a, b) => a.price - b.price);

  const attention = pool.filter((p) => p.inStockRate < 92)
    .sort((a, b) => a.inStockRate - b.inStockRate).slice(0, 6)
    .map((p) => ({ id: p.id, name: p.name, retailerName: p.retailerName, inStockRate: p.inStockRate, status: p.stockStatus }));

  const rawContent = CONTENT_COMPONENTS.map((c) => {
    const rr = rowRng(key, "contentComp", c.id);
    return Object.assign({}, c, { score: clamp(Math.round(c.base + (rr() - 0.5) * 10 + bias.content / 2), 35, 100) });
  });
  const target = last(contentVals);
  const weighted = rawContent.reduce((a, c) => a + c.score * c.weight, 0) / 100;
  const shift = target - weighted;
  const contentComponents = rawContent.map((c) => {
    const score = clamp(Math.round(c.score + shift), 30, 100);
    const rr = rowRng(key, "contentDelta", c.id);
    return {
      id: c.id, name: c.name, weight: c.weight, hint: c.hint, score,
      delta: round((rr() - 0.45) * 12 * (sw > 1 ? 1.2 : 0.7), 1),
      lost: round(((100 - score) / 100) * c.weight, 1),
      failing: pool.filter((p) => p.contentScore < score - 6).length,
    };
  });

  const lowRank = pool.filter((p) => p.searchRank > 10);
  const lowAvail = pool.filter((p) => p.inStockRate < 90);
  const highPrice = pool.filter((p) => p.priceIndex > 1.1);
  const weakContent = pool.filter((p) => p.contentScore < 80);
  const opportunities = [
    { id: "o-rank", focus: "rank", title: "Improve search rank",
      problem: lowRank.length + " products sit outside the top 10 on keywords where a competitor ranks higher.",
      impact: lowRank.length > 6 ? "High" : "Medium", count: lowRank.length,
      why: "Positions 11 and below take a fraction of category click share, so the volume is going to rivals.",
      action: "Raise keyword coverage in titles and bullets on the affected SKUs, then re-crawl in 48 hours." },
    { id: "o-avail", focus: "avail", title: "Recover availability",
      problem: lowAvail.length + " products fell below the 90% availability threshold in this period.",
      impact: lowAvail.length > 2 ? "High" : "Medium", count: lowAvail.length,
      why: "Out-of-stock days suppress rank as well as sales, so the loss compounds after the gap is closed.",
      action: "Flag the replenishment gap with the retailer team and confirm forecast cover for the next cycle." },
    { id: "o-price", focus: "price", title: "Correct pricing",
      problem: highPrice.length + " products are priced more than 10% above the category average.",
      impact: highPrice.length > 4 ? "Medium" : "Low", count: highPrice.length,
      why: "Shoppers comparing on price filter these lines out before they reach the product page.",
      action: "Review promotional cover on these lines before the next price file goes out." },
    { id: "o-content", focus: "content", title: "Improve content",
      problem: weakContent.length + " products have incomplete attributes suppressing filter and long-tail discovery.",
      impact: weakContent.length > 8 ? "High" : "Medium", count: weakContent.length,
      why: "Missing structured fields keep these SKUs out of retailer filters and long-tail results.",
      action: "Complete the structured attribute set, starting with the highest-volume categories." },
  ].sort((a, b) => ({ High: 0, Medium: 1, Low: 2 } as any)[a.impact] - ({ High: 0, Medium: 1, Low: 2 } as any)[b.impact]);

  return {
    retailer, period, labels, generatedAt: "Today 06:40 UTC",
    kpis: [
      kpi("sos", "Share of Search", "%", sos, 40, 1),
      kpi("instock", "Availability", "%", stockVals, 98, 1),
      kpi("pidx", "Avg Price Index", "", priceIdx, 100, 1),
      kpi("content", "Content Score", "/100", contentVals, 95, 0),
      kpi("buybox", "Buy Box Share", "%", buyBox, 95, 0),
    ],
    visibility: {
      labels, previous: sos.map((v, i) => round(v - 2.4 - (i % 3) * 0.3, 1)), target: 40,
      series: [{ id: "brand", name: "Your portfolio", values: sos, emphasis: true }],
      byRetailer: byRetailer.map((r) => ({ label: r.name, value: r.visibility })),
      byCategory: byCategory.map((c) => ({ label: c.category, value: c.visibility })),
    },
    retailers: byRetailer,
    categories: byCategory,
    keywords,
    pricing: {
      own: ownPrice, categoryAvg: catAvg, index: idxNow,
      lowest: compPrices[0], highest: compPrices[compPrices.length - 1],
      competitors: compPrices,
      verdict: idxNow > 105 ? "above" : idxNow < 95 ? "below" : "inline",
      gap: round(((ownPrice - catAvg) / (catAvg || 1)) * 100, 1),
    },
    availability: {
      byRetailer: byRetailer.map((r) => ({
        name: r.name, inStock: r.inStock, low: r.low, oos: r.oos,
        rate: r.availability, total: r.skus || 1,
      })),
      attention,
      belowTarget: byRetailer.filter((r) => r.availability < 95).length,
      belowThreshold: lowAvail.length,
    },
    contentHealth: { overall: target, components: contentComponents },
    opportunities,
    products: pool,
  };
}

/* ── sales & share ─────────────────────────────────────────────────────
   Same product pool again: every sales figure on the page is a sum over the
   rows the shelf and overview pages already show. Maps onto /sales/*.
   ───────────────────────────────────────────────────────────────────── */

const CATEGORY_DRIVER: Record<string, string> = {
  "Beverages": "Cold Brew range",
  "Dairy alternatives": "Oat Milk range",
  "Snacks": "Sharing formats",
  "Personal care": "Barrier Repair Serum",
  "Nutrition": "Protein Bar multipacks",
  "Home care": "Laundry Concentrate",
};

function salesData(retailer: string, period: string) {
  const key = retailer + "|" + period;
  const seed = hash("sales" + key);
  const labels = labelsFor(period);
  const n = labels.length;
  const bias = RETAILER_BIAS[retailer] || RETAILER_BIAS.all;
  const sw = swing[period] || 1;
  const pool = poolFor(retailer, key);
  const sum = (arr: any[], f: (x: any) => number) => arr.reduce((a, x) => a + f(x), 0);
  const last = (a: number[]) => a[a.length - 1];
  const first = (a: number[]) => a[0];

  const total = sum(pool, (p) => p.sales);
  const prevTotal = sum(pool, (p) => p.prevSales) || 1;
  const units = sum(pool, (p) => p.units);
  const growth = round(((total - prevTotal) / prevTotal) * 100, 1);
  const share = round(clamp(27.8 + bias.sos * 0.35 + (rng(seed)() - 0.5) * 4, 8, 46), 1);
  const prevShare = round(clamp(share - (growth > 0 ? 1.6 : -1.1) * (sw > 1 ? 1 : 0.6), 5, 48), 1);
  const catGrowth = round(growth - 2.2 + (rng(seed + 1)() - 0.5) * 3, 1);

  /* trend: monthly/weekly slices of the period that sum back to the total */
  const shape = series(seed + 2, n, 1 - 0.06 * sw, 1 + 0.06 * sw, 0.05, 3);
  const shapeSum = shape.reduce((a, v) => a + v, 0) || 1;
  const salesSeries = shape.map((v) => Math.round((v / shapeSum) * total));
  const unitSeries = shape.map((v) => Math.round((v / shapeSum) * units));
  const prevSeries = salesSeries.map((v, i) => Math.round(v / (1 + (growth / 100) * ((i + 1) / n))));
  const growthSeries = salesSeries.map((v, i) => round(((v - prevSeries[i]) / (prevSeries[i] || 1)) * 100, 1));
  const benchSeries = salesSeries.map((v) => Math.round(v * (1 + catGrowth / 400)));

  /* share over time — own plus three rivals, remainder is "other" */
  const shareSeries = series(seed + 3, n, prevShare, share, 0.5, 1);
  const rivals = competitorBrands.slice(0, 3).map((c) => {
    const rr = rowRng(key, "salesShare", c.id);
    const now = round(clamp(c.share * 0.72 + (rr() - 0.5) * 4, 5, 34), 1);
    const before = round(clamp(now + (rr() - 0.55) * 2.4 * sw, 4, 36), 1);
    return { id: c.id, name: c.name, now, before, values: series(hash(key + c.id), n, before, now, 0.4, 1) };
  });
  const otherSeries = shareSeries.map((v, i) => round(clamp(100 - v - rivals.reduce((a, r) => a + r.values[i], 0), 2, 60), 1));
  const otherNow = otherSeries[otherSeries.length - 1];

  const rankOrder = [{ id: "own", current: share }]
    .concat(rivals.map((r) => ({ id: r.id, current: r.now })))
    .concat([{ id: "other", current: otherNow }])
    .sort((a, b) => b.current - a.current).map((x) => x.id);
  const rankOf = (id: string) => rankOrder.indexOf(id) + 1;

  const shareRows = [{
    id: "own", name: "Shelfline portfolio", current: share, previous: prevShare,
    change: round(share - prevShare, 1), own: true, rank: rankOf("own"),
  }].concat(rivals.map((r) => ({
    id: r.id, name: r.name, current: r.now, previous: r.before,
    change: round(r.now - r.before, 1), own: false, rank: rankOf(r.id),
  }))).concat([{
    id: "other", name: "All other brands", current: otherNow,
    previous: round(otherNow + 0.4, 1), change: -0.4, own: false, rank: rankOf("other"),
  }]).sort((a, b) => b.current - a.current);

  const byRetailer = retailers.slice(1).map((rt) => {
    const rr = rowRng(key, "salesRetailer", rt.id);
    const own = catalog.filter((p) => p.retailer === rt.id)
      .map((p) => withSalesMetrics(withShelfMetrics(productFor(p, key)), key));
    const rSales = sum(own, (p) => p.sales) || Math.round(total / 4);
    const rPrev = sum(own, (p) => p.prevSales) || 1;
    return {
      id: rt.id, name: rt.name, skus: own.length,
      sales: rSales, units: sum(own, (p) => p.units),
      growth: round(((rSales - rPrev) / (rPrev || 1)) * 100, 1),
      share: round(clamp(26 + RETAILER_BIAS[rt.id].sos * 0.4 + (rr() - 0.5) * 6, 6, 48), 1),
      status: "",
      avgPrice: own.length ? round(rSales / (sum(own, (p) => p.units) || 1), 2) : 0,
      contribution: 0,
    };
  });
  const retailerTotal = sum(byRetailer, (r) => r.sales) || 1;
  byRetailer.forEach((r) => {
    r.contribution = round((r.sales / retailerTotal) * 100, 1);
    r.status = r.growth >= 3 ? "Growing" : r.growth <= -3 ? "Declining" : "Stable";
  });

  const byCategory = categories.map((c) => {
    const rr = rowRng(key, "salesCategory", c);
    const inCat = pool.filter((p) => p.category === c);
    const cSales = sum(inCat, (p) => p.sales);
    const cPrev = sum(inCat, (p) => p.prevSales) || 1;
    const cUnits = sum(inCat, (p) => p.units);
    return {
      category: c, skus: inCat.length, sales: cSales, units: cUnits,
      growth: inCat.length ? round(((cSales - cPrev) / cPrev) * 100, 1) : round((rr() - 0.5) * 12, 1),
      share: round(clamp(18 + rr() * 22 + bias.sos * 0.2, 4, 52), 1),
      contribution: round((cSales / (total || 1)) * 100, 1),
      avgPrice: cUnits ? round(cSales / cUnits, 2) : 0,
      delta: cSales - cPrev,
    };
  });

  const sorted = byCategory.slice().sort((a, b) => b.delta - a.delta);
  const drivers = sorted.filter((c) => c.delta > 0).slice(0, 3).map((c) => ({
    label: c.category, delta: c.delta, growth: c.growth,
    driver: CATEGORY_DRIVER[c.category] || "Core range",
    reason: "Primary driver: " + (CATEGORY_DRIVER[c.category] || "core range"),
  }));
  const headwinds = sorted.filter((c) => c.delta < 0).slice(-3).reverse().map((c) => {
    const inCat = pool.filter((p) => p.category === c.category);
    const availPain = inCat.filter((p) => p.inStockRate < 95).length;
    const pricePain = inCat.filter((p) => p.priceIndex > 1.08).length;
    return {
      label: c.category, delta: c.delta, growth: c.growth,
      driver: availPain >= pricePain ? "lower availability" : "price increases",
      reason: "Primary driver: " + (availPain >= pricePain ? "lower availability" : "price increases"),
    };
  });

  /* growth vs share matrix — categories as bubbles */
  const matrix = byCategory.map((c) => ({
    label: c.category, x: c.share, y: c.growth, size: c.sales, contribution: c.contribution,
    quadrant: c.share >= 28 ? (c.growth >= growth ? "Leaders" : "Defend")
      : (c.growth >= growth ? "Emerging" : "At risk"),
  }));

  const movers = pool.slice().sort((a, b) => (b.sales - b.prevSales) - (a.sales - a.prevSales));
  const gains = movers.filter((p) => p.sales > p.prevSales).slice(0, 4)
    .map((p) => ({ id: p.id, name: p.name, retailerName: p.retailerName, delta: p.sales - p.prevSales, growth: p.salesGrowth }));
  const declines = movers.filter((p) => p.sales < p.prevSales).slice(-4).reverse()
    .map((p) => ({ id: p.id, name: p.name, retailerName: p.retailerName, delta: p.sales - p.prevSales, growth: p.salesGrowth }));

  /* shelf → sales bridge: the shelf signals that moved with the sales line */
  const shelf = shelfData(retailer, period);
  const shelfKpi = (id: string) => shelf.kpis.find((k) => k.id === id) || { delta: 0, value: 0 };
  const signals = [
    { label: "Availability", delta: shelfKpi("instock").delta, unit: " pts", value: shelfKpi("instock").value + "%" },
    { label: "Search visibility", delta: shelfKpi("sos").delta, unit: " pts", value: shelfKpi("sos").value + "%" },
    { label: "Content score", delta: shelfKpi("content").delta, unit: " pts", value: String(shelfKpi("content").value) },
    { label: "Buy box share", delta: shelfKpi("buybox").delta, unit: " pts", value: shelfKpi("buybox").value + "%" },
  ];

  const byMove = signals.slice().sort((a, b) => a.delta - b.delta);
  const weakest = byMove[0], strongest = byMove[byMove.length - 1];
  const SIGNAL_FOCUS: Record<string, string> = { "Availability": "avail", "Search visibility": "rank", "Content score": "content", "Buy box share": "avail" };
  const diagnosis = {
    sales: growth,
    headline: growth < 0 ? "Likely driver: " + weakest.label.toLowerCase() : "Most likely support: " + strongest.label.toLowerCase(),
    text: growth < 0
      ? weakest.label + " fell " + Math.abs(weakest.delta).toFixed(1) + " pts while " + strongest.label.toLowerCase() +
        " moved " + (strongest.delta >= 0 ? "up " : "down ") + Math.abs(strongest.delta).toFixed(1) +
        " pts. The decline tracks " + weakest.label.toLowerCase() + " more closely than discoverability."
      : strongest.label + " rose " + Math.abs(strongest.delta).toFixed(1) + " pts over the same window, with " +
        weakest.label.toLowerCase() + " the weakest signal at " + (weakest.delta >= 0 ? "+" : "−") +
        Math.abs(weakest.delta).toFixed(1) + " pts — the growth is coming from the shelf, not from price alone.",
    actionLabel: "Investigate " + weakest.label.toLowerCase(),
    focus: SIGNAL_FOCUS[weakest.label] || "avail",
  };

  const topCat = byCategory.slice().sort((a, b) => b.growth - a.growth)[0];
  const topRetailer = byRetailer.slice().sort((a, b) => b.growth - a.growth)[0];
  const decliners = pool.filter((p) => p.salesGrowth < 0);
  const pricey = pool.filter((p) => p.priceIndex > 1.1 && p.sales > total / (pool.length || 1));
  const opportunities = [
    { id: "so-share", focus: "", target: "category", title: "Gain share in " + topCat.category,
      problem: topCat.category + " is growing " + topCat.growth.toFixed(1) + "%, but your share sits " +
        Math.abs(round(rivals[0].now - topCat.share, 1)).toFixed(1) + " pts behind the category leader.",
      why: "Category demand is expanding faster than your position in it, so the gap widens every period.",
      impact: "High", count: topCat.skus, action: "Concentrate keyword and promotional cover on the top three SKUs in this category.",
      cta: "View category", value: topCat.category },
    { id: "so-decline", focus: "declining", target: "products", title: "Recover declining products",
      problem: decliners.length + " products have falling sales while category demand stays positive.",
      why: "These are losses inside a growing market — the demand exists and is going to somebody else.",
      impact: "High", count: decliners.length, action: "Check availability and search rank on each before treating it as a pricing issue.",
      cta: "View products", value: "" },
    { id: "so-retailer", focus: "", target: "retailer", title: "Expand " + topRetailer.name,
      problem: topRetailer.name + " is growing " + topRetailer.growth.toFixed(1) + "% and already contributes " +
        topRetailer.contribution.toFixed(1) + "% of sales.",
      why: "Incremental range and promotional slots convert fastest where the account is already accelerating.",
      impact: "Medium", count: topRetailer.skus, action: "Take the range extension case to this account first this quarter.",
      cta: "View retailer", value: topRetailer.id },
    { id: "so-price", focus: "price", target: "products", title: "Review pricing",
      problem: pricey.length + " high-volume products are priced materially above the category average.",
      why: "Price-led comparison shopping removes these lines from consideration before the page is seen.",
      impact: "Medium", count: pricey.length, action: "Model a promotional price on the highest-volume lines before the next price file.",
      cta: "View products", value: "" },
  ];

  const kpi = (id: string, label: string, unit: string, vals: number[], target: number, digits: number) => ({
    id, label, unit, target, value: last(vals),
    delta: round(last(vals) - first(vals), digits), spark: vals,
  });

  return {
    retailer, period, labels, generatedAt: "Today 06:40 UTC",
    totals: { sales: total, previous: prevTotal, units, growth, share, prevShare, catGrowth },
    kpis: [
      { id: "sales", label: "Estimated Sales", unit: "", value: total, target: prevTotal,
        delta: total - prevTotal, spark: salesSeries },
      kpi("growth", "Sales Growth", "%", growthSeries, 5, 1),
      kpi("share", "Market Share", "%", shareSeries, 30, 1),
      { id: "catgrowth", label: "Category Growth", unit: "%", value: catGrowth, target: growth,
        delta: round(catGrowth - growth, 1), spark: growthSeries.map((v) => round(v - 2.2, 1)) },
    ],
    trend: {
      labels, sales: salesSeries, units: unitSeries, growth: growthSeries,
      previous: prevSeries, benchmark: benchSeries,
    },
    share: {
      labels, own: { name: "Your portfolio", values: shareSeries, current: share, previous: prevShare },
      rivals, other: otherNow, otherValues: otherSeries, rows: shareRows,
    },
    retailers: byRetailer,
    categories: byCategory,
    drivers, headwinds,
    matrix, growthBaseline: growth,
    movement: { gains, declines },
    signals, diagnosis,
    opportunities,
    products: pool,
  };
}

export function fetchSales({ retailer = "all", period = "12w" }: { retailer?: string; period?: string } = {}) {
  return new Promise<any>((resolve) => setTimeout(() => resolve(salesData(retailer, period)), LATENCY));
}

export function fetchShelf({ retailer = "all", period = "12w" }: { retailer?: string; period?: string } = {}) {
  return new Promise<any>((resolve) => setTimeout(() => resolve(shelfData(retailer, period)), LATENCY));
}

export function fetchProduct(id: string, { retailer = "all", period = "12w" }: { retailer?: string; period?: string } = {}) {
  return new Promise<any>((resolve, reject) => setTimeout(() => {
    const base = catalog.find((p) => p.id === id);
    if (!base) return reject(new Error("Product not found: " + id));
    const key = retailer + "|" + period;
    const p: any = withSalesMetrics(withShelfMetrics(productFor(base, key)), key);
    p.opportunity = scoreOpportunity(p);
    const labels = labelsFor(period);
    const n = labels.length;
    const seed = hash(id + key);
    const sw = swing[period] || 1;
    const r = rng(seed + 99);
    const catPool = catalog.filter((x) => x.category === base.category)
      .map((x) => withSalesMetrics(withShelfMetrics(productFor(x, key)), key));
    const catTotal = catPool.reduce((a, x) => a + x.sales, 0);
    const catPrev = catPool.reduce((a, x) => a + x.prevSales, 0) || 1;
    const catGrowth = round(((catTotal - catPrev) / catPrev) * 100, 1);
    const salesTrend = series(seed + 6, n, Math.round(p.prevSales / n), Math.round(p.sales / n), p.sales / (n * 12), 0)
      .map((v) => Math.max(0, Math.round(v)));
    resolve({
      product: p,
      labels,
      trends: {
        rank: series(seed + 1, n, clamp(p.searchRank + 3 * sw, 1, 40), p.searchRank, 1.2, 0).map((v) => clamp(Math.round(v), 1, 40)),
        price: series(seed + 2, n, round(p.price * (1 + 0.06 * sw), 2), p.price, p.price * 0.02, 2),
        stock: series(seed + 3, n, p.inStockRate - 3 * sw, p.inStockRate, 1.6, 1).map((v) => round(clamp(v, 40, 100), 1)),
        rating: series(seed + 4, n, round(p.rating - 0.12 * sw, 2), p.rating, 0.03, 2),
        reviews: series(seed + 5, n, p.reviews * 0.9, p.reviews, p.reviews * 0.008, 0),
      },
      retailerPerformance: retailers.slice(1).map((rt) => {
        const rr = rowRng(key, id + "-retailer", rt.id);
        return {
          retailer: rt.name,
          rank: clamp(Math.round(p.searchRank + (rr() - 0.5) * 8), 1, 40),
          price: round(p.price * (0.94 + rr() * 0.14), 2),
          inStock: round(clamp(p.inStockRate + (rr() - 0.5) * 12, 40, 100), 1),
          rating: round(clamp(p.rating + (rr() - 0.5) * 0.4, 3, 5), 2),
          content: clamp(Math.round(p.contentScore + (rr() - 0.5) * 16), 30, 100),
          listed: rr() > 0.12,
        };
      }),
      contentBreakdown: contentAttributes.map((a) => {
        const rr = rowRng(key, id + "-attr", a.id);
        return { name: a.name, weight: a.weight, pass: rr() > 0.3 };
      }),
      reviewMix: [5, 4, 3, 2, 1].map((stars, i) => {
        const rr = rowRng(key, id + "-stars", String(stars));
        const w = [0.56, 0.24, 0.11, 0.05, 0.04][i] * (0.85 + rr() * 0.3);
        return { stars, count: Math.round(p.reviews * w) };
      }),
      priceComparison: competitorBrands.slice(0, 3).map((c) => {
        const rr = rowRng(key, id + "-price", c.id);
        return { name: c.name, price: round(p.price * (0.88 + rr() * 0.28), 2) };
      }),
      lastCrawl: "Today 06:40 UTC",
      sales: {
        value: p.sales, previous: p.prevSales, growth: p.salesGrowth, units: p.units,
        avgPrice: p.price,
        contribution: round((p.sales / (catTotal || 1)) * 100, 1),
        categoryGrowth: catGrowth,
        trend: salesTrend,
        byRetailer: retailers.slice(1).map((rt) => {
          const rr = rowRng(key, id + "-sales", rt.id);
          const s = Math.round(p.sales * (0.35 + rr() * 0.9));
          return { retailer: rt.name, sales: s, growth: round((rr() - 0.45) * 24, 1), units: Math.round(s / p.price) };
        }),
      },
      note: p.buyBox
        ? "Buy box held for the full period."
        : "Buy box lost for " + (1 + Math.round(r() * 4)) + " days in the period.",
    });
  }, LATENCY));
}

export function toCsv(rows: any[]) {
  const cols = ["SKU", "Product", "Brand", "Category", "Retailer", "Search Rank", "Rank Delta", "Search Visibility %", "Price", "Price Index", "Stock Status", "In Stock %", "Rating", "Reviews", "Content Score", "Shelf Score", "Opportunity"];
  const cell = (v: any) => {
    const s = String(v == null ? "" : v);
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  const lines = [cols.join(",")].concat(rows.map((p) => [
    p.id.toUpperCase(), p.name, p.brand, p.category, p.retailerName, p.searchRank, p.rankDelta,
    p.searchVisibility, p.price.toFixed(2), (p.priceIndex * 100).toFixed(0), p.stockStatus, p.inStockRate,
    p.rating.toFixed(2), p.reviews, p.contentScore, p.shelfScore, p.opportunity,
  ].map(cell).join(",")));
  return lines.join("\n");
}
