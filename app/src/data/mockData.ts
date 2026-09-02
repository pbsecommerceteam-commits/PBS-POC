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

/* Retailers, catalog and category codes below are not synthetic — they are
   the real September 2022 crawl (117 SKUs across 7 retailers: Amazon, Chewy,
   Walmart, The Home Depot, PetSmart, Lowe's, Petco) sourced from
   "Main Working File.xlsx" (Content / Price / Share Of Search tabs) and
   rebuilt by app/scripts/build_mock_data.py — see that script for the
   full derivation of every field below (content-completeness rubric,
   priceGroup, cross-retailer matching, retailer bias, etc.). Everything
   below this block (rng/series/derivation helpers) still adds
   period-over-period jitter around these real base values — the September
   crawl is a single snapshot, not a live feed, so per-period movement
   outside the "Last 4 weeks" window is illustrative, not re-crawled. */

export const retailers = [
  { id: "all", name: "All retailers" },
  { id: "r1", name: "Amazon.com" },
  { id: "r2", name: "Chewy" },
  { id: "r3", name: "Walmart" },
  { id: "r4", name: "The Home Depot" },
  { id: "r5", name: "PetSmart" },
  { id: "r6", name: "Lowe's" },
  { id: "r7", name: "Petco" },
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
  overview: { title: "Overview", subtitle: "Monitor digital shelf health across your retailers, products and categories." },
  shelf: { title: "Digital Shelf", subtitle: "Monitor product visibility, availability, pricing and content across retailers" },
  alerts: { title: "Alerts", subtitle: "Rules watching the portfolio and what they have caught" },
  reports: { title: "Reports", subtitle: "Scheduled exports and briefings sent to your teams" },
  sales: { title: "Performance Intelligence", subtitle: "Understand how products perform across search, pricing, availability and retailer conditions." },
  content: { title: "Content Intelligence", subtitle: "Measure product-content completeness across monitored retailers." },
  reviews: { title: "Ratings & Reviews", subtitle: "Rating trajectory, review volume and retailer/category comparisons" },
  competitors: { title: "Competitive Intelligence", subtitle: "Compare listings, pricing, availability and search presence across the monitored competitive set." },
  settings: { title: "Settings", subtitle: "Workspace defaults, alerting and data refresh" },
};

export const alertTypes = [
  { id: "instock", name: "Stock availability", condition: "In-stock rate falls below", unit: "%", preset: "95" },
  { id: "price", name: "Price change", condition: "Shelf price moves by more than", unit: "%", preset: "5" },
  { id: "rank", name: "Search rank change", condition: "Search rank drops below position", unit: "", preset: "10" },
  { id: "rating", name: "Rating change", condition: "Average rating falls below", unit: "", preset: "4.2" },
  { id: "content", name: "Content completeness", condition: "Content completeness falls below", unit: "/100", preset: "80" },
  { id: "competitor", name: "Competitor movement", condition: "Competitor share of search rises above", unit: "%", preset: "30" },
];

export const alertScopes = [
  { id: "portfolio", name: "Entire portfolio" },
  { id: "cat:GPC", name: "Category — GPC" },
  { id: "cat:HPC", name: "Category — HPC" },
  { id: "cat:HG", name: "Category — HG" },
];

export const alertFrequencies = ["Real time", "Twice daily", "Daily digest", "Weekly summary"];
export const alertChannels = ["Email digest", "Email + Slack", "In-app only"];

export const alertRules = [
  { id: "ar1", name: "Core SKU availability", type: "Stock availability", condition: "In-stock rate below 95%", scope: "Entire portfolio", retailer: "All retailers", frequency: "Real time", channel: "Email + Slack", status: "Active", triggered: "3 times this week" },
  { id: "ar2", name: "HG rank watch", type: "Search rank change", condition: "Rank drops below position 10", scope: "Category — HG", retailer: "Lowe's", frequency: "Daily digest", channel: "Email digest", status: "Active", triggered: "Once this week" },
  { id: "ar3", name: "Competitor price undercut", type: "Price change", condition: "Competitor priced 5% below", scope: "Entire portfolio", retailer: "Walmart", frequency: "Twice daily", channel: "Email + Slack", status: "Active", triggered: "4 times this week" },
  { id: "ar4", name: "Content compliance sweep", type: "Content completeness", condition: "Content completeness below 80", scope: "Entire portfolio", retailer: "All retailers", frequency: "Weekly summary", channel: "In-app only", status: "Paused", triggered: "—" },
  { id: "ar5", name: "Rating erosion", type: "Rating change", condition: "Average rating below 4.2", scope: "Category — GPC", retailer: "PetSmart", frequency: "Daily digest", channel: "Email digest", status: "Active", triggered: "Twice this week" },
];

export const reports = [
  { id: "rp1", name: "Monday shelf health", contents: "KPIs, availability, rank movement", cadence: "Weekly — Monday 07:00", recipients: "Commercial team (9)", lastSent: "Mon 07:00", format: "PDF + CSV", status: "Scheduled" },
  { id: "rp2", name: "Category share review", contents: "Share of search by category and retailer", cadence: "Monthly — 1st 08:00", recipients: "Category leads (4)", lastSent: "1 Aug 08:00", format: "PDF", status: "Scheduled" },
  { id: "rp3", name: "Content compliance export", contents: "Attribute coverage, failing SKUs", cadence: "Weekly — Thursday 06:00", recipients: "Content ops (6)", lastSent: "Thu 06:00", format: "CSV", status: "Scheduled" },
  { id: "rp4", name: "Competitor pricing brief", contents: "Rival price index and share-of-search change", cadence: "On demand", recipients: "Pricing (3)", lastSent: "12 Aug 14:20", format: "XLSX", status: "Draft" },
];

/* ── product catalog ──────────────────────────────────────────────────── */

export const catalog = [
  { id: "r1-B000084EN5", name: "TetraPond Koi Vibrance 5.18 Pounds, Soft Sticks, Floating Pond Food, Model:16486", brand: "Tetra Pond", category: "GPC", retailer: "r1", rank: 1, price: 27.19, avgSellingPrice: 27.19, rating: 4.8, reviews: 11315, content: 84, stockBias: 1.0, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "r1::GPC" },
  { id: "r1-B000255NKA", name: "Instant Ocean Sea Salt for Marine Fish Tank Aquariums, Nitrate & Phosphate-Free", brand: "Instant Ocean", category: "GPC", retailer: "r1", rank: 2, price: 12.99, avgSellingPrice: 12.95, rating: 4.8, reviews: 7201, content: 76, stockBias: 1.0, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "r1::GPC" },
  { id: "r1-B000084EMZ", name: "TetraPond Pond Sticks Pond Fish Food for Goldfish and Koi, Healthy Nutrition Clear Water Pond Food", brand: "Tetra Pond", category: "GPC", retailer: "r1", rank: 3, price: 22.64, avgSellingPrice: 22.64, rating: 4.8, reviews: 2339, content: 82, stockBias: 0.87, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "r1::GPC" },
  { id: "r1-B000255NLE", name: "Instant Ocean SeaClone Protein Skimmer, External Hang-On or In-Sump", brand: "Instant Ocean", category: "GPC", retailer: "r1", rank: 4, price: 69.99, avgSellingPrice: 71.8, rating: 4.1, reviews: 882, content: 66, stockBias: 1.0, buyBoxRate: 0.97, priceChangePct: -15.7, priceGroup: "r1::GPC" },
  { id: "r1-B000255QWA", name: "Tetra 25870 Impeller Whisper Power filter, 60-Gallon - 75069200", brand: "Tetra", category: "GPC", retailer: "r1", rank: 5, price: 6.59, avgSellingPrice: 8.92, rating: 4.6, reviews: 618, content: 56, stockBias: 1.0, buyBoxRate: 1.0, priceChangePct: -40.1, priceGroup: "r1::GPC" },
  { id: "r1-B0002561OM", name: "Jungle TB625W Tank Buddies Ick Clear Tablets, 8-Count", brand: "Jungle", category: "GPC", retailer: "r1", rank: 6, price: 3.99, avgSellingPrice: 3.99, rating: 4.4, reviews: 490, content: 52, stockBias: 1.0, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "r1::GPC" },
  { id: "r1-B000255OAE", name: "Marineland 31003 Silicone Squeeze Tube, 2.8-Ounce, 85.05-Gram", brand: "MarineLand", category: "GPC", retailer: "r1", rank: 7, price: 8.83, avgSellingPrice: 9.0, rating: 4.6, reviews: 224, content: 59, stockBias: 1.0, buyBoxRate: 0.33, priceChangePct: -5.6, priceGroup: "r1::GPC" },
  { id: "r1-B000255OAO", name: "Marineland 31010 Silicone Caulker, 10.3-Ounce, 304 ml", brand: "MarineLand", category: "GPC", retailer: "r1", rank: 8, price: 9.23, avgSellingPrice: 9.75, rating: 4.5, reviews: 185, content: 59, stockBias: 0.07, buyBoxRate: 0.07, priceChangePct: -10.1, priceGroup: "r1::GPC" },
  { id: "r1-B000255NK0", name: "Instant Ocean Sea Salt (25 gal)", brand: "Instant Ocean", category: "GPC", retailer: "r1", rank: 9, price: 18.57, avgSellingPrice: 18.57, rating: 4.7, reviews: 110, content: 63, stockBias: 0.0, buyBoxRate: 0.0, priceChangePct: 0.0, priceGroup: "r1::GPC" },
  { id: "r1-B000255N8C", name: "Marineland Duetto Chemical Filter Cartridge, For Duetto Submersible Power Filter", brand: "MarineLand", category: "GPC", retailer: "r1", rank: 10, price: 5.69, avgSellingPrice: 5.66, rating: 4.6, reviews: 23, content: 73, stockBias: 1.0, buyBoxRate: 1.0, priceChangePct: 2.3, priceGroup: "r1::GPC" },
  { id: "r1-B000BWY6K2", name: "Garden Safe Brand Insecticidal Soap Insect Killer 24 Ounces, Ready-To-Use, For Organic Gardening, 1 Pack", brand: "Garden Safe", category: "HG", retailer: "r1", rank: 1, price: 6.98, avgSellingPrice: 7.14, rating: 4.3, reviews: 6447, content: 80, stockBias: 1.0, buyBoxRate: 1.0, priceChangePct: -0.1, priceGroup: "r1::HG" },
  { id: "r1-B000HHO110", name: "Garden Safe Brand Fungicide3, Ready-to-Use, 24-Ounce, 1 Pack", brand: "Garden Safe", category: "HG", retailer: "r1", rank: 2, price: 7.97, avgSellingPrice: 7.31, rating: 4.3, reviews: 6124, content: 84, stockBias: 1.0, buyBoxRate: 1.0, priceChangePct: 33.3, priceGroup: "r1::HG" },
  { id: "r1-B000HM68HK", name: "Spectracide 53960 HG-53960 Triazicide Insect Killer for Lawns Granules 20 lb, 1-PK, 20 ibn", brand: "Spectracide", category: "HG", retailer: "r1", rank: 3, price: 13.62, avgSellingPrice: 13.62, rating: 4.5, reviews: 4921, content: 84, stockBias: 0.0, buyBoxRate: 0.0, priceChangePct: 0.0, priceGroup: "r1::HG" },
  { id: "r1-B000IO1TDU", name: "Spectracide Pruning Seal Aerosol, 13 oz.", brand: "Spectrum", category: "HG", retailer: "r1", rank: 4, price: 5.98, avgSellingPrice: 5.98, rating: 4.6, reviews: 1757, content: 78, stockBias: 1.0, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "r1::HG" },
  { id: "r1-B000I1B0JQ", name: "Hot Shot Ant Killer Plus Aerosol, Unscented, Kills On Contact", brand: "Hot Shot", category: "HG", retailer: "r1", rank: 5, price: 8.08, avgSellingPrice: 8.08, rating: 4.5, reviews: 1348, content: 74, stockBias: 1.0, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "r1::HG" },
  { id: "r1-B000BQURQA", name: "Spectracide 56904 Bag-A-Bug Kwik Stand (HG-56904), 1Pack, Silver", brand: "Spectracide", category: "HG", retailer: "r1", rank: 6, price: 5.28, avgSellingPrice: 6.25, rating: 4.2, reviews: 1305, content: 85, stockBias: 1.0, buyBoxRate: 1.0, priceChangePct: -18.6, priceGroup: "r1::HG" },
  { id: "r1-B00002NC7W", name: "Spectracide Bag-A-Bug Japanese Beetle Trap Replacement Lure 1 Count, Lure Refill", brand: "Spectracide", category: "HG", retailer: "r1", rank: 7, price: 5.99, avgSellingPrice: 5.99, rating: 4.5, reviews: 1294, content: 78, stockBias: 1.0, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "r1::HG" },
  { id: "r1-B000BQU0LC", name: "Spectracide 56903 HG-56903 Insect Killer, 6 Bags", brand: "Spectracide", category: "HG", retailer: "r1", rank: 8, price: 3.78, avgSellingPrice: 3.78, rating: 4.5, reviews: 795, content: 72, stockBias: 1.0, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "r1::HG" },
  { id: "r1-B000HSZH0S", name: "Liquid Fence 147 Goose Repellent, 1-Quart Concentrate (Discontinued by, Pack of 1", brand: "Liquid Fence", category: "HG", retailer: "r1", rank: 9, price: 69, avgSellingPrice: 59.1, rating: 3, reviews: 453, content: 76, stockBias: 0.2, buyBoxRate: 0.0, priceChangePct: 43.2, priceGroup: "r1::HG" },
  { id: "r1-B000I15AH4", name: "Spectracide Weed And Grass Killer Concentrate 16 Ounces, Use On Patios, Walkways And Driveways", brand: "Spectracide", category: "HG", retailer: "r1", rank: 10, price: 9.48, avgSellingPrice: 9.48, rating: 4.5, reviews: 400, content: 78, stockBias: 0.7, buyBoxRate: 0.87, priceChangePct: 0.0, priceGroup: "r1::HG" },
  { id: "r1-B00004R946", name: "Spectrum Brands Farberware 8-Cup Percolator, Stainless Steel, FCP280, Black", brand: "Farberware", category: "HPC", retailer: "r1", rank: 1, price: 51.96, avgSellingPrice: 52.74, rating: 4.4, reviews: 2260, content: 61, stockBias: 1.0, buyBoxRate: 0.97, priceChangePct: -2.1, priceGroup: "r1::HPC" },
  { id: "r1-B00004R93Z", name: "George Foreman GR10AWHT Champ Grill", brand: "George Foreman", category: "HPC", retailer: "r1", rank: 2, price: 28.17, avgSellingPrice: 32.15, rating: 4.3, reviews: 395, content: 51, stockBias: 0.9, buyBoxRate: 0.0, priceChangePct: 0.0, priceGroup: "r1::HPC" },
  { id: "r1-B00004SC51", name: "Black & Decker CJ525 CitrusMate Plus Citrus Juicer", brand: "BLACK+DECKER", category: "HPC", retailer: "r1", rank: 3, price: 47.83, avgSellingPrice: 62.25, rating: 4, reviews: 332, content: 58, stockBias: 0.5, buyBoxRate: 0.0, priceChangePct: -40.2, priceGroup: "r1::HPC" },
  { id: "r1-B00004SC4X", name: "Black & Decker EC600 Spacemaker Under-Counter Can Opener", brand: "BLACK+DECKER", category: "HPC", retailer: "r1", rank: 4, price: 148.18, avgSellingPrice: 148.18, rating: 4.1, reviews: 116, content: 52, stockBias: 0.97, buyBoxRate: 0.0, priceChangePct: 0.0, priceGroup: "r1::HPC" },
  { id: "r1-B00004R940", name: "George Foreman GR20WHT XL Grill", brand: "George Foreman", category: "HPC", retailer: "r1", rank: 5, price: 63.1, avgSellingPrice: 63.1, rating: 3.8, reviews: 84, content: 50, stockBias: 0.0, buyBoxRate: 0.0, priceChangePct: 0.0, priceGroup: "r1::HPC" },
  { id: "r1-B00004SC50", name: "Black & Decker HS2000 Flavor Scenter Steamer and Rice Cooker", brand: "BLACK+DECKER", category: "HPC", retailer: "r1", rank: 6, price: 98.18, avgSellingPrice: 129.09, rating: 3.9, reviews: 80, content: 58, stockBias: 0.07, buyBoxRate: 0.0, priceChangePct: -38.6, priceGroup: "r1::HPC" },
  { id: "r1-B00004SC5M", name: "Black & Decker EC1200 Grand Openings Can Opener", brand: "BLACK+DECKER", category: "HPC", retailer: "r1", rank: 7, price: 49.95, avgSellingPrice: 84.69, rating: 3.3, reviews: 29, content: 56, stockBias: 0.27, buyBoxRate: 0.0, priceChangePct: -61.3, priceGroup: "r1::HPC" },
  { id: "r1-B00004SPZS", name: "Black & Decker KEC500 Ergo Cordless Can Opener", brand: "BLACK+DECKER", category: "HPC", retailer: "r1", rank: 8, price: 24.99, avgSellingPrice: 24.59, rating: 3.8, reviews: 21, content: 56, stockBias: 0.0, buyBoxRate: 0.67, priceChangePct: 4.1, priceGroup: "r1::HPC" },
  { id: "r1-B00004SQ00", name: "Black & Decker CTO8100 Dining-In Electronic Countertop Toaster Oven, Black", brand: "BLACK+DECKER", category: "HPC", retailer: "r1", rank: 9, price: 94.95, avgSellingPrice: 94.75, rating: 3, reviews: 13, content: 50, stockBias: 0.0, buyBoxRate: 0.93, priceChangePct: 1.0, priceGroup: "r1::HPC" },
  { id: "r1-B00004SQ1I", name: "Black & Decker Ergo 200-Watt Hand Mixer", brand: "BLACK+DECKER", category: "HPC", retailer: "r1", rank: 10, price: 23.67, avgSellingPrice: 23.57, rating: 5, reviews: 4, content: 48, stockBias: 0.2, buyBoxRate: 0.73, priceChangePct: 2.9, priceGroup: "r1::HPC" },
  { id: "r2-40150", name: "FURMINATOR Nail Grinder For Dogs & Cats ", brand: "FURminator", category: "GPC", retailer: "r2", rank: 1, price: 24.99, avgSellingPrice: 24.99, rating: 3.5102, reviews: 635, content: 65, stockBias: 1.0, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "r2::GPC" },
  { id: "r2-40181", name: "FURMINATOR Nail Grinder For Dogs & Cats ", brand: "FURminator", category: "GPC", retailer: "r2", rank: 2, price: 24.99, avgSellingPrice: 24.99, rating: 3.5102, reviews: 635, content: 65, stockBias: 1.0, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "r2::GPC" },
  { id: "r2-40281", name: "FURMINATOR Curry Comb For Dogs ", brand: "FURminator", category: "GPC", retailer: "r2", rank: 3, price: 8.19, avgSellingPrice: 8.19, rating: 4.1509, reviews: 391, content: 57, stockBias: 1.0, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "r2::GPC" },
  { id: "r2-40276", name: "FURMINATOR Firm Slicker Brush For Dogs, Large ", brand: "FURminator", category: "GPC", retailer: "r2", rank: 4, price: 11, avgSellingPrice: 11.0, rating: 4.1785, reviews: 325, content: 65, stockBias: 1.0, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "r2::GPC" },
  { id: "r2-42091", name: "NATURE'S MIRACLE Dog Enzymatic Urine Destroyer, 1-gal bottle ", brand: "Nature's Miracle", category: "GPC", retailer: "r2", rank: 5, price: 31.65, avgSellingPrice: 33.34, rating: 4.247, reviews: 251, content: 65, stockBias: 1.0, buyBoxRate: 1.0, priceChangePct: -16.7, priceGroup: "r2::GPC" },
  { id: "r2-42138", name: "NATURE'S MIRACLE House-Breaking Potty Training Spray, 8-oz bottle ", brand: "Nature's Miracle", category: "GPC", retailer: "r2", rank: 6, price: 7.01, avgSellingPrice: 7.5, rating: 1.9155, reviews: 142, content: 57, stockBias: 1.0, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "r2::GPC" },
  { id: "r2-40272", name: "FURMINATOR Nail Clippers For Dogs & Cats ", brand: "FURminator", category: "GPC", retailer: "r2", rank: 7, price: 8.47, avgSellingPrice: 8.47, rating: 3.568, reviews: 125, content: 65, stockBias: 1.0, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "r2::GPC" },
  { id: "r2-40274", name: "FURMINATOR Finishing Comb For Dogs, Large ", brand: "FURminator", category: "GPC", retailer: "r2", rank: 8, price: 9.19, avgSellingPrice: 9.19, rating: 4.4096, reviews: 83, content: 56, stockBias: 1.0, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "r2::GPC" },
  { id: "r2-40348", name: "FURMINATOR DeShedding Waterless Spray For Dogs, 8.5-oz bottle ", brand: "FURminator", category: "GPC", retailer: "r2", rank: 9, price: 7.55, avgSellingPrice: 7.3, rating: 4.4084, reviews: 71, content: 70, stockBias: 1.0, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "r2::GPC" },
  { id: "r2-40278", name: "FURMINATOR Soft Slicker Brush For Dogs, Large ", brand: "FURminator", category: "GPC", retailer: "r2", rank: 10, price: 13.15, avgSellingPrice: 11.96, rating: 3.9245, reviews: 53, content: 65, stockBias: 1.0, buyBoxRate: 1.0, priceChangePct: 19.5, priceGroup: "r2::GPC" },
  { id: "r3-3391780", name: "Petnation Port-A-Crate Indoor and Outdoor Home for Pets, 20\"", brand: "Petnation", category: "GPC", retailer: "r3", rank: 1, price: 36.69, avgSellingPrice: 34.16, rating: 4.6, reviews: 777, content: 46, stockBias: 0.0, buyBoxRate: 1.0, priceChangePct: 47.5, priceGroup: "r3::GPC" },
  { id: "r3-3391782", name: "Petnation Port-A-Crate Indoor & Outdoor Home for Pets, 32\"", brand: "Petnation", category: "GPC", retailer: "r3", rank: 2, price: 101.07, avgSellingPrice: 101.07, rating: 4.6, reviews: 777, content: 61, stockBias: 0.0, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "r3::GPC" },
  { id: "r3-3391783", name: "PetNation Port-A-Crate 36 Inches, Indoor And Outdoor Home For Pets", brand: "Petnation", category: "GPC", retailer: "r3", rank: 3, price: 48.72, avgSellingPrice: 48.72, rating: 4.6, reviews: 777, content: 61, stockBias: 0.0, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "r3::GPC" },
  { id: "r3-2684063", name: "George Foreman 6-Serving Removable Plate Electric Indoor Grill and Panini Press, Silver, GRP99", brand: "George Foreman", category: "GPC", retailer: "r3", rank: 4, price: 69.67, avgSellingPrice: 80.16, rating: 4.3, reviews: 459, content: 44, stockBias: 0.07, buyBoxRate: 1.0, priceChangePct: -8.7, priceGroup: "r3::GPC" },
  { id: "r3-10291577", name: "Aqua-Tech EZ-Change Replacement #3 Aquarium Filter Cartridge, 6 Pack", brand: "Aqua-Tech", category: "GPC", retailer: "r3", rank: 5, price: 13.97, avgSellingPrice: 14.41, rating: 4.7, reviews: 433, content: 59, stockBias: 0.87, buyBoxRate: 0.97, priceChangePct: 0.0, priceGroup: "r3::GPC" },
  { id: "r3-8207932", name: "Dingo Mini Bones 7 Count, Rawhide For Dogs, Made With Real Chicken", brand: "Dingo", category: "GPC", retailer: "r3", rank: 6, price: 7.47, avgSellingPrice: 7.29, rating: 4.9, reviews: 207, content: 61, stockBias: 0.97, buyBoxRate: 0.03, priceChangePct: 1.4, priceGroup: "r3::GPC" },
  { id: "r3-10291763", name: "Tetra Whisper 10-30 Gallon Internal Power Filter for Aquariums", brand: "Tetra", category: "GPC", retailer: "r3", rank: 7, price: 24, avgSellingPrice: 24.0, rating: 4.3, reviews: 110, content: 62, stockBias: 0.87, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "r3::GPC" },
  { id: "r3-10291760", name: "Tetra Pond Fish Food Premium Diet for Koi and Goldfish, 1.25 lbs", brand: "Tetra", category: "GPC", retailer: "r3", rank: 8, price: 13.74, avgSellingPrice: 18.23, rating: 4.8, reviews: 69, content: 58, stockBias: 1.0, buyBoxRate: 0.77, priceChangePct: 0.0, priceGroup: "r3::GPC" },
  { id: "r3-10291762", name: "Tetra Whisper Power Filter for Aquariums, 30-60 Gallon", brand: "Tetra", category: "GPC", retailer: "r3", rank: 9, price: 52, avgSellingPrice: 52.0, rating: 3.5, reviews: 66, content: 59, stockBias: 0.83, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "r3::GPC" },
  { id: "r3-4252994", name: "Jungle No More Algae Tank Buddies, 8 Ct", brand: "Jungle", category: "GPC", retailer: "r3", rank: 10, price: 4.32, avgSellingPrice: 4.31, rating: 3.7, reviews: 28, content: 42, stockBias: 0.83, buyBoxRate: 1.0, priceChangePct: 1.9, priceGroup: "r3::GPC" },
  { id: "r3-12166874", name: "Hot Shot No-Pest Strip 2, Controlled Release Technology Kills Flying and Crawling Insects 2.29 Ounce ( Value Pack of 5)", brand: "Hot Shot", category: "HG", retailer: "r3", rank: 1, price: 11.13, avgSellingPrice: 9.33, rating: 4.3, reviews: 107, content: 62, stockBias: 1.0, buyBoxRate: 0.0, priceChangePct: 22.3, priceGroup: "r3::HG" },
  { id: "r3-12444070", name: "Cutter Skinsations Insect Repellent, 7.5 Ounces, Pump Spray", brand: "Cutter", category: "HG", retailer: "r3", rank: 2, price: 4.18, avgSellingPrice: 4.14, rating: 4.3, reviews: 98, content: 62, stockBias: 0.83, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "r3::HG" },
  { id: "r3-15136592", name: "Cutter Skinsations Insect Repellent, Pump Spray, 6 Fluid Ounce", brand: "Cutter", category: "HG", retailer: "r3", rank: 3, price: 6.34, avgSellingPrice: 6.44, rating: 4.2, reviews: 66, content: 62, stockBias: 1.0, buyBoxRate: 0.0, priceChangePct: -3.5, priceGroup: "r3::HG" },
  { id: "r3-16561273", name: "Repel Insect Repellent Sportsmen Max Formula With 40% DEET 0.475 Ounce, Pen-Size Pump", brand: "Repel", category: "HG", retailer: "r3", rank: 4, price: 2.97, avgSellingPrice: 2.97, rating: 4.7, reviews: 46, content: 65, stockBias: 0.83, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "r3::HG" },
  { id: "r3-12444073", name: "Hot Shot Ultra Liquid Ant Bait, 0.45 fl oz Bait Stations", brand: "Hot Shot", category: "HG", retailer: "r3", rank: 5, price: 13.94, avgSellingPrice: 13.95, rating: 4.4, reviews: 40, content: 62, stockBias: 1.0, buyBoxRate: 0.0, priceChangePct: 16.8, priceGroup: "r3::HG" },
  { id: "r3-16561279", name: "Repel Insect Repellent Sportsmen Max Formula Spray Pump 40% DEET, 6 Fluid Ounce", brand: "Repel", category: "HG", retailer: "r3", rank: 6, price: 5.51, avgSellingPrice: 5.58, rating: 4.3, reviews: 35, content: 53, stockBias: 0.83, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "r3::HG" },
  { id: "r3-15056078", name: "Hot Shot Ultra Clear Roach and Ant Gel Bait, Insect Killer, 2.5 Ounce", brand: "Hot Shot", category: "HG", retailer: "r3", rank: 7, price: 7.97, avgSellingPrice: 8.4, rating: 3.4, reviews: 27, content: 68, stockBias: 0.83, buyBoxRate: 1.0, priceChangePct: -8.8, priceGroup: "r3::HG" },
  { id: "r3-15136591", name: "Unscented Cutter Insect Repellent, Aerosol Spray, 6-Ounce", brand: "United Industries", category: "HG", retailer: "r3", rank: 8, price: 8.13, avgSellingPrice: 8.17, rating: 4.7, reviews: 26, content: 68, stockBias: 0.93, buyBoxRate: 0.0, priceChangePct: 0.0, priceGroup: "r3::HG" },
  { id: "r3-12166875", name: "Cutter Bite MD Insect Bite Relief Stick, 0.5-Fluid Ounces", brand: "Cutter", category: "HG", retailer: "r3", rank: 9, price: 8.54, avgSellingPrice: 8.52, rating: 4.8, reviews: 13, content: 68, stockBias: 1.0, buyBoxRate: 0.0, priceChangePct: -2.7, priceGroup: "r3::HG" },
  { id: "r3-16561276", name: "Repel 100 Insect Repellent, Pen-Size Pump Spray, 0.475-fl oz", brand: "Repel", category: "HG", retailer: "r3", rank: 10, price: 20.7, avgSellingPrice: 9.53, rating: 5, reviews: 1, content: 64, stockBias: 0.27, buyBoxRate: 0.73, priceChangePct: 257.5, priceGroup: "r3::HG" },
  { id: "r3-2684038", name: "BLACK+DECKER 3-in-1 Waffle Maker & Indoor Grill/Griddle, Stainless Steel, G48TD", brand: "BLACK+DECKER", category: "HPC", retailer: "r3", rank: 1, price: 88.99, avgSellingPrice: 88.28, rating: 3.9, reviews: 864, content: 59, stockBias: 1.0, buyBoxRate: 0.0, priceChangePct: -10.1, priceGroup: "r3::HPC" },
  { id: "r3-6528826", name: "BLACK+DECKER Classic Iron with Aluminum Soleplate, Silver, F67E", brand: "BLACK+DECKER", category: "HPC", retailer: "r3", rank: 2, price: 30.06, avgSellingPrice: 30.06, rating: 4.4, reviews: 777, content: 53, stockBias: 0.83, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "r3::HPC" },
  { id: "r3-10575935", name: "Remington Travel Size Professional 1.25\" Compact Ceramic Hot Hair Rollers, 10 Piece Set, Anti-Static Technology, Ionic, Black", brand: "Remington", category: "HPC", retailer: "r3", rank: 3, price: 14.97, avgSellingPrice: 15.13, rating: 4, reviews: 698, content: 59, stockBias: 0.83, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "r3::HPC" },
  { id: "r3-10533967", name: "Remington Face Saver Pre-Shave Powder Stick, Prevent Shave Irritation", brand: "Remington", category: "HPC", retailer: "r3", rank: 4, price: 5.99, avgSellingPrice: 5.99, rating: 4.6, reviews: 426, content: 59, stockBias: 0.0, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "r3::HPC" },
  { id: "r3-11186328", name: "BLACK+DECKER SpaceMaker Under-Counter Toaster Oven, Black/Silver, TROS1000D", brand: "BLACK+DECKER", category: "HPC", retailer: "r3", rank: 5, price: 119.99, avgSellingPrice: 119.99, rating: 3.9, reviews: 300, content: 59, stockBias: 0.0, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "r3::HPC" },
  { id: "r3-13724331", name: "BLACK+DECKER 2-Slice Extra Wide Slot Toaster, Black", brand: "BLACK+DECKER", category: "HPC", retailer: "r3", rank: 6, price: 23.26, avgSellingPrice: 23.24, rating: 4.4, reviews: 292, content: 59, stockBias: 0.83, buyBoxRate: 1.0, priceChangePct: 0.2, priceGroup: "r3::HPC" },
  { id: "r3-10574351", name: "BLACK+DECKER Black 12 Cup Drip Coffee Maker", brand: "BLACK+DECKER", category: "HPC", retailer: "r3", rank: 7, price: 49.43, avgSellingPrice: 49.35, rating: 3.2, reviews: 233, content: 59, stockBias: 0.97, buyBoxRate: 0.0, priceChangePct: 0.0, priceGroup: "r3::HPC" },
  { id: "r3-14320976", name: "BLACK+DECKER SpaceMaker Multi-Purpose Can Opener, Black, CO100B", brand: "BLACK+DECKER", category: "HPC", retailer: "r3", rank: 8, price: 60.74, avgSellingPrice: 114.55, rating: 3.7, reviews: 179, content: 59, stockBias: 0.13, buyBoxRate: 0.87, priceChangePct: -88.7, priceGroup: "r3::HPC" },
  { id: "r3-14320955", name: "BLACK+DECKER SmartGrind Coffee Grinder with Stainless Steel Blades, Stainless Steel, CBG100S", brand: "BLACK+DECKER", category: "HPC", retailer: "r3", rank: 9, price: 49.99, avgSellingPrice: 27.99, rating: 3.8, reviews: 173, content: 59, stockBias: 0.27, buyBoxRate: 0.73, priceChangePct: 150.1, priceGroup: "r3::HPC" },
  { id: "r3-6561226", name: "Black & Decker BD 5c Coffee Maker GlsCrf Wht", brand: "BLACK+DECKER", category: "HPC", retailer: "r3", rank: 10, price: 19.99, avgSellingPrice: 19.99, rating: 3.3, reviews: 127, content: 54, stockBias: 0.0, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "r3::HPC" },
  { id: "r4-100034451", name: "Triazicide 32 fl. oz. Concentrate Lawn Insect Killer", brand: "Spectracide", category: "HG", retailer: "r4", rank: 1, price: 8.97, avgSellingPrice: 8.97, rating: 4, reviews: 1440, content: 77, stockBias: 0.0, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "r4::HG" },
  { id: "r4-100023081", name: "10 lbs. Triazicide Lawn Insect Killer Granules", brand: "Spectracide", category: "HG", retailer: "r4", rank: 2, price: 7.97, avgSellingPrice: 7.97, rating: 4.1, reviews: 1403, content: 76, stockBias: 1.0, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "r4::HG" },
  { id: "r4-100004739", name: "2.29 oz. No-Pest Insect Strip", brand: "Hot Shot", category: "HG", retailer: "r4", rank: 3, price: 6.97, avgSellingPrice: 6.97, rating: 4.4, reviews: 814, content: 55, stockBias: 1.0, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "r4::HG" },
  { id: "r4-100012648", name: "Bag-A-Bug Japanese Beetle Trap", brand: "Spectracide", category: "HG", retailer: "r4", rank: 4, price: 6.86, avgSellingPrice: 6.62, rating: 4.4, reviews: 747, content: 59, stockBias: 1.0, buyBoxRate: 1.0, priceChangePct: 32.7, priceGroup: "r4::HG" },
  { id: "r4-100062166", name: "Terminate 16 oz. Termite Killing Foam", brand: "Spectracide", category: "HG", retailer: "r4", rank: 5, price: 8.97, avgSellingPrice: 8.74, rating: 4.2, reviews: 628, content: 66, stockBias: 1.0, buyBoxRate: 1.0, priceChangePct: 5.8, priceGroup: "r4::HG" },
  { id: "r4-100052940", name: "Bag-A-Bug Kwik Stand for Japanese Beetle Trap", brand: "Spectracide", category: "HG", retailer: "r4", rank: 6, price: 5.27, avgSellingPrice: 5.27, rating: 3.5, reviews: 105, content: 56, stockBias: 0.0, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "r4::HG" },
  { id: "r4-100056149", name: "Bag-A-Bug Japanese Beetle Trap Replacement Lure Refill (1-Count)", brand: "Spectracide", category: "HG", retailer: "r4", rank: 7, price: 5.86, avgSellingPrice: 5.86, rating: 4.4, reviews: 74, content: 65, stockBias: 0.0, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "r4::HG" },
  { id: "r4-100008212", name: "Bag-A-Bug Japanese Beetle Trap2 Replacement Bags (6-Count)", brand: "Spectracide", category: "HG", retailer: "r4", rank: 8, price: 3.78, avgSellingPrice: 3.78, rating: 4.7, reviews: 61, content: 56, stockBias: 0.0, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "r4::HG" },
  { id: "r4-100046531", name: "1.3 gal. Termite and Carpenter Ant Killer Ready-to-Use EzSpray", brand: "Spectracide", category: "HG", retailer: "r4", rank: 9, price: 24.97, avgSellingPrice: 24.05, rating: 3.4, reviews: 31, content: 56, stockBias: 1.0, buyBoxRate: 1.0, priceChangePct: 8.6, priceGroup: "r4::HG" },
  { id: "r4-100117730", name: "15 oz. Flying Insect Killer Aerosol Spray Clean Fresh Scent", brand: "Hot Shot", category: "HG", retailer: "r4", rank: 10, price: 4.47, avgSellingPrice: 4.47, rating: 2.8, reviews: 17, content: 52, stockBias: 0.9, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "r4::HG" },
  { id: "r5-48922", name: "FURminator\u00c2\u00ae Short Hair Undercoat deShedding Dog Tool | Dog brushes combs & blowdryers | PetSmart", brand: "FURminator", category: "GPC", retailer: "r5", rank: 1, price: 28.28, avgSellingPrice: 32.91, rating: 4.68, reviews: 188, content: 56, stockBias: 1.0, buyBoxRate: 1.0, priceChangePct: -21.4, priceGroup: "r5::GPC" },
  { id: "r5-1031024", name: "Tetra\u00c2\u00ae TetraMin Tropical Flakes Fish Food | Fish food | PetSmart", brand: "Tetra", category: "GPC", retailer: "r5", rank: 2, price: 8.99, avgSellingPrice: 8.99, rating: 4.77, reviews: 106, content: 69, stockBias: 1.0, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "r5::GPC" },
  { id: "r5-48923", name: "FURminator\u00c2\u00ae Long Hair Undercoat deShedding Dog Tool | Dog brushes combs & blowdryers | PetSmart", brand: "FURminator", category: "GPC", retailer: "r5", rank: 3, price: 28.28, avgSellingPrice: 32.39, rating: 4.57, reviews: 91, content: 56, stockBias: 1.0, buyBoxRate: 1.0, priceChangePct: -21.4, priceGroup: "r5::GPC" },
  { id: "r5-22522", name: "FURminator\u00c2\u00ae deShedding Ultra Premium Dog Shampoo | Dog shampoos & conditioners | PetSmart", brand: "FURminator", category: "GPC", retailer: "r5", rank: 4, price: 12.99, avgSellingPrice: 12.99, rating: 4.6, reviews: 68, content: 59, stockBias: 1.0, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "r5::GPC" },
  { id: "r5-49430", name: "FURminator\u00c2\u00ae Short Hair Undercoat deShedding Cat Tool | Cat brushes combs & blowdryers | PetSmart", brand: "FURminator", category: "GPC", retailer: "r5", rank: 5, price: 33.99, avgSellingPrice: 33.99, rating: 4.84, reviews: 50, content: 62, stockBias: 1.0, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "r5::GPC" },
  { id: "r5-1031219", name: "Tetra\u00c2\u00ae TetraFin Goldfish Flakes | Fish food | PetSmart", brand: "Tetra", category: "GPC", retailer: "r5", rank: 6, price: 7.39, avgSellingPrice: 7.39, rating: 4.32, reviews: 41, content: 60, stockBias: 1.0, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "r5::GPC" },
  { id: "r5-49429", name: "FURminator\u00c2\u00ae Long Hair Undercoat deShedding Cat Tool | Cat brushes combs & blowdryers | PetSmart", brand: "FURminator", category: "GPC", retailer: "r5", rank: 7, price: 33.99, avgSellingPrice: 33.99, rating: 4.71, reviews: 34, content: 62, stockBias: 1.0, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "r5::GPC" },
  { id: "r5-22523", name: "FURminator\u00c2\u00ae deShedding Ultra Premium Dog Conditioner | Dog shampoos & conditioners | PetSmart", brand: "FURminator", category: "GPC", retailer: "r5", rank: 8, price: 12.99, avgSellingPrice: 12.99, rating: 4.77, reviews: 26, content: 57, stockBias: 1.0, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "r5::GPC" },
  { id: "r5-1031232", name: "Tetra\u00c2\u00ae TetraPond Goldfish and Koi Pond Sticks | Fish pond care | PetSmart", brand: "Tetra", category: "GPC", retailer: "r5", rank: 9, price: 4.39, avgSellingPrice: 4.39, rating: 4.72, reviews: 18, content: 65, stockBias: 1.0, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "r5::GPC" },
  { id: "r5-22524", name: "FURminator\u00c2\u00ae deShedding Dog Spray | Dog wipes & deodorizers | PetSmart", brand: "FURminator", category: "GPC", retailer: "r5", rank: 10, price: 7.59, avgSellingPrice: 7.59, rating: 4.5, reviews: 4, content: 59, stockBias: 1.0, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "r5::GPC" },
  { id: "r6-1000207877", name: "Nature's Miracle 32-oz Cat and Dog Stain and Odor Remover Trigger Spray Bottle", brand: "Nature's Miracle", category: "GPC", retailer: "r6", rank: 1, price: 12.68, avgSellingPrice: 12.69, rating: 4, reviews: 53, content: 53, stockBias: 0.1, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "r6::GPC" },
  { id: "r6-1000735634", name: "Tetra 1 lb Pond Fish Food Sticks", brand: "Tetra", category: "GPC", retailer: "r6", rank: 2, price: 14.48, avgSellingPrice: 14.48, rating: 4.5, reviews: 30, content: 60, stockBias: 0.03, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "r6::GPC" },
  { id: "r6-1000735640", name: "Tetra Koi Vibrance 1.43 lbs Pond Fish Food Sticks", brand: "Tetra", category: "GPC", retailer: "r6", rank: 3, price: 18.48, avgSellingPrice: 18.48, rating: 4.5, reviews: 29, content: 68, stockBias: 0.0, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "r6::GPC" },
  { id: "r6-5002106395", name: "Tetra Koi Vibrance 16.5 pounds Pond Fish Food Sticks", brand: "Tetra", category: "GPC", retailer: "r6", rank: 4, price: 91.98, avgSellingPrice: 91.98, rating: 5, reviews: 26, content: 59, stockBias: 0.0, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "r6::GPC" },
  { id: "r6-5001959349", name: "Tetra Sticks 11 pounds Pond Fish Food Sticks", brand: "Tetra", category: "GPC", retailer: "r6", rank: 5, price: 62.48, avgSellingPrice: 62.41, rating: 5, reviews: 19, content: 66, stockBias: 0.0, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "r6::GPC" },
  { id: "r6-5001633443", name: "Nature's Miracle Stain Remover", brand: "Nature's Miracle", category: "GPC", retailer: "r6", rank: 6, price: 25.48, avgSellingPrice: 25.48, rating: 4.5, reviews: 18, content: 53, stockBias: 0.07, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "r6::GPC" },
  { id: "r6-1000387581", name: "Nature's Miracle Stain Remover", brand: "Nature's Miracle", category: "GPC", retailer: "r6", rank: 7, price: 8.47, avgSellingPrice: 8.47, rating: 0, reviews: 0, content: 53, stockBias: 0.0, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "r6::GPC" },
  { id: "r6-3030370", name: "Ultra-Kill Wasp and Hornet 17-oz Insect Killer Aerosol", brand: "Ultra-Kill", category: "HG", retailer: "r6", rank: 1, price: 2.78, avgSellingPrice: 2.78, rating: 3, reviews: 444, content: 68, stockBias: 0.1, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "r6::HG" },
  { id: "r6-3103667", name: "Spectracide Weed Stop For Lawns Granules 10-lb Weed and Grass Killer", brand: "Spectracide", category: "HG", retailer: "r6", rank: 2, price: 14.28, avgSellingPrice: 14.28, rating: 3.5, reviews: 346, content: 72, stockBias: 0.1, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "r6::HG" },
  { id: "r6-3120407", name: "Spectracide Bag-A-Bug Japanese Beetle Trap Outdoor Beetle Repellent", brand: "Spectracide", category: "HG", retailer: "r6", rank: 3, price: 5.98, avgSellingPrice: 5.98, rating: 4.5, reviews: 322, content: 71, stockBias: 0.0, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "r6::HG" },
  { id: "r6-1255457", name: "Garden Safe Multi-Purpose Garden Insect Killer 24-fl oz Garden Insect Killer Trigger Spray", brand: "Garden Safe", category: "HG", retailer: "r6", rank: 4, price: 5.98, avgSellingPrice: 5.98, rating: 4.5, reviews: 176, content: 61, stockBias: 0.0, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "r6::HG" },
  { id: "r6-3031685", name: "Spectracide Terminate Termite Killing Foam 16-oz Termite Killer Aerosol", brand: "Spectracide", category: "HG", retailer: "r6", rank: 5, price: 8.78, avgSellingPrice: 8.78, rating: 4.5, reviews: 147, content: 72, stockBias: 0.0, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "r6::HG" },
  { id: "r6-3033932", name: "Hot Shot MaxAttrax 4-Count Ant Bait Station (4-Pack)", brand: "Hot Shot", category: "HG", retailer: "r6", rank: 6, price: 2.28, avgSellingPrice: 2.28, rating: 3.5, reviews: 95, content: 72, stockBias: 0.03, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "r6::HG" },
  { id: "r6-3120411", name: "Spectracide Bag-A-Bug Kwik Stand for Japanese Beetle Traps Outdoor Beetle Repellent", brand: "Spectracide", category: "HG", retailer: "r6", rank: 7, price: 5.28, avgSellingPrice: 5.28, rating: 4, reviews: 69, content: 67, stockBias: 0.0, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "r6::HG" },
  { id: "r6-3047623", name: "Spectracide Bag-A-Bug Japanese Beetle Replacement Lure Outdoor Beetle Repellent", brand: "Spectracide", category: "HG", retailer: "r6", rank: 8, price: 4.98, avgSellingPrice: 4.98, rating: 4.5, reviews: 68, content: 68, stockBias: 0.0, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "r6::HG" },
  { id: "r6-1010093", name: "Cutter Backyard Mosquito and Bug Control 16-oz Fogger", brand: "Cutter", category: "HG", retailer: "r6", rank: 9, price: 6.98, avgSellingPrice: 6.98, rating: 4.1, reviews: 37, content: 37, stockBias: 0.0, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "r6::HG" },
  { id: "r6-1165507", name: "interDesign\u00c3\u201a\u00c2\u00ae Clear Sinkworks Euro Sink Saddle", brand: "interDesign\u00c2\u00ae", category: "HG", retailer: "r6", rank: 10, price: 6.37, avgSellingPrice: 6.37, rating: 0, reviews: 0, content: 35, stockBias: 0.0, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "r6::HG" },
  { id: "r7-77763", name: "Instant Ocean Marine Fast Dissolving Sea Salt, 3 lbs.", brand: "Instant Ocean", category: "GPC", retailer: "r7", rank: 1, price: 6.58, avgSellingPrice: 7.41, rating: 4.8, reviews: 665, content: 52, stockBias: 1.0, buyBoxRate: 1.0, priceChangePct: 10.0, priceGroup: "r7::GPC" },
  { id: "r7-77780", name: "Instant Ocean Marine Fast Dissolving Sea Salt, 3 lbs.", brand: "Instant Ocean", category: "GPC", retailer: "r7", rank: 2, price: 12.99, avgSellingPrice: 12.99, rating: 4.8, reviews: 665, content: 52, stockBias: 1.0, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "r7::GPC" },
  { id: "r7-31933", name: "TetraPond Floating Koi Sticks, 3.31 lbs.", brand: "Tetra", category: "GPC", retailer: "r7", rank: 3, price: 5.36, avgSellingPrice: 5.36, rating: 4.8, reviews: 173, content: 61, stockBias: 1.0, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "r7::GPC" },
  { id: "r7-39918", name: "Tetra Blood Worms Freeze Dried Treat", brand: "Tetra", category: "GPC", retailer: "r7", rank: 4, price: 5.99, avgSellingPrice: 5.99, rating: 4.6, reviews: 93, content: 44, stockBias: 0.0, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "r7::GPC" },
  { id: "r7-32840", name: "TetraPond Floating Pond Sticks", brand: "Tetra", category: "GPC", retailer: "r7", rank: 5, price: 10.99, avgSellingPrice: 10.99, rating: 4.9, reviews: 79, content: 53, stockBias: 0.0, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "r7::GPC" },
  { id: "r7-39942", name: "Tetra Baby Shrimp Sun Dried Treat", brand: "Tetra", category: "GPC", retailer: "r7", rank: 6, price: 2.38, avgSellingPrice: 2.38, rating: 4.3, reviews: 74, content: 44, stockBias: 1.0, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "r7::GPC" },
  { id: "r7-78387", name: "Tetra ColorBits Tropical Granules", brand: "Tetra", category: "GPC", retailer: "r7", rank: 7, price: 5.8, avgSellingPrice: 5.8, rating: 4.6, reviews: 74, content: 53, stockBias: 1.0, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "r7::GPC" },
  { id: "r7-16578", name: "TetraCichlid Food Sticks, 2.64 oz.", brand: "Tetra", category: "GPC", retailer: "r7", rank: 8, price: 7.78, avgSellingPrice: 7.78, rating: 4.6, reviews: 33, content: 56, stockBias: 1.0, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "r7::GPC" },
  { id: "r7-16586", name: "TetraCichlid Food Sticks, 2.64 oz.", brand: "Tetra", category: "GPC", retailer: "r7", rank: 9, price: 12.79, avgSellingPrice: 12.79, rating: 4.6, reviews: 33, content: 56, stockBias: 1.0, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "r7::GPC" },
  { id: "r7-78395", name: "TetraCichlid Cichlid Flakes", brand: "Tetra", category: "GPC", retailer: "r7", rank: 10, price: 7.18, avgSellingPrice: 7.18, rating: 4.7, reviews: 23, content: 50, stockBias: 0.0, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "r7::GPC" },
];

/* Illustrative only -- no first-class Competitor entity is resolvable from
   the raw crawl (the data audit's own finding: nothing in the three
   workbooks names "who competes with whom"). The real signal that DOES
   exist -- third-party marketplace sellers who win the buy box, see
   REAL_BUYBOX_COMPETITOR above -- turns out to be one-off arbitrage
   resellers, not persistent brands with their own price/rating/content, so
   it can't fill this shape either. Every UI surface using this array labels
   it illustrative rather than presenting it as a real competitive set. */
export const competitorBrands = [
  { id: "c1", name: "Corvus Group", share: 36.1, skus: 148, price: 7.2, rating: 4.28, content: 90 },
  { id: "c2", name: "Palisade Foods", share: 25.2, skus: 96, price: 6.1, rating: 4.41, content: 84 },
  { id: "c3", name: "Northwind Labs", share: 11.8, skus: 62, price: 9.4, rating: 4.05, content: 71 },
  { id: "c4", name: "Selby & Co", share: 8.4, skus: 44, price: 5.8, rating: 3.96, content: 66 },
];

/* Real keyword strings pulled directly from the Share Of Search tab's
   `keyword` column for our 7 retailers — search `volume` and `ownRank` are
   not in the source data (no traffic/volume field exists anywhere in the
   workbook) and remain illustrative. */
export const keywordSet = [
  { id: "k1", term: "1 cup coffee maker", volume: 0, ownRank: 0 }, // volume/ownRank illustrative -- no traffic data in source
  { id: "k2", term: "2 slice toaster", volume: 0, ownRank: 0 }, // volume/ownRank illustrative -- no traffic data in source
  { id: "k3", term: "Black And Decker Blender", volume: 0, ownRank: 0 }, // volume/ownRank illustrative -- no traffic data in source
  { id: "k4", term: "Deshedding Brush", volume: 0, ownRank: 0 }, // volume/ownRank illustrative -- no traffic data in source
  { id: "k5", term: "Dog Hair Remover", volume: 0, ownRank: 0 }, // volume/ownRank illustrative -- no traffic data in source
  { id: "k6", term: "air pump for fish tank", volume: 0, ownRank: 0 }, // volume/ownRank illustrative -- no traffic data in source
  { id: "k7", term: "chews", volume: 0, ownRank: 0 }, // volume/ownRank illustrative -- no traffic data in source
  { id: "k8", term: "door knockers", volume: 0, ownRank: 0 }, // volume/ownRank illustrative -- no traffic data in source
  { id: "k9", term: "good n fun dog treats", volume: 0, ownRank: 0 }, // volume/ownRank illustrative -- no traffic data in source
  { id: "k10", term: "odor remover", volume: 0, ownRank: 0 }, // volume/ownRank illustrative -- no traffic data in source
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

export const categories = ["GPC", "HPC", "HG"];

export const notificationFeed = [
  { id: "n1", severity: "high", title: "Stock alert", text: "Tetra Koi Vibrance Pond Fish Food Sticks out of stock all month at Lowe's", time: "12m ago", product: "r6-1000735640" },
  { id: "n2", severity: "high", title: "Price alert", text: "BLACK+DECKER SmartGrind Coffee Grinder jumped 150% at Walmart while availability dropped to 27%", time: "38m ago", product: "r3-14320955" },
  { id: "n3", severity: "medium", title: "Buy box alert", text: "Dingo Mini Bones has lost the buy box to a third-party reseller for 29 of the last 30 days on Walmart.com", time: "1h ago", product: "r3-8207932" },
  { id: "n4", severity: "medium", title: "Search alert", text: "Chewy returned zero ranked results for 40% of tracked keywords this period", time: "2h ago", product: "r2-40150" },
  { id: "n5", severity: "low", title: "Content opportunity", text: "111 products scored under 80 on content completeness across the portfolio", time: "5h ago", product: "r6-1165507" },
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

/* Derived from the real September crawl (see build_mock_data.py): sos = this
   retailer's average tracked-keyword result-coverage % (REAL_SOS_WEEKLY)
   minus the portfolio average; stock/rating/content = this retailer's
   5-week average vs. the 117-SKU portfolio average (REAL_ROLLUP_WEEKLY).
   Chewy's -31.0 sos reflects a genuine finding — the tracked keywords
   returned zero ranked results on Chewy 40% of the time this period,
   vs. 0% for Amazon/Walmart/PetSmart. */
const RETAILER_BIAS: Record<string, { sos: number; stock: number; rating: number; content: number }> = {
  all: { sos: 0, stock: 0, rating: 0, content: 0 },
  "r1": { sos: 9.0, stock: 5.3, rating: 0.02, content: 5.4 }, // Amazon.com
  "r2": { sos: -31.0, stock: 39.4, rating: -0.48, content: 1.1 }, // Chewy
  "r3": { sos: 9.0, stock: 3.7, rating: -0.02, content: -2.3 }, // Walmart
  "r4": { sos: 1.5, stock: -2.9, rating: -0.26, content: 0.6 }, // The Home Depot
  "r5": { sos: 9.0, stock: 39.4, rating: 0.39, content: -0.7 }, // PetSmart
  "r6": { sos: 4.0, stock: -58.4, rating: -0.02, content: -0.3 }, // Lowe's
  "r7": { sos: -1.0, stock: -7.9, rating: 0.41, content: -9.8 }, // Petco
};

const MONTHS = ["Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"];

function labelsFor(periodId: string) {
  const p = periods.find((x) => x.id === periodId) || periods[2];
  if (periodId === "4w") return REAL_WEEK_LABELS.slice(1); // real Sep 8/15/22/29 — genuinely real crawl dates
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

/* Real weekly time series (5 points: Sep 1/8/15/22/29, the actual Content
   Data crawl cadence) per product, bucketed from the real daily Price
   history (ISO-week aligned, per the data audit's own recommendation) and
   the real weekly Content snapshots. Used to draw genuinely real trend
   charts for the "Last 4 weeks" period; other periods still use synthetic
   jitter since September is the only month this crawl covers. */
export const REAL_WEEK_LABELS = ["Sep 1", "Sep 8", "Sep 15", "Sep 22", "Sep 29"];
export const REAL_SOS_WEEK_LABELS = ["Sep 8", "Sep 15", "Sep 22", "Sep 29"];
/* ISO dates behind the labels above, for the custom date-range filter.
   Content/Price-derived metrics (Availability, Price Index, Content
   Completeness, Buy Box, Rating) have a real weekly checkpoint going back to
   Sep 1; Share Of Search does not (its crawl starts Sep 8), so it gets its
   own, shorter date list. A date range matches each metric family against
   its own real window and pools across whichever checkpoints fall inside it
   -- see matchRangeWeeks() and realRangeValue() below. */
export const REAL_WEEK_DATES = ["2022-09-01", "2022-09-08", "2022-09-15", "2022-09-22", "2022-09-29"];
export const REAL_SOS_WEEK_DATES = ["2022-09-08", "2022-09-15", "2022-09-22", "2022-09-29"];

export const REAL_PRODUCT_WEEKLY: Record<string, {
  rating: number[]; reviews: number[]; price: number[]; stockRate: number[]; buyBoxRate: number[];
}> = {
  "r7-16578": { rating: [4.6, 4.6, 4.6, 4.6, 4.6], reviews: [32, 32, 33, 33, 33], price: [7.78, 7.78, 7.78, 7.78, 7.78], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r7-16586": { rating: [4.6, 4.6, 4.6, 4.6, 4.6], reviews: [32, 32, 33, 33, 33], price: [12.79, 12.79, 12.79, 12.79, 12.79], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r5-22522": { rating: [4.66, 4.66, 4.6, 4.6, 4.6], reviews: [67, 67, 68, 68, 68], price: [12.99, 12.99, 12.99, 12.99, 12.99], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r5-22523": { rating: [4.77, 4.77, 4.77, 4.77, 4.77], reviews: [26, 26, 26, 26, 26], price: [12.99, 12.99, 12.99, 12.99, 12.99], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r5-22524": { rating: [4.5, 4.5, 4.5, 4.5, 4.5], reviews: [4, 4, 4, 4, 4], price: [7.59, 7.59, 7.59, 7.59, 7.59], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r7-31933": { rating: [4.8, 4.8, 4.8, 4.8, 4.8], reviews: [172, 172, 173, 173, 173], price: [5.36, 5.36, 5.36, 5.36, 5.36], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r7-32840": { rating: [4.9, 4.9, 4.9, 4.9, 4.9], reviews: [79, 79, 79, 79, 79], price: [10.99, 10.99, 10.99, 10.99, 10.99], stockRate: [0.0, 0.0, 0.0, 0.0, 0.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r7-39918": { rating: [4.6, 4.6, 4.6, 4.6, 4.6], reviews: [93, 93, 93, 93, 93], price: [5.99, 5.99, 5.99, 5.99, 5.99], stockRate: [0.0, 0.0, 0.0, 0.0, 0.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r7-39942": { rating: [4.3, 4.3, 4.3, 4.3, 4.3], reviews: [74, 74, 74, 74, 74], price: [2.38, 2.38, 2.38, 2.38, 2.38], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r2-40150": { rating: [3.5142, 3.5142, 3.5102, 3.5102, 3.5102], reviews: [634, 634, 635, 635, 635], price: [24.99, 24.99, 24.99, 24.99, 24.99], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r2-40181": { rating: [3.5142, 3.5142, 3.5102, 3.5102, 3.5102], reviews: [634, 634, 635, 635, 635], price: [24.99, 24.99, 24.99, 24.99, 24.99], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r2-40272": { rating: [3.568, 3.568, 3.568, 3.568, 3.568], reviews: [125, 125, 125, 125, 125], price: [8.47, 8.47, 8.47, 8.47, 8.47], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r2-40274": { rating: [4.4096, 4.4096, 4.4096, 4.4096, 4.4096], reviews: [83, 83, 83, 83, 83], price: [9.19, 9.19, 9.19, 9.19, 9.19], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r2-40276": { rating: [4.1785, 4.1785, 4.1785, 4.1785, 4.1785], reviews: [325, 325, 325, 325, 325], price: [11, 11, 11, 11, 11], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r2-40278": { rating: [3.9245, 3.9245, 3.9245, 3.9245, 3.9245], reviews: [53, 53, 53, 53, 53], price: [13.15, 11, 13.15, 13.15, 13.15], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r2-40281": { rating: [4.1509, 4.1509, 4.1509, 4.1509, 4.1509], reviews: [391, 391, 391, 391, 391], price: [8.19, 8.19, 8.19, 8.19, 8.19], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r2-40348": { rating: [4.4, 4.4084, 4.4084, 4.4084, 4.4084], reviews: [70, 71, 71, 71, 71], price: [7.55, 7.55, 7.55, 6.04, 7.55], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r2-42091": { rating: [4.247, 4.247, 4.247, 4.247, 4.247], reviews: [251, 251, 251, 251, 251], price: [37.99, 31.65, 31.65, 31.65, 31.65], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r2-42138": { rating: [1.9155, 1.9155, 1.9155, 1.9155, 1.9155], reviews: [142, 142, 142, 142, 142], price: [8.49, 8.49, 7.01, 7.01, 7.01], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r5-48922": { rating: [4.69, 4.69, 4.68, 4.68, 4.68], reviews: [183, 183, 184, 188, 188], price: [35.99, 35.99, 28.28, 28.28, 28.28], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r5-48923": { rating: [4.56, 4.56, 4.56, 4.57, 4.57], reviews: [88, 88, 89, 90, 91], price: [35.99, 35.99, 28.28, 28.28, 28.28], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r5-49429": { rating: [4.71, 4.71, 4.71, 4.71, 4.71], reviews: [34, 34, 34, 34, 34], price: [33.99, 33.99, 33.99, 33.99, 33.99], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r5-49430": { rating: [4.84, 4.84, 4.84, 4.84, 4.84], reviews: [49, 49, 49, 50, 50], price: [33.99, 33.99, 33.99, 33.99, 33.99], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r7-77763": { rating: [4.8, 4.8, 4.8, 4.8, 4.8], reviews: [663, 663, 663, 664, 665], price: [6.58, 12.99, 5.8, 12.99, 5.8], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r7-77780": { rating: [4.8, 4.8, 4.8, 4.8, 4.8], reviews: [663, 663, 663, 664, 665], price: [12.99, 12.99, 12.99, 12.99, 12.99], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r7-78387": { rating: [4.6, 4.6, 4.6, 4.6, 4.6], reviews: [74, 74, 74, 74, 74], price: [5.8, 5.8, 5.8, 5.8, 5.8], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r7-78395": { rating: [4.7, 4.7, 4.7, 4.7, 4.7], reviews: [23, 23, 23, 23, 23], price: [7.18, 7.18, 7.18, 7.18, 7.18], stockRate: [0.0, 0.0, 0.0, 0.0, 0.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r6-1010093": { rating: [4, 4.1, 4.1, 4.1, 4.1], reviews: [36, 37, 37, 37, 37], price: [6.98, 6.98, 6.98, 6.98, 6.98], stockRate: [0.0, 0.0, 0.0, 0.0, 0.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r5-1031024": { rating: [4.76, 4.77, 4.77, 4.77, 4.77], reviews: [102, 105, 105, 105, 106], price: [8.99, 8.99, 8.99, 8.99, 8.99], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r5-1031219": { rating: [4.32, 4.32, 4.32, 4.32, 4.32], reviews: [41, 41, 41, 41, 41], price: [7.39, 7.39, 7.39, 7.39, 7.39], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r5-1031232": { rating: [4.72, 4.72, 4.72, 4.72, 4.72], reviews: [18, 18, 18, 18, 18], price: [4.39, 4.39, 4.39, 4.39, 4.39], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r6-1165507": { rating: [0, 0, 0, 0, 0], reviews: [0, 0, 0, 0, 0], price: [6.37, 6.37, 6.37, 6.37, 6.37], stockRate: [0.0, 0.0, 0.0, 0.0, 0.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r6-1255457": { rating: [4.5, 4.5, 4.5, 4.5, 4.5], reviews: [176, 176, 176, 176, 176], price: [5.98, 5.98, 5.98, 5.98, 5.98], stockRate: [0.0, 0.0, 0.0, 0.0, 0.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r3-2684038": { rating: [3.9, 3.9, 3.9, 3.9, 3.9], reviews: [864, 864, 864, 864, 864], price: [99, 83.35, 79.99, 90, 88.99], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [0, 0, 0, 0, 0] },
  "r3-2684063": { rating: [4.3, 4.3, 4.3, 4.3, 4.3], reviews: [458, 459, 459, 459, 459], price: [84.4, 84.27, 69.67, 69.67, 69.67], stockRate: [0.0, 0.0, 14.3, 14.3, 0.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r6-3030370": { rating: [3, 3, 3, 3, 3], reviews: [421, 423, 430, 440, 444], price: [2.78, 2.78, 2.78, 2.78, 2.78], stockRate: [0.0, 0.0, 42.9, 0.0, 0.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r6-3031685": { rating: [4.5, 4.5, 4.5, 4.5, 4.5], reviews: [146, 147, 147, 147, 147], price: [8.78, 8.78, 8.78, 8.78, 8.78], stockRate: [0.0, 0.0, 0.0, 0.0, 0.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r6-3033932": { rating: [3.5, 3.5, 3.5, 3.5, 3.5], reviews: [92, 93, 93, 93, 95], price: [2.28, 2.28, 2.28, 2.28, 2.28], stockRate: [0.0, 0.0, 14.3, 0.0, 0.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r6-3047623": { rating: [4.5, 4.5, 4.5, 4.5, 4.5], reviews: [68, 68, 68, 68, 68], price: [4.98, 4.98, 4.98, 4.98, 4.98], stockRate: [0.0, 0.0, 0.0, 0.0, 0.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r6-3103667": { rating: [3.5, 3.5, 3.5, 3.5, 3.5], reviews: [340, 343, 343, 344, 346], price: [14.28, 14.28, 14.28, 14.28, 14.28], stockRate: [0.0, 0.0, 42.9, 0.0, 0.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r6-3120407": { rating: [4.5, 4.5, 4.5, 4.5, 4.5], reviews: [321, 321, 322, 322, 322], price: [5.98, 5.98, 5.98, 5.98, 5.98], stockRate: [0.0, 0.0, 0.0, 0.0, 0.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r6-3120411": { rating: [4, 4, 4, 4, 4], reviews: [69, 69, 69, 69, 69], price: [5.28, 5.28, 5.28, 5.28, 5.28], stockRate: [0.0, 0.0, 0.0, 0.0, 0.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r3-3391780": { rating: [4.6, 4.6, 4.6, 4.6, 4.6], reviews: [777, 777, 777, 777, 777], price: [24.88, 39.99, 36.28, 36.69, 36.69], stockRate: [0.0, 0.0, 0.0, 0.0, 0.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r3-3391782": { rating: [4.6, 4.6, 4.6, 4.6, 4.6], reviews: [777, 777, 777, 777, 777], price: [101.07, 101.07, 101.07, 101.07, 101.07], stockRate: [0.0, 0.0, 0.0, 0.0, 0.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r3-3391783": { rating: [4.6, 4.6, 4.6, 4.6, 4.6], reviews: [777, 777, 777, 777, 777], price: [48.72, 48.72, 48.72, 48.72, 48.72], stockRate: [0.0, 0.0, 0.0, 0.0, 0.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r3-4252994": { rating: [3.7, 3.7, 3.7, 3.7, 3.7], reviews: [28, 28, 28, 28, 28], price: [4.32, 4.32, 4.32, 4.32, 4.32], stockRate: [100.0, 100.0, 28.6, 100.0, 100.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r3-6528826": { rating: [4.3, 4.3, 4.4, 4.4, 4.4], reviews: [775, 776, 777, 777, 777], price: [30.06, 30.06, 30.06, 30.06, 30.06], stockRate: [100.0, 100.0, 28.6, 100.0, 100.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r3-6561226": { rating: [3.3, 3.3, 3.3, 3.3, 3.3], reviews: [127, 127, 127, 127, 127], price: [19.99, 19.99, 19.99, 19.99, 19.99], stockRate: [0.0, 0.0, 0.0, 0.0, 0.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r3-8207932": { rating: [4.9, 4.9, 4.9, 4.9, 4.9], reviews: [207, 207, 207, 207, 207], price: [7.33, 7.34, 7.47, 7.47, 7.47], stockRate: [100.0, 100.0, 85.7, 100.0, 100.0], buyBoxRate: [0, 0, 14, 0, 0] },
  "r3-10291577": { rating: [4.7, 4.7, 4.7, 4.7, 4.7], reviews: [433, 433, 433, 433, 433], price: [13.97, 13.97, 13.97, 13.97, 13.97], stockRate: [100.0, 100.0, 42.9, 100.0, 100.0], buyBoxRate: [100, 100, 86, 100, 100] },
  "r3-10291760": { rating: [4.8, 4.8, 4.8, 4.8, 4.8], reviews: [68, 68, 68, 69, 69], price: [13.74, 13.74, 13.74, 13.74, 13.74], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [100, 100, 14, 86, 100] },
  "r3-10291762": { rating: [3.5, 3.5, 3.5, 3.5, 3.5], reviews: [66, 66, 66, 66, 66], price: [52, 52, 52, 52, 52], stockRate: [100.0, 100.0, 28.6, 100.0, 100.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r3-10291763": { rating: [4.3, 4.3, 4.3, 4.3, 4.3], reviews: [110, 110, 110, 110, 110], price: [24, 24, 24, 24, 24], stockRate: [100.0, 100.0, 85.7, 57.1, 100.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r3-10533967": { rating: [4.6, 4.6, 4.6, 4.6, 4.6], reviews: [426, 426, 426, 426, 426], price: [5.99, 5.99, 5.99, 5.99, 5.99], stockRate: [0.0, 0.0, 0.0, 0.0, 0.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r3-10574351": { rating: [3.2, 3.2, 3.2, 3.2, 3.2], reviews: [233, 233, 233, 233, 233], price: [53.74, 48.34, 48.34, 49.43, 49.43], stockRate: [100.0, 100.0, 100.0, 85.7, 100.0], buyBoxRate: [0, 0, 0, 0, 0] },
  "r3-10575935": { rating: [4, 4, 4, 4, 4], reviews: [696, 696, 697, 697, 698], price: [16.19, 14.97, 14.97, 14.97, 14.97], stockRate: [100.0, 100.0, 28.6, 100.0, 100.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r3-11186328": { rating: [3.9, 3.9, 3.9, 3.9, 3.9], reviews: [300, 300, 300, 300, 300], price: [119.99, 119.99, 119.99, 119.99, 119.99], stockRate: [0.0, 0.0, 0.0, 0.0, 0.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r3-12166874": { rating: [4.3, 4.3, 4.3, 4.3, 4.3], reviews: [107, 107, 107, 107, 107], price: [8.49, 9.1, 9.3, 11.35, 11.13], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [0, 0, 0, 0, 0] },
  "r3-12166875": { rating: [4.8, 4.8, 4.8, 4.8, 4.8], reviews: [13, 13, 13, 13, 13], price: [8.78, 8.21, 8.56, 8.54, 8.54], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [0, 0, 0, 0, 0] },
  "r3-12444070": { rating: [4.3, 4.3, 4.3, 4.3, 4.3], reviews: [97, 97, 97, 98, 98], price: [4.18, 3.97, 4.18, 4.18, 4.18], stockRate: [100.0, 100.0, 28.6, 100.0, 100.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r3-12444073": { rating: [4.4, 4.4, 4.4, 4.4, 4.4], reviews: [40, 40, 40, 40, 40], price: [14.16, 13.94, 14.16, 14.16, 13.94], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [0, 0, 0, 0, 0] },
  "r3-13724331": { rating: [4.4, 4.4, 4.4, 4.4, 4.4], reviews: [287, 287, 288, 290, 292], price: [23.26, 23.26, 23.26, 23.26, 23.26], stockRate: [100.0, 100.0, 28.6, 100.0, 100.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r3-14320955": { rating: [3.8, 3.8, 3.8, 3.8, 3.8], reviews: [173, 173, 173, 173, 173], price: [19.99, 19.99, 19.99, 49.99, 49.99], stockRate: [0.0, 0.0, 0.0, 85.7, 100.0], buyBoxRate: [100, 100, 100, 14, 0] },
  "r3-14320976": { rating: [3.7, 3.7, 3.7, 3.7, 3.7], reviews: [179, 179, 179, 179, 179], price: [48.3, 48.26, 48.26, 60.74, 60.74], stockRate: [57.1, 0.0, 0.0, 0.0, 0.0], buyBoxRate: [43, 100, 100, 100, 100] },
  "r3-15056078": { rating: [3.4, 3.4, 3.4, 3.4, 3.4], reviews: [27, 27, 27, 27, 27], price: [8.7, 7.97, 7.97, 8.37, 7.97], stockRate: [100.0, 100.0, 28.6, 100.0, 100.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r3-15136591": { rating: [4.7, 4.7, 4.7, 4.7, 4.7], reviews: [26, 26, 26, 26, 26], price: [8.78, 8.13, 8.13, 8.13, 8.13], stockRate: [71.4, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [0, 0, 0, 0, 0] },
  "r3-15136592": { rating: [4.2, 4.2, 4.2, 4.2, 4.2], reviews: [66, 66, 66, 66, 66], price: [6.48, 6.45, 6.41, 6.36, 6.34], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [0, 0, 0, 0, 0] },
  "r3-16561273": { rating: [4.7, 4.7, 4.7, 4.7, 4.7], reviews: [46, 46, 46, 46, 46], price: [2.97, 2.97, 2.97, 2.97, 2.97], stockRate: [100.0, 100.0, 28.6, 100.0, 100.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r3-16561276": { rating: [5, 5, 5, 5, 5], reviews: [1, 1, 1, 1, 1], price: [5.79, 5.79, 5.79, 20.7, 20.7], stockRate: [28.6, 14.3, 0.0, 42.9, 100.0], buyBoxRate: [71, 86, 100, 57, 0] },
  "r3-16561279": { rating: [4.3, 4.3, 4.3, 4.3, 4.3], reviews: [35, 35, 35, 35, 35], price: [5.51, 5.51, 5.51, 5.51, 5.51], stockRate: [100.0, 100.0, 28.6, 100.0, 100.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r4-100004739": { rating: [4.4, 4.4, 4.4, 4.4, 4.4], reviews: [799, 799, 802, 811, 814], price: [6.97, 6.97, 6.97, 6.97, 6.97], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r4-100008212": { rating: [4.7, 4.7, 4.7, 4.7, 4.7], reviews: [61, 61, 61, 61, 61], price: [3.78, 3.78, 3.78, 3.78, 3.78], stockRate: [0.0, 0.0, 0.0, 0.0, 0.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r4-100012648": { rating: [4.4, 4.4, 4.4, 4.4, 4.4], reviews: [721, 721, 721, 730, 747], price: [6.81, 6.86, 6.86, 6.86, 6.86], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r4-100023081": { rating: [4.1, 4.1, 4.1, 4.1, 4.1], reviews: [1356, 1364, 1384, 1393, 1403], price: [7.97, 7.97, 7.97, 7.97, 7.97], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r4-100034451": { rating: [4, 4, 4, 4, 4], reviews: [1394, 1405, 1415, 1424, 1440], price: [8.97, 8.97, 8.97, 8.97, 8.97], stockRate: [0.0, 0.0, 0.0, 0.0, 0.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r4-100046531": { rating: [3.4, 3.4, 3.4, 3.4, 3.4], reviews: [31, 31, 31, 31, 31], price: [22.99, 22.99, 24.97, 24.97, 24.97], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r4-100052940": { rating: [3.4, 3.4, 3.4, 3.4, 3.5], reviews: [98, 98, 98, 100, 105], price: [5.27, 5.27, 5.27, 5.27, 5.27], stockRate: [0.0, 0.0, 0.0, 0.0, 0.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r4-100056149": { rating: [4.5, 4.5, 4.5, 4.5, 4.4], reviews: [71, 71, 71, 71, 74], price: [5.86, 5.86, 5.86, 5.86, 5.86], stockRate: [0.0, 0.0, 0.0, 0.0, 0.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r4-100062166": { rating: [4.3, 4.3, 4.3, 4.2, 4.2], reviews: [606, 611, 620, 627, 628], price: [8.48, 8.48, 8.97, 8.97, 8.97], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r4-100117730": { rating: [2.8, 2.8, 2.8, 2.8, 2.8], reviews: [17, 17, 17, 17, 17], price: [4.47, 4.47, 4.47, 4.47, 4.47], stockRate: [100.0, 100.0, 100.0, 85.7, 0.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r6-1000207877": { rating: [4, 4, 4, 4, 4], reviews: [53, 53, 53, 53, 53], price: [12.68, 12.68, 12.68, 12.68, 12.68], stockRate: [28.6, 0.0, 14.3, 0.0, 0.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r6-1000387581": { rating: [0, 0, 0, 0, 0], reviews: [0, 0, 0, 0, 0], price: [8.47, 8.47, 8.47, 8.47, 8.47], stockRate: [0.0, 0.0, 0.0, 0.0, 0.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r6-1000735634": { rating: [4.5, 4.5, 4.5, 4.5, 4.5], reviews: [30, 30, 30, 30, 30], price: [14.48, 14.48, 14.48, 14.48, 14.48], stockRate: [14.3, 0.0, 0.0, 0.0, 0.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r6-1000735640": { rating: [4.5, 4.5, 4.5, 4.5, 4.5], reviews: [29, 29, 29, 29, 29], price: [18.48, 18.48, 18.48, 18.48, 18.48], stockRate: [0.0, 0.0, 0.0, 0.0, 0.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r6-5001633443": { rating: [4.5, 4.5, 4.5, 4.5, 4.5], reviews: [16, 16, 16, 16, 18], price: [25.48, 25.48, 25.48, 25.48, 25.48], stockRate: [0.0, 0.0, 28.6, 0.0, 0.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r6-5001959349": { rating: [5, 5, 5, 5, 5], reviews: [19, 19, 19, 19, 19], price: [62.36, 62.36, 62.48, 62.48, 62.48], stockRate: [0.0, 0.0, 0.0, 0.0, 0.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r6-5002106395": { rating: [5, 5, 5, 5, 5], reviews: [26, 26, 26, 26, 26], price: [91.98, 91.98, 91.98, 91.98, 91.98], stockRate: [0.0, 0.0, 0.0, 0.0, 0.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r1-B00002NC7W": { rating: [4.5, 4.5, 4.5, 4.5, 4.5], reviews: [1268, 1270, 1274, 1288, 1294], price: [5.99, 5.99, 5.99, 5.99, 5.99], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r1-B00004R93Z": { rating: [4.3, 4.3, 4.3, 4.3, 4.3], reviews: [395, 394, 394, 395, 395], price: [28.17, 28.17, 28.17, 28.17, 28.17], stockRate: [100.0, 57.1, 100.0, 100.0, 100.0], buyBoxRate: [0, 0, 0, 0, 0] },
  "r1-B00004R940": { rating: [3.8, 3.8, 3.8, 3.8, 3.8], reviews: [84, 84, 84, 84, 84], price: [63.1, 63.1, 63.1, 63.1, 63.1], stockRate: [0.0, 0.0, 0.0, 0.0, 0.0], buyBoxRate: [0, 0, 0, 0, 0] },
  "r1-B00004R946": { rating: [4.4, 4.4, 4.4, 4.4, 4.4], reviews: [2215, 2225, 2240, 2252, 2260], price: [53.72, 53.72, 52.4, 51.96, 51.96], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [100, 100, 100, 86, 100] },
  "r1-B00004SC4X": { rating: [4, 4, 4, 4.1, 4.1], reviews: [114, 115, 115, 116, 116], price: [148.18, 148.18, 148.18, 148.18, 148.18], stockRate: [100.0, 85.7, 100.0, 100.0, 100.0], buyBoxRate: [0, 0, 0, 0, 0] },
  "r1-B00004SC50": { rating: [3.9, 3.9, 3.9, 3.9, 3.9], reviews: [81, 81, 81, 81, 80], price: [98.18, 98.18, 98.18, 98.18, 98.18], stockRate: [28.6, 0.0, 0.0, 0.0, 0.0], buyBoxRate: [0, 0, 0, 0, 0] },
  "r1-B00004SC51": { rating: [3.9, 3.9, 3.9, 4, 4], reviews: [331, 331, 331, 332, 332], price: [79.99, 79.99, 67.83, 47.83, 47.83], stockRate: [0.0, 14.3, 85.7, 85.7, 100.0], buyBoxRate: [0, 0, 0, 0, 0] },
  "r1-B00004SC5M": { rating: [3.3, 3.3, 3.3, 3.3, 3.3], reviews: [29, 29, 29, 29, 29], price: [19.99, 129.95, 49.95, 49.95, 49.95], stockRate: [28.6, 14.3, 71.4, 0.0, 0.0], buyBoxRate: [0, 0, 0, 0, 0] },
  "r1-B00004SPZS": { rating: [3.8, 3.8, 3.8, 3.8, 3.8], reviews: [21, 21, 21, 21, 21], price: [24, 24.99, 24.99, 24.99, 24.99], stockRate: [0.0, 0.0, 0.0, 0.0, 0.0], buyBoxRate: [100, 100, 86, 0, 0] },
  "r1-B00004SQ00": { rating: [3, 3, 3, 3, 3], reviews: [13, 13, 13, 13, 13], price: [94, 94.95, 94.95, 94.95, 94.95], stockRate: [0.0, 0.0, 0.0, 0.0, 0.0], buyBoxRate: [71, 100, 100, 100, 100] },
  "r1-B00004SQ1I": { rating: [5, 5, 5, 5, 5], reviews: [4, 4, 4, 4, 4], price: [23.67, 23.67, 23.67, 23.67, 23.67], stockRate: [14.3, 71.4, 0.0, 0.0, 0.0], buyBoxRate: [57, 29, 100, 100, 100] },
  "r1-B000084EMZ": { rating: [4.8, 4.8, 4.8, 4.8, 4.8], reviews: [2294, 2304, 2311, 2328, 2339], price: [22.64, 22.64, 22.64, 22.64, 22.64], stockRate: [42.9, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r1-B000084EN5": { rating: [4.8, 4.8, 4.8, 4.8, 4.8], reviews: [11112, 11166, 11193, 11263, 11315], price: [27.19, 27.19, 27.19, 27.19, 27.19], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r1-B000255N8C": { rating: [4.6, 4.6, 4.6, 4.6, 4.6], reviews: [23, 23, 23, 23, 23], price: [5.56, 5.66, 5.73, 5.69, 5.69], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r1-B000255NK0": { rating: [4.7, 4.7, 4.7, 4.7, 4.7], reviews: [111, 111, 111, 111, 110], price: [18.57, 18.57, 18.57, 18.57, 18.57], stockRate: [0.0, 0.0, 0.0, 0.0, 0.0], buyBoxRate: [0, 0, 0, 0, 0] },
  "r1-B000255NKA": { rating: [4.8, 4.8, 4.8, 4.8, 4.8], reviews: [7068, 7088, 7120, 7164, 7201], price: [12.99, 12.99, 12.99, 12.99, 12.99], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r1-B000255NLE": { rating: [4.1, 4.1, 4.1, 4.1, 4.1], reviews: [878, 880, 878, 881, 882], price: [68.6, 65.64, 79.99, 79.99, 69.99], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [100, 100, 100, 100, 50] },
  "r1-B000255OAE": { rating: [4.6, 4.6, 4.6, 4.6, 4.6], reviews: [222, 222, 223, 223, 224], price: [8.92, 8.88, 9.37, 8.59, 8.83], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [14, 0, 43, 71, 50] },
  "r1-B000255OAO": { rating: [4.5, 4.5, 4.5, 4.5, 4.5], reviews: [185, 185, 185, 185, 185], price: [9.23, 9.23, 9.23, 9.23, 9.23], stockRate: [0.0, 0.0, 0.0, 28.6, 0.0], buyBoxRate: [0, 0, 0, 29, 0] },
  "r1-B000255QWA": { rating: [4.6, 4.6, 4.6, 4.6, 4.6], reviews: [602, 605, 611, 615, 618], price: [10, 10, 6.59, 6.59, 6.59], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r1-B0002561OM": { rating: [4.4, 4.4, 4.4, 4.4, 4.4], reviews: [490, 490, 490, 490, 490], price: [3.99, 3.99, 3.99, 3.99, 3.99], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r1-B000BQU0LC": { rating: [4.4, 4.4, 4.5, 4.5, 4.5], reviews: [9126, 766, 775, 788, 795], price: [3.78, 3.78, 3.78, 3.78, 3.78], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r1-B000BQURQA": { rating: [4.4, 4.4, 4.4, 4.4, 4.2], reviews: [9126, 8369, 8382, 8410, 1305], price: [6.49, 5.28, 6.49, 6.49, 5.28], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r1-B000BWY6K2": { rating: [4.3, 4.3, 4.3, 4.3, 4.3], reviews: [6057, 6172, 6243, 6358, 6447], price: [6.99, 6.98, 6.98, 6.98, 6.98], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r1-B000HHO110": { rating: [4.3, 4.3, 4.3, 4.3, 4.3], reviews: [5682, 5790, 5873, 6006, 6124], price: [5.98, 7.97, 7.97, 7.97, 7.97], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r1-B000HM68HK": { rating: [4.4, 4.4, 4.4, 4.5, 4.5], reviews: [1078, 1085, 1092, 420, 4921], price: [13.62, 13.62, 13.62, 13.62, 13.62], stockRate: [0.0, 0.0, 0.0, 0.0, 0.0], buyBoxRate: [0, 0, 0, 0, 0] },
  "r1-B000HSZH0S": { rating: [3, 3, 3, 3, 3], reviews: [454, 453, 452, 454, 453], price: [69, 69, 69, 69, 69], stockRate: [85.7, 0.0, 0.0, 0.0, 0.0], buyBoxRate: [0, 0, 0, 0, 0] },
  "r1-B000I15AH4": { rating: [4.5, 4.5, 4.5, 4.5, 4.5], reviews: [382, 385, 393, 398, 400], price: [9.48, 9.48, 9.48, 9.48, 9.48], stockRate: [42.9, 85.7, 42.9, 100.0, 100.0], buyBoxRate: [100, 100, 43, 100, 100] },
  "r1-B000I1B0JQ": { rating: [4.5, 4.5, 4.5, 4.5, 4.5], reviews: [1338, 1340, 1339, 1345, 1348], price: [8.08, 8.08, 8.08, 8.08, 8.08], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r1-B000IO1TDU": { rating: [4.6, 4.6, 4.6, 4.6, 4.6], reviews: [1651, 1677, 1685, 1722, 1757], price: [5.97, 5.98, 5.98, 5.98, 5.98], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [100, 100, 100, 100, 100] },
};

export const REAL_SOS_WEEKLY: Record<string, number[]> = {
  "r1": [100.0, 100.0, 100.0, 100.0],
  "r2": [60.0, 60.0, 60.0, 60.0],
  "r3": [100.0, 100.0, 100.0, 100.0],
  "r4": [90.0, 90.0, 90.0, 100.0],
  "r5": [100.0, 100.0, 100.0, 100.0],
  "r6": [100.0, 100.0, 100.0, 80.0],
  "r7": [90.0, 90.0, 90.0, 90.0],
  "portfolio": [91.4, 91.4, 91.4, 90.0],
};

/* Genuine cross-retailer matches within our own 117-SKU sample — same brand
   plus >=45% product-name token overlap (title/model number match, not just
   a shared brand word), regenerated by build_mock_data.py. Products with no
   entry here genuinely are not tracked at any other retailer in this sample,
   which the product page states honestly instead of fabricating "Live"
   everywhere. */
/* Real third-party marketplace sellers that actually won the buy box on a
   tracked product, pulled from the real "Buy box seller" field in the Price
   tab. Home Depot AND Lowe's are deliberately excluded -- both retailers'
   seller fields are store/location names (e.g. "Cumberland",
   "Fairbanks Lowe's"), not competing marketplace sellers, so there is no
   real third-party signal for either retailer in this sample. These are
   one-off arbitrage resellers, not persistent competitor brands with their
   own ratings/content/price -- which is exactly why the Competitors page
   below still uses an illustrative brand set: no first-class Competitor
   entity is resolvable from this crawl. */
export const REAL_BUYBOX_COMPETITOR: Record<string, { seller: string; daysWon: number }> = {
  "r1-B00004R93Z": { seller: "J & T Vintage", daysWon: 13 },
  "r1-B00004R946": { seller: "THE REAL DEAL", daysWon: 1 },
  "r1-B00004SC4X": { seller: "bestdealsongo", daysWon: 10 },
  "r1-B00004SC51": { seller: "Lohart Industries", daysWon: 17 },
  "r1-B000255NLE": { seller: "JDC WHOLESALE", daysWon: 1 },
  "r1-B000255OAE": { seller: "Monster Pets", daysWon: 18 },
  "r1-B000HSZH0S": { seller: "MaxWarehouse", daysWon: 6 },
  "r1-B00004SQ1I": { seller: "Rewrite the Stars", daysWon: 6 },
  "r1-B00004SC5M": { seller: "Sale2Mail", daysWon: 18 },
  "r1-B00004SC50": { seller: "\njerseys4thewin", daysWon: 1 },
  "r3-8207932": { seller: "AmericaRx Smart Shop", daysWon: 29 },
  "r3-12444073": { seller: "ABC Shops", daysWon: 17 },
  "r3-12166874": { seller: "Grace Ecommerce LLC", daysWon: 11 },
  "r3-15136591": { seller: "Pharmapacks", daysWon: 27 },
  "r3-2684038": { seller: "YPGP Ltd.", daysWon: 9 },
  "r3-12166875": { seller: "Commercial Supply Company LLC", daysWon: 14 },
  "r3-10291760": { seller: "Genius Lifestyle", daysWon: 7 },
  "r3-10291577": { seller: "National Discount Centers", daysWon: 1 },
  "r3-16561276": { seller: "Champion Values", daysWon: 5 },
  "r3-14320976": { seller: "Western Family", daysWon: 4 },
  "r3-14320955": { seller: "ELECTRONIC WAREHOUSE OUTLET", daysWon: 8 },
  "r3-10574351": { seller: "ELECTRONIC WAREHOUSE OUTLET", daysWon: 28 },
  "r3-15136592": { seller: "Holly Tree Wholesale", daysWon: 14 },
};

export const CROSS_RETAILER_MATCH: Record<string, Record<string, string>> = {
  "r1-B000255NKA": { "r7": "r7-77780" },
  "r7-77763": { "r1": "r1-B000255NK0" },
  "r7-77780": { "r1": "r1-B000255NK0" },
  "r1-B000255NK0": { "r7": "r7-77780" },
  "r1-B000255QWA": { "r3": "r3-10291762" },
  "r3-10291763": { "r1": "r1-B000255QWA" },
  "r3-10291762": { "r1": "r1-B000255QWA" },
  "r3-10291760": { "r5": "r5-1031232", "r6": "r6-5001959349" },
  "r5-1031219": { "r3": "r3-10291760", "r6": "r6-5001959349" },
  "r5-1031232": { "r3": "r3-10291760", "r6": "r6-5001959349", "r7": "r7-32840" },
  "r6-1000735634": { "r3": "r3-10291760", "r5": "r5-1031232", "r7": "r7-16586" },
  "r6-1000735640": { "r3": "r3-10291760", "r5": "r5-1031232", "r7": "r7-16586" },
  "r6-5002106395": { "r3": "r3-10291760", "r5": "r5-1031232", "r7": "r7-16586" },
  "r6-5001959349": { "r3": "r3-10291760", "r5": "r5-1031232", "r7": "r7-16586" },
  "r5-1031024": { "r6": "r6-5001959349", "r7": "r7-78387" },
  "r7-78387": { "r5": "r5-1031024" },
  "r7-31933": { "r5": "r5-1031232", "r6": "r6-1000735640" },
  "r7-32840": { "r5": "r5-1031232", "r6": "r6-5001959349" },
  "r7-16578": { "r6": "r6-5001959349" },
  "r7-16586": { "r6": "r6-5001959349" },
  "r1-B0002561OM": { "r3": "r3-4252994" },
  "r3-4252994": { "r1": "r1-B0002561OM" },
  "r1-B000BWY6K2": { "r6": "r6-1255457" },
  "r6-1255457": { "r1": "r1-B000BWY6K2" },
  "r1-B000HM68HK": { "r4": "r4-100023081", "r6": "r6-3103667" },
  "r4-100034451": { "r1": "r1-B000HM68HK" },
  "r4-100023081": { "r1": "r1-B000HM68HK" },
  "r6-3103667": { "r1": "r1-B000I15AH4" },
  "r1-B000BQURQA": { "r4": "r4-100052940", "r6": "r6-3120411" },
  "r4-100052940": { "r1": "r1-B00002NC7W", "r6": "r6-3047623" },
  "r6-3120411": { "r1": "r1-B00002NC7W", "r4": "r4-100008212" },
  "r1-B00002NC7W": { "r4": "r4-100008212", "r6": "r6-3047623" },
  "r4-100012648": { "r1": "r1-B00002NC7W", "r6": "r6-3047623" },
  "r4-100056149": { "r1": "r1-B00002NC7W", "r6": "r6-3047623" },
  "r4-100008212": { "r1": "r1-B00002NC7W", "r6": "r6-3047623" },
  "r6-3120407": { "r1": "r1-B00002NC7W", "r4": "r4-100008212" },
  "r6-3047623": { "r1": "r1-B00002NC7W", "r4": "r4-100008212" },
  "r1-B000I15AH4": { "r6": "r6-3103667" },
  "r4-100062166": { "r6": "r6-3031685" },
  "r6-3031685": { "r4": "r4-100062166" },
  "r3-12166874": { "r4": "r4-100004739" },
  "r4-100004739": { "r3": "r3-12166874" },
  "r3-12444073": { "r6": "r6-3033932" },
  "r6-3033932": { "r3": "r3-15056078" },
  "r3-15056078": { "r6": "r6-3033932" },
  "r1-B00004R93Z": { "r3": "r3-2684063" },
  "r3-2684063": { "r1": "r1-B00004R940" },
  "r1-B00004R940": { "r3": "r3-2684063" },
  "r1-B00004SC4X": { "r3": "r3-14320976" },
  "r3-11186328": { "r1": "r1-B00004SQ00" },
  "r3-14320976": { "r1": "r1-B00004SPZS" },
  "r1-B00004SC5M": { "r3": "r3-14320976" },
  "r1-B00004SPZS": { "r3": "r3-14320976" },
  "r1-B00004SQ00": { "r3": "r3-11186328" },
  "r2-42091": { "r6": "r6-1000387581" },
  "r6-1000207877": { "r2": "r2-42138" },
  "r6-5001633443": { "r2": "r2-42138" },
  "r6-1000387581": { "r2": "r2-42138" },
  "r2-42138": { "r6": "r6-1000387581" },
};


export const REAL_ROLLUP_WEEKLY: Record<string, {
  stockRate: number[]; buyBoxRate: number[]; rating: number[]; content: number[]; avgPrice: number[];
  /* raw daily-row counts behind stockRate/buyBoxRate/avgPrice that week --
     pool (sum numerator / sum denominator, or sum of prices / count of prices),
     never average, when combining multiple weeks (e.g. for a custom date
     range); see the comment above this table's construction in
     build_mock_data.py for why. */
  stockRateWeight: number[]; buyBoxRateWeight: number[]; avgPriceWeight: number[];
}> = {
  "portfolio": { stockRate: [62.3, 61.24, 56.77, 62.58, 62.61], buyBoxRate: [82.32, 82.73, 82.48, 82.16, 80.87], rating: [4.26, 4.26, 4.26, 4.26, 4.26], content: [61.13, 61.13, 61.21, 61.24, 61.32], avgPrice: [24.42, 21.72, 21.97, 21.39, 21.59], stockRateWeight: [809, 805, 805, 807, 230], buyBoxRateWeight: [809, 805, 805, 807, 230], avgPriceWeight: [755, 743, 743, 746, 212] },
  "r1": { stockRate: [64.76, 64.29, 66.67, 67.14, 66.67], buyBoxRate: [61.43, 60.95, 62.38, 62.86, 60.0], rating: [4.27, 4.27, 4.28, 4.29, 4.28], content: [66.73, 66.73, 66.5, 66.63, 66.63], avgPrice: [30.67, 30.65, 30.49, 27.73, 27.8], stockRateWeight: [210, 210, 210, 210, 60], buyBoxRateWeight: [210, 210, 210, 210, 60], avgPriceWeight: [165, 158, 161, 156, 44] },
  "r2": { stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [100.0, 100.0, 100.0, 100.0, 100.0], rating: [3.78, 3.78, 3.78, 3.78, 3.78], content: [61.4, 61.4, 63.0, 63.0, 63.0], avgPrice: [15.09, 14.64, 14.54, 14.52, 14.62], stockRateWeight: [70, 70, 70, 70, 20], buyBoxRateWeight: [70, 70, 70, 70, 20], avgPriceWeight: [70, 70, 70, 70, 20] },
  "r3": { stockRate: [68.57, 67.14, 42.86, 69.52, 73.33], buyBoxRate: [70.48, 72.86, 70.48, 68.57, 66.67], rating: [4.24, 4.24, 4.24, 4.24, 4.24], content: [58.87, 58.87, 58.87, 58.87, 58.87], avgPrice: [38.53, 29.13, 29.94, 30.16, 30.82], stockRateWeight: [210, 210, 210, 210, 60], buyBoxRateWeight: [210, 210, 210, 210, 60], avgPriceWeight: [210, 210, 210, 210, 60] },
  "r4": { stockRate: [60.0, 60.0, 60.0, 58.57, 50.0], buyBoxRate: [100.0, 100.0, 100.0, 100.0, 100.0], rating: [4.0, 4.0, 4.0, 3.99, 3.99], content: [61.8, 61.8, 61.8, 61.8, 61.8], avgPrice: [8.06, 8.16, 8.41, 8.41, 8.41], stockRateWeight: [70, 70, 70, 70, 20], buyBoxRateWeight: [70, 70, 70, 70, 20], avgPriceWeight: [70, 70, 70, 70, 20] },
  "r5": { stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [100.0, 100.0, 100.0, 100.0, 100.0], rating: [4.65, 4.65, 4.65, 4.65, 4.65], content: [60.5, 60.5, 60.5, 60.5, 60.5], avgPrice: [19.43, 19.43, 18.55, 17.89, 17.89], stockRateWeight: [70, 70, 70, 70, 20], buyBoxRateWeight: [70, 70, 70, 70, 20], avgPriceWeight: [70, 70, 70, 70, 20] },
  "r6": { stockRate: [2.52, 0.0, 8.4, 0.0, 0.0], buyBoxRate: [100.0, 100.0, 100.0, 100.0, 100.0], rating: [4.23, 4.24, 4.24, 4.24, 4.24], content: [60.88, 60.88, 60.88, 60.88, 60.88], avgPrice: [17.13, 16.99, 17.52, 18.21, 18.21], stockRateWeight: [119, 119, 119, 119, 34], buyBoxRateWeight: [119, 119, 119, 119, 34], avgPriceWeight: [110, 109, 106, 112, 32] },
  "r7": { stockRate: [65.0, 62.5, 62.5, 63.79, 62.5], buyBoxRate: [100.0, 100.0, 100.0, 100.0, 100.0], rating: [4.67, 4.67, 4.67, 4.67, 4.67], content: [51.2, 51.2, 51.2, 51.2, 52.1], avgPrice: [7.03, 6.62, 6.51, 6.95, 6.51], stockRateWeight: [60, 56, 56, 58, 16], buyBoxRateWeight: [60, 56, 56, 58, 16], avgPriceWeight: [60, 56, 56, 58, 16] },
};


function catalogAsp(id: string): number | null {
  const p = (catalog as any[]).find((x) => x.id === id);
  return p ? ((p.avgSellingPrice ?? p.price) as number) : null;
}

/* Price Index compares a product's price to ITS OWN average selling price
   for the period -- purely item-level, no other product or retailer
   involved. >100 means it's currently priced above its own typical price
   this period (e.g. a recent hike); <100 means it's currently priced below
   its own norm (e.g. a markdown). This is not the same tautology a
   peer-group design has: each product's own "now vs. its own average" is
   independent of every other product's, so averaging it across the
   portfolio is not mathematically forced toward 100 -- it genuinely
   reflects whether pricing, in aggregate, is trending up or down against
   this period's norm. Always available (every catalog product has both a
   price and an avgSellingPrice), so there's no "not tracked" case here. */
function itemPriceIndex(price: number, asp: number | null): number {
  return round(price / (asp || price), 3);
}

function productFor(p: (typeof catalog)[number], key: string) {
  const r = rng(hash(p.id + key));
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
    price: round(p.price * (0.99 + r() * 0.02), 2),
    priceIndex: itemPriceIndex(p.price, (p as any).avgSellingPrice ?? null),
    stockStatus: status as "In Stock" | "Low Stock" | "Out of Stock",
    inStockRate: round(clamp(
      p.stockBias * 100 + (r() - 0.5) * 2 -
      (status === "Out of Stock" ? 4 + r() * 4 : status === "Low Stock" ? 1 + r() * 1 : 0),
      0, 100), 1),
    rating: round(clamp(p.rating + (r() - 0.5) * 0.06, 1, 5), 2),
    reviews: Math.round(p.reviews * (0.98 + r() * 0.04)),
    contentScore: clamp(p.content + Math.round((r() - 0.5) * 4), 0, 100),
    buyBox: r() < (p.buyBoxRate ?? 0.78),
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

export type DateRange = { start: string; end: string };

/* Resolves a custom date range to indices into a real-week date list (either
   REAL_WEEK_DATES, the 5-point Sep 1-29 window Content/Price metrics have,
   or REAL_SOS_WEEK_DATES, the shorter 4-point Sep 8-29 window Share Of
   Search has). If nothing in the range overlaps that window (e.g. a range
   outside September 2022), falls back to the full window rather than
   showing nothing — `matched: false` tells the caller to surface that
   substitution instead of silently presenting it as an exact match. */
function matchRangeWeeks(range: DateRange | null | undefined, dates: string[]): { idx: number[]; matched: boolean } {
  if (!range) return { idx: [], matched: false };
  const idx = dates.map((d, i) => (d >= range.start && d <= range.end ? i : -1)).filter((i) => i >= 0);
  if (idx.length) return { idx, matched: true };
  return { idx: dates.map((_, i) => i), matched: false };
}

/* Headline KPI value + delta for a custom date range, pooled across every
   matched real week -- this is the number the KPI card's big number and
   delta actually show, distinct from `vals` (the spark/trend-chart series,
   which stays on the narrower Sep 8-29 window shared with Search Visibility
   so every chart on the page still shares one x-axis). stockRate/buyBoxRate
   are rates over a day-count that varies week to week, so they MUST be
   pooled from raw counts (stockRateWeight/buyBoxRateWeight), never averaged
   as percentages -- averaging e.g. "8.4% over 119 rows" and "0% over 34
   rows" as if they were equally-weighted observations is simply wrong: pool
   to (0.084*119 + 0*34) / (119+34) = 7.4%, not their (8.4+0)/2 = 4.2%
   midpoint. rating/content have a constant per-week product count, so plain
   averaging is already correct for those two. */
function realRangeValue(retailer: string, field: "stockRate" | "buyBoxRate" | "rating" | "content", idx: number[]): { value: number; delta: number } | null {
  const row = REAL_ROLLUP_WEEKLY[retailer === "all" ? "portfolio" : retailer];
  if (!row || !idx.length) return null;
  const weights = field === "stockRate" ? row.stockRateWeight : field === "buyBoxRate" ? row.buyBoxRateWeight : null;
  let value: number;
  if (weights) {
    const totalWeight = idx.reduce((s, i) => s + weights[i], 0);
    value = totalWeight
      ? (idx.reduce((s, i) => s + (row[field][i] / 100) * weights[i], 0) / totalWeight) * 100
      : idx.reduce((s, i) => s + row[field][i], 0) / idx.length;
  } else {
    value = idx.reduce((s, i) => s + row[field][i], 0) / idx.length;
  }
  const delta = row[field][idx[idx.length - 1]] - row[field][idx[0]];
  return { value, delta };
}

/* Same pooling principle as realRangeValue, applied to a retailer's/the
   portfolio's real Average Price -- averaging each week's already-computed
   average price, unweighted, makes the same error as averaging weekly
   stock rates: a 2-day week (Sep 29-30) would count as heavily as a 7-day
   week. Pool raw dollar-sum / raw day-count across the matched weeks
   instead (avgPriceWeight), never average the per-week averages. */
function realRangeValueAvgPrice(retailer: string, idx: number[]): { value: number; delta: number } | null {
  const row = REAL_ROLLUP_WEEKLY[retailer === "all" ? "portfolio" : retailer];
  if (!row || !idx.length) return null;
  const totalWeight = idx.reduce((s, i) => s + row.avgPriceWeight[i], 0);
  const value = totalWeight
    ? idx.reduce((s, i) => s + row.avgPrice[i] * row.avgPriceWeight[i], 0) / totalWeight
    : idx.reduce((s, i) => s + row.avgPrice[i], 0) / idx.length;
  const delta = row.avgPrice[idx[idx.length - 1]] - row.avgPrice[idx[0]];
  return { value, delta };
}

/* Same pooling principle as realRangeValue, applied to Share Of Search
   (constant 10-keyword denominator every week, so plain averaging across
   matched weeks is already the correct pooled result -- no weight array
   needed) and to Price Index (a ratio of continuous values, not a
   count-based rate, so averaging across weeks is standard practice). */
function realRangeValueSos(retailer: string, idx: number[]): { value: number; delta: number } | null {
  const row = REAL_SOS_WEEKLY[retailer === "all" ? "portfolio" : retailer];
  if (!row || !idx.length) return null;
  const value = idx.reduce((s, i) => s + row[i], 0) / idx.length;
  const delta = row[idx[idx.length - 1]] - row[idx[0]];
  return { value, delta };
}

/* Weekly real Price Index -- item-level (see itemPriceIndex above), using
   that week's own REAL_PRODUCT_WEEKLY price against the item's own
   whole-period average selling price, so the trend shows how much a given
   week's real price deviated from that item's norm for the month. Every
   product with weekly price data contributes; there's no "not tracked"
   case since avgSellingPrice always exists for a product with any price
   history. */
function weeklyItemPriceIndex(ids: string[], wi: number): number | null {
  const ratios = ids
    .map((id) => {
      const wp = REAL_PRODUCT_WEEKLY[id]?.price[wi];
      const asp = catalogAsp(id);
      return wp != null && asp ? itemPriceIndex(wp, asp) : null;
    })
    .filter((v): v is number => v != null);
  return ratios.length ? (ratios.reduce((a, v) => a + v, 0) / ratios.length) * 100 : null;
}

function realRangeValuePriceIndex(retailer: string, idx: number[]): { value: number; delta: number } | null {
  const ids = Object.keys(REAL_PRODUCT_WEEKLY).filter((id) => retailer === "all" || id.startsWith(retailer + "-"));
  if (!ids.length || !idx.length) return null;
  const perWeek = idx.map((wi) => weeklyItemPriceIndex(ids, wi)).filter((v): v is number => v != null);
  if (!perWeek.length) return null;
  const value = perWeek.reduce((s, v) => s + v, 0) / perWeek.length;
  const delta = perWeek[perWeek.length - 1] - perWeek[0];
  return { value, delta };
}

/* Single "current value" resolver for the Retailer performance / digital-shelf
   breakdown cards (Overview's retailerPerformance, Digital Shelf's byRetailer)
   -- pooled across the selected custom date range when one is active (reusing
   realRangeValue's weighted pooling), or the latest real week when "Last 4
   weeks" is selected with no custom range, else null so the caller falls back
   to its existing synthetic bias-based estimate. Search Visibility stays
   synthetic on these specific cards (no real per-retailer competitive-share
   data exists), so this is never called for that field. */
function realCurrentValue(retailer: string, field: "stockRate" | "buyBoxRate" | "rating" | "content", period: string, dateRange: DateRange | null | undefined, wideIdx?: number[]): number | null {
  if (dateRange && wideIdx) {
    const r = realRangeValue(retailer, field, wideIdx);
    return r ? r.value : null;
  }
  if (period === "4w") {
    const row = REAL_ROLLUP_WEEKLY[retailer === "all" ? "portfolio" : retailer];
    return row ? row[field][4] : null;
  }
  return null;
}

/* Same as realCurrentValue above, but for the real pooled Average Price
   (see realRangeValueAvgPrice) -- kept separate since avgPrice is a dollar
   amount pooled by raw price-sum/count, not a 0-100 rate pooled by
   in-stock/total counts, so it needs its own weighted-pooling formula. */
function realCurrentAvgPrice(retailer: string, period: string, dateRange: DateRange | null | undefined, wideIdx?: number[]): number | null {
  if (dateRange && wideIdx) {
    const r = realRangeValueAvgPrice(retailer, wideIdx);
    return r ? r.value : null;
  }
  if (period === "4w") {
    const row = REAL_ROLLUP_WEEKLY[retailer === "all" ? "portfolio" : retailer];
    return row ? row.avgPrice[4] : null;
  }
  return null;
}

/* Real portfolio/retailer-level trend series for the "Last 4 weeks" period —
   same reasoning as REAL_PRODUCT_WEEKLY above: this is the one window the
   real September crawl can honestly fill point-for-point. Every other
   period keeps the synthetic series() curves. `rangeIdx` (0-3, from
   matchRangeWeeks) overrides the period check entirely for the custom
   date-range filter — REAL_ROLLUP_WEEKLY is a 5-point array (Sep 1 first),
   so indices are offset by 1 to land on the same Sep 8-29 window. */
function realRollupSeries(period: string, retailer: string, field: "stockRate" | "buyBoxRate" | "rating" | "content", rangeIdx?: number[]): number[] | null {
  const row = REAL_ROLLUP_WEEKLY[retailer === "all" ? "portfolio" : retailer];
  if (!row) return null;
  if (rangeIdx) return rangeIdx.map((i) => row[field][i + 1]);
  if (period !== "4w") return null;
  return row[field].slice(1);
}

/* REAL_SOS_WEEKLY holds "% of tracked-keyword searches that returned any
   ranked result" per retailer per week (e.g. Amazon/Walmart/PetSmart 100%,
   Chewy ~60% -- i.e. 40% of Chewy's tracked-keyword searches this period
   returned zero ranked results). This is a genuine, real number computed by
   build_mock_data.py from the Share Of Search tab, but it is a different
   metric than "Search Visibility / share of search among competitors"
   (which the KPI label above implies, compared against a 40% target) --
   the Share Of Search tab is 10 generic keywords per retailer, not a
   per-SKU competitive-share measurement, so this substitution is a
   documented simplification, not a literal match. Retailer/portfolio-level
   only -- there is no reliable way to attribute a keyword-level result to
   one specific tracked SKU, so per-product search rank stays synthetic. */
function realRollupSeriesSos(period: string, retailer: string, rangeIdx?: number[]): number[] | null {
  const row = REAL_SOS_WEEKLY[retailer === "all" ? "portfolio" : retailer];
  if (!row) return null;
  if (rangeIdx) return rangeIdx.map((i) => row[i]);
  if (period !== "4w") return null;
  return row;
}

function realPriceIndexWeekly(period: string, retailer: string, rangeIdx?: number[]): number[] | null {
  const ids = Object.keys(REAL_PRODUCT_WEEKLY).filter((id) => retailer === "all" || id.startsWith(retailer + "-"));
  if (!ids.length) return null;
  const weekPositions = rangeIdx ? rangeIdx.map((i) => i + 1) : period !== "4w" ? null : [1, 2, 3, 4];
  if (!weekPositions) return null;
  const out: number[] = [];
  let last = 100;
  for (const wi of weekPositions) {
    const v = weeklyItemPriceIndex(ids, wi);
    if (v != null) last = round(v, 1);
    out.push(last);
  }
  return out;
}

function snapshot(retailer: string, period: string, dateRange?: DateRange | null) {
  const key = retailer + "|" + period + (dateRange ? "|" + dateRange.start + ".." + dateRange.end : "");
  const seed = hash(key);
  const rangeMatch = dateRange ? matchRangeWeeks(dateRange, REAL_SOS_WEEK_DATES) : null;
  /* Wider than rangeMatch (Sep 1-29 vs. Sep 8-29) -- feeds the pooled KPI
     headline value/delta below for the metrics that genuinely have a Sep 1
     checkpoint (everything except Search Visibility). The chart/spark series
     stays on rangeMatch's narrower window so every trend chart on the page
     keeps sharing one x-axis. */
  const wideMatch = dateRange ? matchRangeWeeks(dateRange, REAL_WEEK_DATES) : null;
  const labels = rangeMatch ? rangeMatch.idx.map((i) => REAL_SOS_WEEK_LABELS[i]) : labelsFor(period);
  const n = labels.length;
  const bias = RETAILER_BIAS[retailer] || RETAILER_BIAS.all;
  const sw = swing[period] || 1;

  /* Anchors rescaled to the real portfolio keyword-coverage baseline (~90%,
     see REAL_SOS_WEEKLY) rather than the old ~34% synthetic "share of
     search among competitors" scale -- leader/riser stay illustrative
     (competitorBrands has no real counterpart), but must sit near the real
     sos value or the "Gap to Leader" comparison reads as nonsense once sos
     is real for the "4w" period. */
  const sos = realRollupSeriesSos(period, retailer, rangeMatch?.idx) ?? series(seed + 1, n, 90 - 3 * sw + bias.sos, 90 + bias.sos, 0.9, 1);
  const leader = series(seed + 2, n, 93 + 1 * sw, 95, 0.6, 1);
  const riser = series(seed + 3, n, 78 - 8 * sw, 78, 1.1, 1);
  const stockVals = realRollupSeries(period, retailer, "stockRate", rangeMatch?.idx)
    ?? series(seed + 4, n, 96.4 + 1.4 * sw + bias.stock, 96.4 + bias.stock, 0.5, 1).map((v) => round(clamp(v, 88, 100), 1));
  const ratingVals = realRollupSeries(period, retailer, "rating", rangeMatch?.idx)
    ?? series(seed + 5, n, 4.32 - 0.14 * sw + bias.rating, 4.32 + bias.rating, 0.03, 2);
  const contentVals = (realRollupSeries(period, retailer, "content", rangeMatch?.idx)?.map((v) => Math.round(v)))
    ?? series(seed + 6, n, 87 - 8 * sw + bias.content, 87 + bias.content, 1.2, 0).map((v) => clamp(Math.round(v), 40, 100));

  const pool = poolFor(retailer, key);
  const oos = pool.filter((p) => p.stockStatus === "Out of Stock").length;
  const avgRank = round(pool.reduce((a, p) => a + p.searchRank, 0) / (pool.length || 1), 1);
  const reviewVolume = pool.reduce((a, p) => a + p.reviews, 0);
  const last = (a: number[]) => a[a.length - 1];
  const first = (a: number[]) => a[0];

  /* A custom date range is a "summarize this window" request, not a
     "what's the latest snapshot" one -- `range` (from realRangeValue /
     realRangeValueSos / realRangeValuePriceIndex, pooled correctly per the
     comment on those functions) is what the KPI card's big number and delta
     actually show whenever a date range is active; `vals` remains the
     spark/trend-chart series either way. */
  const kpi = (id: string, label: string, unit: string, vals: number[], target: number, digits: number, range?: { value: number; delta: number } | null) => ({
    id, label, unit, target,
    value: range ? round(range.value, digits) : last(vals),
    delta: round((range ? range.delta : last(vals) - first(vals)), digits),
    spark: vals,
  });

  const r = rng(seed + 7);
  /* Same seeds/formula as shelfData() so Price Index and Buy Box Presence
     read identically wherever they appear. */
  const idxNow = round((pool.reduce((a, p) => a + p.priceIndex, 0) / (pool.length || 1)) * 100, 1);
  const priceIdx = realPriceIndexWeekly(period, retailer, rangeMatch?.idx) ?? series(seed + 21, n, idxNow - 1.8 * sw, idxNow, 0.6, 1);
  const buyNow = round((pool.filter((p) => p.buyBox).length / (pool.length || 1)) * 100, 0);
  const buyBoxSeries = realRollupSeries(period, retailer, "buyBoxRate", rangeMatch?.idx)?.map((v) => Math.round(v))
    ?? series(seed + 22, n, buyNow + 2 * sw, buyNow, 1.2, 0).map((v) => clamp(Math.round(v), 40, 100));

  const out: any = {
    retailer, period, labels,
    dateRange: dateRange
      ? { start: dateRange.start, end: dateRange.end, matched: rangeMatch!.matched,
          note: rangeMatch!.matched ? null : "No crawl data for the exact range selected — showing the full Sep 8–29 crawl instead." }
      : null,
    generatedAt: "Today 06:40 UTC",
    kpis: [
      kpi("sos", "Search Visibility", "%", sos, 40, 1, dateRange ? realRangeValueSos(retailer, rangeMatch!.idx) : null),
      kpi("instock", "Availability", "%", stockVals, 98, 1, dateRange ? realRangeValue(retailer, "stockRate", wideMatch!.idx) : null),
      kpi("pidx", "Price Index", "", priceIdx, 100, 1, dateRange ? realRangeValuePriceIndex(retailer, wideMatch!.idx) : null),
      kpi("content", "Content Completeness", "/100", contentVals, 95, 0, dateRange ? realRangeValue(retailer, "content", wideMatch!.idx) : null),
      kpi("buybox", "Buy Box Presence", "%", buyBoxSeries, 95, 0, dateRange ? realRangeValue(retailer, "buyBoxRate", wideMatch!.idx) : null),
      kpi("rating", "Average Rating", "", ratingVals, 4.5, 2, dateRange ? realRangeValue(retailer, "rating", wideMatch!.idx) : null),
      { id: "oos", label: "Out of Stock SKUs", unit: "", target: 0, value: oos, delta: Math.round((r() - 0.5) * 4), spark: series(seed + 8, n, oos + 1, oos, 0.7, 0).map((v) => clamp(v, 0, 20)) },
      { id: "rank", label: "Avg Search Rank", unit: "", target: 5, value: avgRank, delta: round((r() - 0.5) * 2, 1), spark: series(seed + 9, n, avgRank + 1.4 * sw, avgRank, 0.5, 1) },
      { id: "reviews", label: "Review Count", unit: "", target: 20000, value: reviewVolume, delta: Math.round(reviewVolume * 0.04), spark: series(seed + 10, n, reviewVolume * 0.94, reviewVolume, reviewVolume * 0.01, 0) },
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
      const realStock = realCurrentValue(rt.id, "stockRate", period, dateRange, wideMatch?.idx);
      const realContent = realCurrentValue(rt.id, "content", period, dateRange, wideMatch?.idx);
      const realRating = realCurrentValue(rt.id, "rating", period, dateRange, wideMatch?.idx);
      const inStockR = realStock != null ? round(realStock, 1) : round(clamp(96.5 + b.stock + (rr() - 0.5) * 3, 85, 100), 1);
      const contentR = realContent != null ? Math.round(realContent) : clamp(Math.round(85 + b.content + (rr() - 0.5) * 8), 40, 100);
      const ratingR = realRating != null ? round(realRating, 2) : round(clamp(4.3 + b.rating + (rr() - 0.5) * 0.2, 3.4, 5), 2);
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
    title: "Competitive price movement (illustrative)",
    body: cheapest.name + " sits " + Math.abs(undercut).toFixed(1) + "% " +
      (undercut > 0 ? "below" : "above") + " your price index on comparable lines" +
      (rising && rising.id !== cheapest.id && rising.delta > 0
        ? ", and " + rising.name + " gained " + rising.delta.toFixed(1) + " pts of search share."
        : ".") +
      " No competitor entity is resolvable from the raw crawl — see real buy-box-loss findings on individual product pages instead.",
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

export function fetchSnapshot({ retailer = "all", period = "12w", dateRange = null }: { retailer?: string; period?: string; dateRange?: DateRange | null } = {}) {
  return new Promise<any>((resolve) => setTimeout(() => resolve(snapshot(retailer, period, dateRange)), LATENCY));
}

/* ── digital shelf ────────────────────────────────────────────────────
   One assembled response per retailer+period. Every block is derived from
   the same product pool the overview reads, so the two pages never
   disagree about a SKU. Maps 1:1 onto /digital-shelf/* endpoints.
   ─────────────────────────────────────────────────────────────────────── */

/* base = real portfolio-wide average of each bucket's score, computed by
   build_mock_data.py's content-completeness rubric from the latest Content
   tab row per product (see the rubric table in the migration plan / repo
   docs for exactly which raw columns feed each bucket). Not illustrative —
   these are the same real per-product scores averaged in REAL_ROLLUP_WEEKLY
   .content, just broken out by component. */
const CONTENT_COMPONENTS = [
  { id: "title", name: "Title", weight: 20, base: 94, hint: "Retailer title spec, keyword placement" },
  { id: "description", name: "Description", weight: 15, base: 87, hint: "Bullet copy length and structure" },
  { id: "images", name: "Images", weight: 25, base: 72, hint: "Hero resolution and gallery depth" },
  { id: "attributes", name: "Attributes", weight: 20, base: 10, hint: "Structured fields feeding filters" },
  { id: "keywords", name: "Keywords", weight: 12, base: 54, hint: "Coverage of tracked search terms" },
  { id: "specs", name: "Specifications", weight: 8, base: 37, hint: "Nutrition, ingredients, dimensions" },
];

function shelfData(retailer: string, period: string, dateRange?: DateRange | null) {
  const key = retailer + "|" + period + (dateRange ? "|" + dateRange.start + ".." + dateRange.end : "");
  const seed = hash(key);
  const rangeMatch = dateRange ? matchRangeWeeks(dateRange, REAL_SOS_WEEK_DATES) : null;
  const wideMatch = dateRange ? matchRangeWeeks(dateRange, REAL_WEEK_DATES) : null;
  const labels = rangeMatch ? rangeMatch.idx.map((i) => REAL_SOS_WEEK_LABELS[i]) : labelsFor(period);
  const n = labels.length;
  const bias = RETAILER_BIAS[retailer] || RETAILER_BIAS.all;
  const sw = swing[period] || 1;
  const pool = poolFor(retailer, key);
  const last = (a: number[]) => a[a.length - 1];
  const first = (a: number[]) => a[0];
  const avg = (arr: any[], f: (x: any) => number, d?: number) => (arr.length ? round(arr.reduce((a, x) => a + f(x), 0) / arr.length, d == null ? 1 : d) : 0);

  /* Same seeds as the overview snapshot so shared KPIs read identically —
     and the same real-data-for-"4w" substitution, so the two pages never
     disagree about whether a number is real. */
  /* Same rescaled anchor as snapshot() above -- see the comment there. */
  const sos = realRollupSeriesSos(period, retailer, rangeMatch?.idx) ?? series(seed + 1, n, 90 - 3 * sw + bias.sos, 90 + bias.sos, 0.9, 1);
  const stockVals = realRollupSeries(period, retailer, "stockRate", rangeMatch?.idx)
    ?? series(seed + 4, n, 96.4 + 1.4 * sw + bias.stock, 96.4 + bias.stock, 0.5, 1).map((v) => round(clamp(v, 88, 100), 1));
  const contentVals = (realRollupSeries(period, retailer, "content", rangeMatch?.idx)?.map((v) => Math.round(v)))
    ?? series(seed + 6, n, 87 - 8 * sw + bias.content, 87 + bias.content, 1.2, 0).map((v) => clamp(Math.round(v), 40, 100));

  const idxNow = round(avg(pool, (p) => p.priceIndex, 3) * 100, 1);
  const priceIdx = realPriceIndexWeekly(period, retailer, rangeMatch?.idx) ?? series(seed + 21, n, idxNow - 1.8 * sw, idxNow, 0.6, 1);
  const buyNow = round((pool.filter((p) => p.buyBox).length / (pool.length || 1)) * 100, 0);
  const buyBox = realRollupSeries(period, retailer, "buyBoxRate", rangeMatch?.idx)?.map((v) => Math.round(v))
    ?? series(seed + 22, n, buyNow + 2 * sw, buyNow, 1.2, 0).map((v) => clamp(Math.round(v), 40, 100));

  /* Same reasoning as snapshot() -- `range` (pooled, see realRangeValue's
     comment) drives the KPI card's headline value/delta under a custom
     date range; `vals` stays the spark/trend-chart series either way. */
  const kpi = (id: string, label: string, unit: string, vals: number[], target: number, digits: number, range?: { value: number; delta: number } | null) => ({
    id, label, unit, target, value: range ? round(range.value, digits) : last(vals),
    delta: round((range ? range.delta : last(vals) - first(vals)), digits), spark: vals,
  });

  const byRetailer = retailers.slice(1).map((rt) => {
    const rr = rowRng(key, "shelfRetailer", rt.id);
    const b = RETAILER_BIAS[rt.id];
    const own = catalog.filter((p) => p.retailer === rt.id).map((p) => withShelfMetrics(productFor(p, key)));
    const visibility = round(clamp(31 + b.sos + (rr() - 0.5) * 6, 8, 58), 1);
    const realAvailability = realCurrentValue(rt.id, "stockRate", period, dateRange, wideMatch?.idx);
    const realContent = realCurrentValue(rt.id, "content", period, dateRange, wideMatch?.idx);
    const realRating = realCurrentValue(rt.id, "rating", period, dateRange, wideMatch?.idx);
    const realBuyBox = realCurrentValue(rt.id, "buyBoxRate", period, dateRange, wideMatch?.idx);
    const availability = realAvailability != null ? round(realAvailability, 1) : (own.length ? avg(own, (p) => p.inStockRate, 1) : round(clamp(96 + b.stock, 85, 100), 1));
    const content = realContent != null ? Math.round(realContent) : (own.length ? Math.round(avg(own, (p) => p.contentScore, 0)) : clamp(Math.round(85 + b.content), 40, 100));
    const rating = realRating != null ? round(realRating, 2) : (own.length ? avg(own, (p) => p.rating, 2) : round(clamp(4.3 + b.rating, 3.4, 5), 2));
    const priceIndex = own.length ? round(avg(own, (p) => p.priceIndex, 3) * 100, 1) : round(98 + rr() * 8, 1);
    const buyBoxPresence = realBuyBox != null ? Math.round(realBuyBox) : (own.length ? Math.round((own.filter((p) => p.buyBox).length / own.length) * 100) : Math.round(60 + rr() * 30));
    const shelfScore = clamp(Math.round(
      (visibility / 45) * 25 + (availability / 100) * 30 + (content / 100) * 25 + (rating / 5) * 20
    ), 25, 100);
    return {
      id: rt.id, name: rt.name, skus: own.length, visibility, availability, content, rating, priceIndex, buyBoxPresence, shelfScore,
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
    const rating = inCat.length ? avg(inCat, (p) => p.rating, 2) : round(clamp(4.3 + rr() * 0.3, 3.4, 5), 2);
    const overall = inCat.length ? Math.round(avg(inCat, (p) => p.shelfScore, 0)) : Math.round(55 + rr() * 30);
    return {
      category: c, skus: inCat.length, visibility, availability, content, priceIndex, rating, overall,
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

  /* Real Average Price (see realRangeValueAvgPrice) whenever real data
     applies -- pooled from every raw daily price row, not an unweighted
     average of each product's own already-averaged price (that "average
     of averages" silently over/under-weights products with more/fewer
     crawled days, the same error stockRate had before its pooling fix).
     Falls back to the existing per-product average for periods with no
     real window. */
  const realAvgPrice = realCurrentAvgPrice(retailer, period, dateRange, wideMatch?.idx);
  const ownPrice = realAvgPrice ?? avg(pool, (p) => p.price, 2);
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
    { id: "o-rank", focus: "rank", title: "Improve Search Visibility",
      problem: lowRank.length + " products sit outside the top 10 on keywords where a competitor ranks higher.",
      impact: lowRank.length > 6 ? "High" : "Medium", count: lowRank.length,
      why: "Positions 11 and below take a fraction of category click share, so the volume is going to rivals.",
      action: "Raise keyword coverage in titles and bullets on the affected SKUs, then re-crawl in 48 hours." },
    { id: "o-avail", focus: "avail", title: "Recover Availability",
      problem: lowAvail.length + " products fell below the 90% availability threshold in this period.",
      impact: lowAvail.length > 2 ? "High" : "Medium", count: lowAvail.length,
      why: "Out-of-stock days suppress rank as well as sales, so the loss compounds after the gap is closed.",
      action: "Flag the replenishment gap with the retailer team and confirm forecast cover for the next cycle." },
    { id: "o-price", focus: "price", title: "Review Price Position",
      problem: highPrice.length + " products are priced more than 10% above their own period average.",
      impact: highPrice.length > 4 ? "Medium" : "Low", count: highPrice.length,
      why: "Shoppers comparing on price filter these lines out before they reach the product page.",
      action: "Review promotional cover on these lines before the next price file goes out." },
    { id: "o-content", focus: "content", title: "Improve Content Completeness",
      problem: weakContent.length + " products have incomplete attributes suppressing filter and long-tail discovery.",
      impact: weakContent.length > 8 ? "High" : "Medium", count: weakContent.length,
      why: "Missing structured fields keep these SKUs out of retailer filters and long-tail results.",
      action: "Complete the structured attribute set, starting with the highest-volume categories." },
  ].sort((a, b) => ({ High: 0, Medium: 1, Low: 2 } as any)[a.impact] - ({ High: 0, Medium: 1, Low: 2 } as any)[b.impact]);

  return {
    retailer, period, labels,
    dateRange: dateRange
      ? { start: dateRange.start, end: dateRange.end, matched: wideMatch!.matched,
          note: wideMatch!.matched ? null : "No crawl data for the exact range selected — showing the full Sep 1–29 crawl instead." }
      : null,
    generatedAt: "Today 06:40 UTC",
    kpis: [
      kpi("sos", "Search Visibility", "%", sos, 40, 1, dateRange ? realRangeValueSos(retailer, rangeMatch!.idx) : null),
      kpi("instock", "Availability", "%", stockVals, 98, 1, dateRange ? realRangeValue(retailer, "stockRate", wideMatch!.idx) : null),
      kpi("pidx", "Price Index", "", priceIdx, 100, 1, dateRange ? realRangeValuePriceIndex(retailer, wideMatch!.idx) : null),
      kpi("content", "Content Completeness", "/100", contentVals, 95, 0, dateRange ? realRangeValue(retailer, "content", wideMatch!.idx) : null),
      kpi("buybox", "Buy Box Presence", "%", buyBox, 95, 0, dateRange ? realRangeValue(retailer, "buyBoxRate", wideMatch!.idx) : null),
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
      own: ownPrice, periodAvg: catAvg, index: idxNow,
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
  GPC: "Pet treats & aquarium range",
  HPC: "Small kitchen & grooming appliances",
  HG: "Spectracide weed & pest control",
};

function salesData(retailer: string, period: string, dateRange?: DateRange | null) {
  const key = retailer + "|" + period + (dateRange ? "|" + dateRange.start + ".." + dateRange.end : "");
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

  /* Digital shelf signals for the same retailer + period — Performance
     Intelligence reads these directly rather than an estimated-sales figure. */
  const shelf = shelfData(retailer, period, dateRange);
  const shelfKpi = (id: string) => shelf.kpis.find((k) => k.id === id) || { delta: 0, value: 0 };
  const signals = [
    { label: "Availability", delta: shelfKpi("instock").delta, unit: " pts", value: shelfKpi("instock").value + "%" },
    { label: "Search Visibility", delta: shelfKpi("sos").delta, unit: " pts", value: shelfKpi("sos").value + "%" },
    { label: "Price Index", delta: shelfKpi("pidx").delta, unit: " pts", value: String(shelfKpi("pidx").value) },
    { label: "Content Completeness", delta: shelfKpi("content").delta, unit: " pts", value: String(shelfKpi("content").value) },
    { label: "Buy Box Presence", delta: shelfKpi("buybox").delta, unit: " pts", value: shelfKpi("buybox").value + "%" },
  ];

  const byMove = signals.slice().sort((a, b) => a.delta - b.delta);
  const weakest = byMove[0], strongest = byMove[byMove.length - 1];
  const SIGNAL_FOCUS: Record<string, string> = { "Availability": "avail", "Search Visibility": "rank", "Price Index": "price", "Content Completeness": "content", "Buy Box Presence": "avail" };
  const diagnosis = {
    headline: weakest.delta < 0 ? "Likely shelf signal: " + weakest.label.toLowerCase() : "Potential contributor: " + strongest.label.toLowerCase(),
    text: weakest.delta < 0
      ? weakest.label + " fell " + Math.abs(weakest.delta).toFixed(1) + " pts while " + strongest.label.toLowerCase() +
        " moved " + (strongest.delta >= 0 ? "up " : "down ") + Math.abs(strongest.delta).toFixed(1) +
        " pts over the same window. Observed change, not a confirmed cause."
      : strongest.label + " rose " + Math.abs(strongest.delta).toFixed(1) + " pts over the same window, with " +
        weakest.label.toLowerCase() + " the weakest signal at " + (weakest.delta >= 0 ? "+" : "−") +
        Math.abs(weakest.delta).toFixed(1) + " pts. Potential contributor to overall shelf performance.",
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
      problem: pricey.length + " high-volume products are priced materially above their own period average.",
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

export function fetchSales({ retailer = "all", period = "12w", dateRange = null }: { retailer?: string; period?: string; dateRange?: DateRange | null } = {}) {
  return new Promise<any>((resolve) => setTimeout(() => resolve(salesData(retailer, period, dateRange)), LATENCY));
}

export function fetchShelf({ retailer = "all", period = "12w", dateRange = null }: { retailer?: string; period?: string; dateRange?: DateRange | null } = {}) {
  return new Promise<any>((resolve) => setTimeout(() => resolve(shelfData(retailer, period, dateRange)), LATENCY));
}

export function fetchProduct(id: string, { retailer = "all", period = "12w", dateRange = null }: { retailer?: string; period?: string; dateRange?: DateRange | null } = {}) {
  return new Promise<any>((resolve, reject) => setTimeout(() => {
    const base = catalog.find((p) => p.id === id);
    if (!base) return reject(new Error("Product not found: " + id));
    /* Per-product real data (REAL_PRODUCT_WEEKLY) has a genuine Sep 1
       checkpoint, unlike the retailer-level Search Visibility rollup, so a
       date range matches against the full 5-point REAL_WEEK_DATES here
       (direct 0-4 indexing, no +1 offset needed). */
    const rangeMatch = dateRange ? matchRangeWeeks(dateRange, REAL_WEEK_DATES) : null;
    const key = retailer + "|" + period + (dateRange ? "|" + dateRange.start + ".." + dateRange.end : "");
    const p: any = withSalesMetrics(withShelfMetrics(productFor(base, key)), key);
    p.opportunity = scoreOpportunity(p);
    const labels = rangeMatch ? rangeMatch.idx.map((i) => REAL_WEEK_LABELS[i]) : labelsFor(period);
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
    /* "Last 4 weeks" is the one period the real September crawl can honestly
       fill end to end: 4 real weekly points (Sep 8/15/22/29) bucketed from
       the actual daily Price history and weekly Content snapshots, per
       product. Every other period keeps the synthetic jitter below, since
       there is no real history beyond this one month to draw from. Search
       rank stays synthetic in all periods — no reliable per-SKU crawled
       rank exists (see the Placement matching note). */
    const real = REAL_PRODUCT_WEEKLY[id];
    const useReal = !!real && (dateRange ? true : period === "4w");
    const realIdx = rangeMatch ? rangeMatch.idx : [1, 2, 3, 4];
    const trends = useReal
      ? {
          rank: series(seed + 1, n, clamp(p.searchRank + 3 * sw, 1, 40), p.searchRank, 1.2, 0).map((v) => clamp(Math.round(v), 1, 40)),
          price: realIdx.map((i) => real.price[i]),
          stock: realIdx.map((i) => real.stockRate[i]),
          rating: realIdx.map((i) => real.rating[i]),
          reviews: realIdx.map((i) => real.reviews[i]),
        }
      : {
          rank: series(seed + 1, n, clamp(p.searchRank + 3 * sw, 1, 40), p.searchRank, 1.2, 0).map((v) => clamp(Math.round(v), 1, 40)),
          price: series(seed + 2, n, round(p.price * (1 + 0.06 * sw), 2), p.price, p.price * 0.02, 2),
          stock: series(seed + 3, n, p.inStockRate - 3 * sw, p.inStockRate, 1.6, 1).map((v) => round(clamp(v, 40, 100), 1)),
          rating: series(seed + 4, n, round(p.rating - 0.12 * sw, 2), p.rating, 0.03, 2),
          reviews: series(seed + 5, n, p.reviews * 0.9, p.reviews, p.reviews * 0.008, 0),
        };
    resolve({
      product: p,
      labels,
      trends,
      dataSource: useReal ? "real" : "illustrative",
      dateRange: dateRange
        ? { start: dateRange.start, end: dateRange.end, matched: rangeMatch!.matched,
            note: rangeMatch!.matched ? null : "No crawl data for the exact range selected — showing the full Sep 1–29 crawl instead." }
        : null,
      /* Real where a genuine cross-retailer match exists in our own sample
         (same brand, >=45% name overlap — see CROSS_RETAILER_MATCH); honest
         "not tracked" everywhere else, instead of fabricating a "Live"
         listing for a SKU we have no evidence exists at that retailer. */
      retailerPerformance: retailers.slice(1).map((rt) => {
        if (rt.id === base.retailer) {
          return {
            retailer: rt.name, rank: p.searchRank, price: p.price, inStock: p.inStockRate,
            rating: p.rating, content: p.contentScore, listed: true, isSelf: true, matched: true,
          };
        }
        const matchId = CROSS_RETAILER_MATCH[id]?.[rt.id];
        const match = matchId ? (catalog as any[]).find((x) => x.id === matchId) : null;
        if (match) {
          const mp = withShelfMetrics(productFor(match, rt.id + "|" + period));
          return {
            retailer: rt.name, rank: mp.searchRank, price: mp.price, inStock: mp.inStockRate,
            rating: mp.rating, content: mp.contentScore, listed: true, isSelf: false, matched: true,
          };
        }
        return {
          retailer: rt.name, rank: null, price: null, inStock: null, rating: null, content: null,
          listed: false, isSelf: false, matched: false,
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
      note: REAL_BUYBOX_COMPETITOR[id]
        ? "Buy box won by " + REAL_BUYBOX_COMPETITOR[id].seller + " for " + REAL_BUYBOX_COMPETITOR[id].daysWon + " of 30 tracked days."
        : p.buyBox
        ? "Buy box held for the full period."
        : "Buy box lost for " + (1 + Math.round(r() * 4)) + " days in the period.",
    });
  }, LATENCY));
}

export function toCsv(rows: any[]) {
  const cols = ["SKU", "Product", "Brand", "Category", "Retailer", "Search Rank", "Rank Delta", "Search Visibility %", "Price", "Price Index", "Stock Status", "In Stock %", "Rating", "Reviews", "Content Completeness", "Shelf Score", "Opportunity"];
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
