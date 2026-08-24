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

/* Retailers, catalog and category codes below are not synthetic — they are a
   36-SKU slice of the real September 2022 Profitero-style crawl in
   data/September/ (Content, Price, Share of Search), picked per retailer for
   clean 5/5 weekly snapshot coverage. See reports/shelfline_assessment.pdf
   for the full data audit this slice is drawn from. Everything below this
   block (rng/series/derivation helpers) still adds period-over-period jitter
   around these real base values — the September crawl is a single snapshot,
   not a live feed, so per-period movement is illustrative, not re-crawled. */

export const retailers = [
  { id: "all", name: "All retailers" },
  { id: "r1", name: "Amazon.com" },
  { id: "r2", name: "Chewy" },
  { id: "r3", name: "Walmart" },
  { id: "r4", name: "The Home Depot" },
  { id: "r5", name: "PetSmart" },
  { id: "r6", name: "Lowe's" },
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
  { id: "r1-B07BVL8TQF", name: "Good'N'Fun Triple Flavored Rawhide Kabobs for Dogs", brand: "Good'n'Fun", category: "GPC", retailer: "r1", rank: 1, price: 14.23, rating: 4.8, reviews: 47521, content: 100, stockBias: 1.0, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "r1::GPC" },
  { id: "r1-B08VXNT9DW", name: "Remington Ultrastyle Rechargeable Total Grooming Kit, PG6111, Teal/Green", brand: "Remington", category: "HPC", retailer: "r1", rank: 1, price: 16.99, rating: 4.5, reviews: 45535, content: 80, stockBias: 0.9, buyBoxRate: 1.0, priceChangePct: -0.6, priceGroup: "Amazon.com::beard & mustache trimmers" },
  { id: "r1-B00H2B4H2M", name: "Remington All-in-One Grooming Kit, Lithium Powered, 8 Piece Set with Trimmer, Men's S", brand: "Remington", category: "HPC", retailer: "r1", rank: 2, price: 20.99, rating: 4.5, reviews: 45534, content: 68, stockBias: 1.0, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "Amazon.com::beard & mustache trimmers" },
  { id: "r1-B01GJOMWVA", name: "Black+Decker CM1160B 12-Cup Programmable Coffee Maker, Black/Stainless Steel", brand: "BLACK+DECKER", category: "HPC", retailer: "r1", rank: 3, price: 19.74, rating: 4.5, reviews: 43039, content: 100, stockBias: 1.0, buyBoxRate: 1.0, priceChangePct: -34.2, priceGroup: "Amazon.com::coffee machines" },
  { id: "r1-B01GJOMWYC", name: "Black+Decker CM1160W-1 CM1160W 12-Cup Programmable Coffeemaker, White/Stainless Steel", brand: "BLACK+DECKER", category: "HPC", retailer: "r1", rank: 4, price: 29.81, rating: 4.5, reviews: 43039, content: 100, stockBias: 1.0, buyBoxRate: 0.97, priceChangePct: 1.9, priceGroup: "Amazon.com::coffee machines" },
  { id: "r1-B002LAREDS", name: "Black+Decker DLX1050B 12-Cup Programmable Coffeemaker", brand: "BLACK+DECKER", category: "HPC", retailer: "r1", rank: 5, price: 33.24, rating: 4.5, reviews: 43039, content: 88, stockBias: 1.0, buyBoxRate: 0.97, priceChangePct: 4.8, priceGroup: "Amazon.com::coffee machines" },
  { id: "r1-B00MMRFUG8", name: "Remington D3190 Damage Protection Hair Dryer with Ceramic + Ionic + Tourmaline Techno", brand: "Remington", category: "HPC", retailer: "r1", rank: 6, price: 19.16, rating: 4.6, reviews: 41347, content: 80, stockBias: 1.0, buyBoxRate: 1.0, priceChangePct: 12.4, priceGroup: "r1::HPC" },
  { id: "r1-B016Y8JSR2", name: "BLACK+DECKER 14-Cup Cooked/7-Cup Uncooked Rice Cooker and Food Steamer, White", brand: "BLACK+DECKER", category: "HPC", retailer: "r1", rank: 7, price: 52.5, rating: 4.5, reviews: 40288, content: 100, stockBias: 1.0, buyBoxRate: 0.0, priceChangePct: -10.6, priceGroup: "Amazon.com::rice cookers" },
  { id: "r1-B01B7D3YW4", name: "BLACK+DECKER, White RC5280 28 Cup Rice Cooker", brand: "BLACK+DECKER", category: "HPC", retailer: "r1", rank: 8, price: 28.53, rating: 4.5, reviews: 40288, content: 96, stockBias: 1.0, buyBoxRate: 1.0, priceChangePct: -5.1, priceGroup: "Amazon.com::rice cookers" },
  { id: "r1-B016Y8JSC2", name: "BLACK+DECKER 16-Cup Cooked/8-Cup Uncooked Rice Cooker and Food Steamer, White", brand: "BLACK+DECKER", category: "HPC", retailer: "r1", rank: 9, price: 22.44, rating: 4.5, reviews: 40286, content: 100, stockBias: 1.0, buyBoxRate: 1.0, priceChangePct: 6.6, priceGroup: "Amazon.com::rice cookers" },
  { id: "r1-B016Y8JSK4", name: "BLACK+DECKER Rice Cooker, 6-cup, White", brand: "BLACK+DECKER", category: "HPC", retailer: "r1", rank: 10, price: 15.4, rating: 4.5, reviews: 40286, content: 100, stockBias: 1.0, buyBoxRate: 1.0, priceChangePct: -12.5, priceGroup: "Amazon.com::rice cookers" },
  { id: "r1-B003S516XO", name: "Remington S5500 1\" Anti-Static Flat Iron with Floating Ceramic Plates and Digital Con", brand: "Remington", category: "HPC", retailer: "r1", rank: 11, price: 18.66, rating: 4.6, reviews: 36652, content: 100, stockBias: 1.0, buyBoxRate: 1.0, priceChangePct: 3.7, priceGroup: "r1::HPC" },
  { id: "r1-B00OYHF7RQ", name: "Marineland Penguin Bio-Wheel Power Filter", brand: "MarineLand", category: "GPC", retailer: "r1", rank: 2, price: 20.69, rating: 4.4, reviews: 36407, content: 68, stockBias: 1.0, buyBoxRate: 1.0, priceChangePct: -5.9, priceGroup: "Amazon.com::filter accessories" },
  { id: "r1-B004N59OFU", name: "Repel 94109 HG-94109 Lemon Eucalyptus Natural Insect, 4-Ounce Pump Spray, 1 pack, Yel", brand: "Repel", category: "HG", retailer: "r1", rank: 1, price: 4.97, rating: 4.4, reviews: 36143, content: 80, stockBias: 1.0, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "Amazon.com::sprays" },
  { id: "r1-B010AFV1LQ", name: "Repel Plant-Based Lemon Eucalyptus Insect Repellent, Mosquito Repellent, Pump Spray, ", brand: "Repel", category: "HG", retailer: "r1", rank: 2, price: 15.37, rating: 4.4, reviews: 36143, content: 80, stockBias: 1.0, buyBoxRate: 0.97, priceChangePct: 9.9, priceGroup: "Amazon.com::sprays" },
  { id: "r1-B000HHLHDK", name: "Tetra Whisper Bio-Bag Filter Cartridges for Aquariums - Ready to Use", brand: "Tetra", category: "GPC", retailer: "r1", rank: 3, price: 2.09, rating: 4.7, reviews: 36110, content: 80, stockBias: 1.0, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "Amazon.com::filter accessories" },
  { id: "r1-B07MZMLZZ3", name: "FURminator Undercoat Deshedding Tool for Dogs, Deshedding Brush for Dogs, Removes Loo", brand: "FURminator", category: "GPC", retailer: "r1", rank: 4, price: 35.9, rating: 4.7, reviews: 34668, content: 80, stockBias: 0.47, buyBoxRate: 0.07, priceChangePct: 5.9, priceGroup: "r1::GPC" },
  { id: "r1-B0009YF4FI", name: "Tetra Whisper Easy to Use Air Pump for Aquariums (Non-UL)", brand: "Tetra", category: "GPC", retailer: "r1", rank: 5, price: 10.15, rating: 4.6, reviews: 34222, content: 72, stockBias: 1.0, buyBoxRate: 1.0, priceChangePct: -0.6, priceGroup: "r1::GPC" },
  { id: "r2-303600", name: "SMARTBONES SmartSticks Peanut Butter Dog Treats, 12 count", brand: "SmartBones", category: "GPC", retailer: "r2", rank: 1, price: 10.09, rating: 4.5, reviews: 3621, content: 76, stockBias: 1.0, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "chewy.com::hard chews" },
  { id: "r2-47575", name: "NATURE'S MIRACLE Just For Cats Advanced Hooded Corner Cat Litter Box", brand: "Nature's Miracle", category: "GPC", retailer: "r2", rank: 2, price: 37.95, rating: 4.6, reviews: 2459, content: 88, stockBias: 1.0, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "chewy.com::covered" },
  { id: "r2-129721", name: "GOOD 'N' FUN Triple Flavor Kabobs Chicken, Duck & Chicken Liver Dog Chews, 18 count", brand: "Good 'n' Fun", category: "GPC", retailer: "r2", rank: 3, price: 10.5, rating: 4.8, reviews: 1666, content: 80, stockBias: 1.0, buyBoxRate: 1.0, priceChangePct: -0.2, priceGroup: "chewy.com::rawhide" },
  { id: "r2-107282", name: "SMARTBONES Skin & Coat Care Chicken Chews Dog Treats, 16 pack", brand: "SmartBones", category: "GPC", retailer: "r2", rank: 4, price: 8.44, rating: 4.4, reviews: 1106, content: 80, stockBias: 1.0, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "chewy.com::hard chews" },
  { id: "r2-107286", name: "SMARTBONES SmartSticks Chamomile & Lavender Extract Flavor Chews Dog Treats, 16 count", brand: "SmartBones", category: "GPC", retailer: "r2", rank: 5, price: 6.74, rating: 4.1, reviews: 1041, content: 76, stockBias: 1.0, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "chewy.com::hard chews" },
  { id: "r2-53154", name: "SMARTBONES SmartSticks Chicken Chews Dog Treats, 10 count", brand: "SmartBones", category: "GPC", retailer: "r2", rank: 6, price: 7.2, rating: 4.4, reviews: 905, content: 72, stockBias: 1.0, buyBoxRate: 1.0, priceChangePct: -10.7, priceGroup: "chewy.com::hard chews" },
  { id: "r2-56726", name: "FIRSTRAX Noz2Noz Sof-Krate N2 Series 3-Door Collapsible Soft-Sided Dog Crate, 26 inch", brand: "Firstrax", category: "GPC", retailer: "r2", rank: 7, price: 63.3, rating: 4.5, reviews: 897, content: 92, stockBias: 1.0, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "chewy.com::crates & kennels" },
  { id: "r2-52987", name: "SMARTBONES Mini Peanut Butter Chew Bones Dog Treats, 24 count", brand: "SmartBones", category: "GPC", retailer: "r2", rank: 8, price: 11.0, rating: 4.8, reviews: 781, content: 80, stockBias: 1.0, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "chewy.com::hard chews" },
  { id: "r2-191386", name: "NATURE'S MIRACLE Silver Oval Hooded Litter Box", brand: "Nature's Miracle", category: "GPC", retailer: "r2", rank: 9, price: 29.55, rating: 4.4, reviews: 745, content: 96, stockBias: 1.0, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "chewy.com::covered" },
  { id: "r2-323545", name: "NATURE'S MIRACLE Fresh & Clean Deodorizing Dog Bath Wipes, 25 count", brand: "Nature's Miracle", category: "GPC", retailer: "r2", rank: 10, price: 5.95, rating: 4.4, reviews: 674, content: 100, stockBias: 1.0, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "r2::GPC" },
  { id: "r2-47595", name: "NATURE'S MIRACLE Disposable Cat Litter Box, Regular, 3 count", brand: "Nature's Miracle", category: "GPC", retailer: "r2", rank: 11, price: 15.99, rating: 4.2, reviews: 646, content: 92, stockBias: 1.0, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "r2::GPC" },
  { id: "r2-40181", name: "FURMINATOR Nail Grinder For Dogs & Cats", brand: "FURminator", category: "GPC", retailer: "r2", rank: 12, price: 24.99, rating: 3.5, reviews: 635, content: 92, stockBias: 1.0, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "r2::GPC" },
  { id: "r2-52982", name: "SMARTBONES Mini Chicken Chew Bones Dog Treats, 24 count", brand: "SmartBones", category: "GPC", retailer: "r2", rank: 13, price: 11.02, rating: 4.7, reviews: 621, content: 80, stockBias: 1.0, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "chewy.com::hard chews" },
  { id: "r2-51634", name: "NATURE'S MIRACLE No More Marking Pet Stain & Odor Remover, 1-gal bottle", brand: "Nature's Miracle", category: "GPC", retailer: "r2", rank: 14, price: 34.21, rating: 3.4, reviews: 607, content: 96, stockBias: 1.0, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "r2::GPC" },
  { id: "r2-47652", name: "NATURE'S MIRACLE Jaw Dog Pooper Scooper, Jumbo", brand: "Nature's Miracle", category: "GPC", retailer: "r2", rank: 15, price: 22.94, rating: 4.5, reviews: 532, content: 79, stockBias: 1.0, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "r2::GPC" },
  { id: "r2-131749", name: "DINGO Twist Sticks Chicken in the Middle Dog Rawhide Treats, 50 count", brand: "Dingo", category: "GPC", retailer: "r2", rank: 16, price: 14.49, rating: 4.6, reviews: 520, content: 80, stockBias: 1.0, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "chewy.com::rawhide" },
  { id: "r2-128260", name: "SMARTBONES Stuffed Twistz Peanut Butter Chews Dog Treats, 6 count", brand: "SmartBones", category: "GPC", retailer: "r2", rank: 17, price: 7.58, rating: 4.6, reviews: 490, content: 68, stockBias: 1.0, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "chewy.com::hard chews" },
  { id: "r2-192722", name: "GOOD 'N' FUN Triple Flavor Wings Beef, Pork & Chicken Dog Chews, 12-oz bag", brand: "Good 'n' Fun", category: "GPC", retailer: "r2", rank: 18, price: 12.26, rating: 4.8, reviews: 467, content: 76, stockBias: 1.0, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "chewy.com::rawhide" },
  { id: "r2-56736", name: "FIRSTRAX Petnation Port-A-Crate E Series Double Door Collapsible Soft-Sided Dog Crate", brand: "Firstrax", category: "GPC", retailer: "r2", rank: 19, price: 105.99, rating: 4.3, reviews: 464, content: 100, stockBias: 1.0, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "chewy.com::crates & kennels" },
  { id: "r2-107284", name: "SMARTBONES Hip & Joint Care Chicken Chews Dog Treats, 16 pack", brand: "SmartBones", category: "GPC", retailer: "r2", rank: 20, price: 9.89, rating: 4.6, reviews: 445, content: 68, stockBias: 1.0, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "chewy.com::hard chews" },
  { id: "r4-313473640", name: "Weed and Grass Concentrate and Ready to Use Bundle Pack", brand: "Spectracide", category: "HG", retailer: "r4", rank: 1, price: 33.25, rating: 4.2, reviews: 4734, content: 80, stockBias: 1.0, buyBoxRate: 0.0, priceChangePct: -2.8, priceGroup: "Homedepot.com::weed & grass killer" },
  { id: "r4-311330332", name: "1 Gal. Concentrate Weed and Grass Killer", brand: "Spectracide", category: "HG", retailer: "r4", rank: 2, price: 47.55, rating: 4.2, reviews: 3134, content: 96, stockBias: 0.3, buyBoxRate: 0.0, priceChangePct: 0.0, priceGroup: "Homedepot.com::weed & grass killer" },
  { id: "r4-205755526", name: "Weed and Grass Killer 32 oz. Concentrate", brand: "Spectracide", category: "HG", retailer: "r4", rank: 3, price: 17.47, rating: 4.2, reviews: 3134, content: 96, stockBias: 1.0, buyBoxRate: 0.0, priceChangePct: 0.0, priceGroup: "Homedepot.com::weed & grass killer" },
  { id: "r4-100211822", name: "32 fl. oz. Concentrate Backyard Bug Control Spray", brand: "Cutter", category: "HG", retailer: "r4", rank: 4, price: 8.97, rating: 3.9, reviews: 2942, content: 100, stockBias: 1.0, buyBoxRate: 0.0, priceChangePct: -10.2, priceGroup: "Homedepot.com::bug killer spray" },
  { id: "r4-313473669", name: "Triazicide Insect Killer and Weed and Feed Ready to Spray Bundle Pack", brand: "Spectracide", category: "HG", retailer: "r4", rank: 5, price: 22.57, rating: 3.8, reviews: 2785, content: 80, stockBias: 1.0, buyBoxRate: 0.0, priceChangePct: 0.0, priceGroup: "Homedepot.com::bug killer spray" },
  { id: "r4-100578850", name: "20 oz. Wasp and Hornet Aerosol Spray Killer", brand: "Spectracide", category: "HG", retailer: "r4", rank: 6, price: 3.47, rating: 4, reviews: 2760, content: 96, stockBias: 1.0, buyBoxRate: 0.0, priceChangePct: 0.0, priceGroup: "Homedepot.com::bug killer spray" },
  { id: "r4-203131746", name: "Aerosol Wasp and Hornet Killer Spray (2-Count)", brand: "Spectracide", category: "HG", retailer: "r4", rank: 7, price: 6.97, rating: 4, reviews: 2757, content: 96, stockBias: 0.53, buyBoxRate: 0.0, priceChangePct: 0.0, priceGroup: "Homedepot.com::bug killer spray" },
  { id: "r4-313861639", name: "20 oz. Wasp and Hornet Killer Aerosol (12-Pack)", brand: "Spectracide", category: "HG", retailer: "r4", rank: 8, price: 32.16, rating: 4, reviews: 2669, content: 76, stockBias: 0.5, buyBoxRate: 0.0, priceChangePct: 0.0, priceGroup: "Homedepot.com::bug killer spray" },
  { id: "r4-205844053", name: "1 Gal. Ready-to-Use Deer and Rabbit Repellent", brand: "Liquid Fence", category: "HG", retailer: "r4", rank: 9, price: 24.97, rating: 3.8, reviews: 2495, content: 96, stockBias: 1.0, buyBoxRate: 0.0, priceChangePct: 0.0, priceGroup: "Homedepot.com::animal repellents" },
  { id: "r4-205844055", name: "32 oz. Ready-to-Use Deer and Rabbit Repellent", brand: "Liquid Fence", category: "HG", retailer: "r4", rank: 10, price: 14.97, rating: 3.8, reviews: 2495, content: 96, stockBias: 1.0, buyBoxRate: 0.0, priceChangePct: 7.2, priceGroup: "Homedepot.com::animal repellents" },
  { id: "r4-100352378", name: "32 oz. 7,500 sq. ft. Spring Ready-to-Spray Concentrate Weed and Feed Lawn Fertilizer", brand: "Vigoro", category: "HG", retailer: "r4", rank: 11, price: 12.97, rating: 3.7, reviews: 2163, content: 100, stockBias: 1.0, buyBoxRate: 0.0, priceChangePct: 0.0, priceGroup: "Homedepot.com::lawn fertilizers" },
  { id: "r4-204706227", name: "32 oz. 3,500 sq. ft. All Season Ready-to-Spray Concentrate Lawn Fertilizer", brand: "Vigoro", category: "HG", retailer: "r4", rank: 12, price: 9.98, rating: 3.7, reviews: 2163, content: 100, stockBias: 0.0, buyBoxRate: 0.0, priceChangePct: 0.0, priceGroup: "Homedepot.com::lawn fertilizers" },
  { id: "r4-315285692", name: "Bug Stop Home Barrier 0.5 gal with Flip & Go Sprayer", brand: "Spectracide", category: "HG", retailer: "r4", rank: 13, price: 10.96, rating: 4.1, reviews: 2030, content: 80, stockBias: 0.0, buyBoxRate: 0.0, priceChangePct: 0.2, priceGroup: "Homedepot.com::bug killer spray" },
  { id: "r4-203842344", name: "Bug Stop 1 gal. RTU Home Insect Control", brand: "Spectracide", category: "HG", retailer: "r4", rank: 14, price: 6.97, rating: 4.1, reviews: 2009, content: 72, stockBias: 1.0, buyBoxRate: 0.0, priceChangePct: 0.0, priceGroup: "Homedepot.com::bug killer spray" },
  { id: "r4-206498775", name: "Bug Stop 32 oz. Ready-to-Use Indoor Plus Outdoor Home Insect Control", brand: "Spectracide", category: "HG", retailer: "r4", rank: 15, price: 4.47, rating: 4.1, reviews: 2009, content: 76, stockBias: 0.77, buyBoxRate: 0.0, priceChangePct: 19.2, priceGroup: "Homedepot.com::bug killer spray" },
  { id: "r4-202056480", name: "20 lbs. Triazicide Lawn Insect Killer Granules", brand: "Spectracide", category: "HG", retailer: "r4", rank: 16, price: 16.68, rating: 4.2, reviews: 1953, content: 96, stockBias: 0.0, buyBoxRate: 0.0, priceChangePct: 0.0, priceGroup: "r4::HG" },
  { id: "r4-100352290", name: "Indoor Fogger Insect Killer Aerosol (6-Count)", brand: "Real-Kill", category: "HG", retailer: "r4", rank: 17, price: 9.97, rating: 3.7, reviews: 1938, content: 80, stockBias: 1.0, buyBoxRate: 0.0, priceChangePct: 0.0, priceGroup: "Homedepot.com::bug foggers" },
  { id: "r4-202561604", name: "Bed Bug and Flea Killer Aerosol Fogger (3-Count)", brand: "Hot Shot", category: "HG", retailer: "r4", rank: 18, price: 10.97, rating: 3.6, reviews: 1811, content: 100, stockBias: 1.0, buyBoxRate: 0.0, priceChangePct: 0.0, priceGroup: "Homedepot.com::bug foggers" },
  { id: "r6-50040952", name: "Spectracide Bug Stop Home Barrier 1-Gallon Home Pest Control Trigger Spray", brand: "Spectracide", category: "HG", retailer: "r6", rank: 1, price: 6.98, rating: 4, reviews: 1668, content: 80, stockBias: 0.0, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "Lowes.com::pesticides" },
  { id: "r6-1000373169", name: "Spectracide Weed and Grass Killer 1-Gallon Trigger Spray Weed and Grass Killer", brand: "Spectracide", category: "HG", retailer: "r6", rank: 2, price: 8.48, rating: 4.5, reviews: 1604, content: 76, stockBias: 0.07, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "Lowes.com::weed killers" },
  { id: "r6-50243433", name: "Spectracide AccuShot Sprayer 1.3-Gallon Ready to Use Weed and Grass Killer", brand: "Spectracide", category: "HG", retailer: "r6", rank: 3, price: 17.98, rating: 4.5, reviews: 1604, content: 100, stockBias: 0.03, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "Lowes.com::weed killers" },
  { id: "r6-999989720", name: "Spectracide Ready-to-Use 32-oz Trigger Spray Lawn Weed Killer", brand: "Spectracide", category: "HG", retailer: "r6", rank: 4, price: 4.98, rating: 4.5, reviews: 1604, content: 100, stockBias: 0.03, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "Lowes.com::weed killers" },
  { id: "r6-50260191", name: "Spectracide Weed and Grass Killer AccuShot Refill 1.3-Gallon Refill Weed and Grass Ki", brand: "Spectracide", category: "HG", retailer: "r6", rank: 5, price: 11.48, rating: 4.5, reviews: 1570, content: 100, stockBias: 0.07, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "Lowes.com::weed killers" },
  { id: "r6-999930408", name: "Spectracide Weed and Grass Killer with AccuShot Sprayer 1-Gallon Ready to Use Weed an", brand: "Spectracide", category: "HG", retailer: "r6", rank: 6, price: 14.98, rating: 4.5, reviews: 1570, content: 80, stockBias: 0.0, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "Lowes.com::weed killers" },
  { id: "r6-1003171818", name: "Spectracide Bug Stop Flip and Go 64-fl oz Home Pest Control Ready to Use", brand: "Spectracide", category: "HG", retailer: "r6", rank: 7, price: 11.28, rating: 4, reviews: 1535, content: 80, stockBias: 0.1, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "Lowes.com::pesticides" },
  { id: "r6-1000309991", name: "Spectracide Bug Stop Home Barrier Refill 1.33-Gallon (s) Home Pest Control Refill", brand: "Spectracide", category: "HG", retailer: "r6", rank: 8, price: 8.48, rating: 4, reviews: 1514, content: 80, stockBias: 0.03, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "Lowes.com::pesticides" },
  { id: "r6-1000309995", name: "Spectracide Bug Stop Home Barrier 32-fl oz Home Pest Control Trigger Spray", brand: "Spectracide", category: "HG", retailer: "r6", rank: 9, price: 4.98, rating: 4, reviews: 1514, content: 80, stockBias: 0.03, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "Lowes.com::pesticides" },
  { id: "r6-50328417", name: "Spectracide Bug Stop Home Barrier AccuShot Sprayer 1.33-Gallon (s) Home Pest Control ", brand: "Spectracide", category: "HG", retailer: "r6", rank: 10, price: 14.48, rating: 4, reviews: 1514, content: 80, stockBias: 0.03, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "Lowes.com::pesticides" },
  { id: "r6-50236519", name: "Spectracide Triazicide Insect Killer For Lawns Granules 10-lb Insect Killer", brand: "Spectracide", category: "HG", retailer: "r6", rank: 11, price: 7.98, rating: 4.5, reviews: 1476, content: 96, stockBias: 0.03, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "Lowes.com::pesticides" },
  { id: "r6-1000769722", name: "Spectracide Weed Stop For Lawns Concentrate 40-fl oz Concentrated All-purpose", brand: "Spectracide", category: "HG", retailer: "r6", rank: 12, price: 7.48, rating: 4, reviews: 1365, content: 80, stockBias: 0.0, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "Lowes.com::weed killers" },
  { id: "r6-50065981", name: "Spectracide Weed and Grass Killer Concentrate 40-oz Concentrated Weed and Grass Kille", brand: "Spectracide", category: "HG", retailer: "r6", rank: 13, price: 17.48, rating: 4.5, reviews: 1184, content: 96, stockBias: 0.0, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "Lowes.com::weed killers" },
  { id: "r6-5005476109", name: "Spectracide Weed and Grass Killer, Flip and Go Ready to Use Weed and Grass Killer", brand: "Spectracide", category: "HG", retailer: "r6", rank: 14, price: 14.28, rating: 4.5, reviews: 1168, content: 92, stockBias: 0.07, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "Lowes.com::weed killers" },
  { id: "r6-4736729", name: "Spectracide Weed Stop For Lawns Plus Crabgrass Killer 32-fl oz Hose End Sprayer Conce", brand: "Spectracide", category: "HG", retailer: "r6", rank: 15, price: 9.98, rating: 4, reviews: 1168, content: 100, stockBias: 0.0, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "Lowes.com::weed killers" },
  { id: "r6-1000321887", name: "Spectracide 40-fl oz Concentrated Lawn Weed Killer", brand: "Spectracide", category: "HG", retailer: "r6", rank: 16, price: 8.98, rating: 4, reviews: 1167, content: 100, stockBias: 0.0, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "Lowes.com::weed killers" },
  { id: "r6-999912917", name: "Spectracide 32-fl oz Concentrated Weed and Grass Killer", brand: "Spectracide", category: "HG", retailer: "r6", rank: 17, price: 17.48, rating: 4.5, reviews: 1152, content: 96, stockBias: 0.0, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "Lowes.com::weed killers" },
  { id: "r6-50328425", name: "Spectracide Weed Stop For Lawns 32-oz Concentrated Crabgrass Control", brand: "Spectracide", category: "HG", retailer: "r6", rank: 18, price: 8.98, rating: 4, reviews: 1121, content: 76, stockBias: 0.0, buyBoxRate: 1.0, priceChangePct: 6.0, priceGroup: "Lowes.com::weed killers" },
  { id: "r6-1000383881", name: "Hot Shot 2-oz Bed Bug Killer Fogger (3-Pack)", brand: "Hot Shot", category: "HG", retailer: "r6", rank: 19, price: 12.98, rating: 4.5, reviews: 943, content: 80, stockBias: 0.13, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "Lowes.com::pesticides" },
  { id: "r6-5001952515", name: "Spectracide Triazicide For Lawns Granules 20-lb Insect Killer", brand: "Spectracide", category: "HG", retailer: "r6", rank: 20, price: 13.98, rating: 4.5, reviews: 893, content: 100, stockBias: 0.1, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "Lowes.com::pesticides" },
  { id: "r5-5230281", name: "Tetra HT Submersible Aquarium Heater | Fish heaters | PetSmart", brand: "Tetra", category: "GPC", retailer: "r5", rank: 1, price: 10.99, rating: 2.5, reviews: 301, content: 39, stockBias: 1.0, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "r5::GPC" },
  { id: "r5-5174325", name: "Nature's Miracle® Natural Care Clumping Corn Cat Litter - Lightweight, Low Dust, Nat", brand: "Nature's Miracle", category: "GPC", retailer: "r5", rank: 2, price: 21.69, rating: 3.7, reviews: 281, content: 52, stockBias: 1.0, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "r5::GPC" },
  { id: "r5-5154527", name: "Marineland® 10 Gallon BioWheel LED Aquarium Kit | Fish starter kits | PetSmart", brand: "Marineland", category: "GPC", retailer: "r5", rank: 3, price: 99.99, rating: 3.1, reviews: 229, content: 83, stockBias: 1.0, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "Petsmart.com::starter kits" },
  { id: "r5-5248474", name: "Marineland® Modern LED Aquarium & Stand Ensemble - 60 Gallon | Fish aquariums | PetS", brand: "Marineland", category: "GPC", retailer: "r5", rank: 4, price: 329.99, rating: 3.5, reviews: 220, content: 92, stockBias: 1.0, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "Petsmart.com::aquariums" },
  { id: "r5-5306082", name: "Marineland® High Definition LED Ensemble - 75 Gallon | Fish aquariums | PetSmart", brand: "Marineland", category: "GPC", retailer: "r5", rank: 5, price: 499.99, rating: 4.0, reviews: 198, content: 64, stockBias: 1.0, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "Petsmart.com::aquariums" },
  { id: "r5-5158650", name: "Nature's Miracle® Advanced Hooded Cat Litter Box | Cat litter boxes | PetSmart", brand: "Nature's Miracle", category: "GPC", retailer: "r5", rank: 6, price: 32.99, rating: 3.8, reviews: 198, content: 39, stockBias: 1.0, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "Petsmart.com::litter boxes" },
  { id: "r5-48922", name: "FURminator® Short Hair Undercoat deShedding Dog Tool | Dog brushes combs & blowdryer", brand: "FURminator", category: "GPC", retailer: "r5", rank: 7, price: 28.28, rating: 4.7, reviews: 188, content: 72, stockBias: 1.0, buyBoxRate: 1.0, priceChangePct: -21.4, priceGroup: "r5::GPC" },
  { id: "r5-5084949", name: "Tetra® Whisper In Tank Power Aquarium Filters | Fish filters | PetSmart", brand: "Tetra", category: "GPC", retailer: "r5", rank: 8, price: 14.99, rating: 3.0, reviews: 187, content: 43, stockBias: 1.0, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "Petsmart.com::filters" },
  { id: "r5-5154528", name: "Marineland® BioWheel LED Aquarium Kit | Fish starter kits | PetSmart", brand: "Marineland", category: "GPC", retailer: "r5", rank: 9, price: 139.99, rating: 3.5, reviews: 179, content: 63, stockBias: 1.0, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "Petsmart.com::starter kits" },
  { id: "r5-5307990", name: "FURminator Dry Shampoo for Dogs - 7 Oz | Dog shampoos & conditioners | PetSmart", brand: "FURminator", category: "GPC", retailer: "r5", rank: 10, price: 10.99, rating: 4.8, reviews: 171, content: 76, stockBias: 1.0, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "r5::GPC" },
  { id: "r5-5134180", name: "Nature's Miracle® No More Marking Pet Stain & Odor Remover Natural Repellent | Dog s", brand: "Nature's Miracle", category: "GPC", retailer: "r5", rank: 11, price: 12.32, rating: 3.0, reviews: 151, content: 72, stockBias: 1.0, buyBoxRate: 1.0, priceChangePct: -17.8, priceGroup: "r5::GPC" },
  { id: "r5-5286669", name: "Nature's Miracle® Multi-Cat Self-Cleaning Litter Box | Cat litter boxes | PetSmart", brand: "Nature's Miracle", category: "GPC", retailer: "r5", rank: 12, price: 199.99, rating: 2.1, reviews: 146, content: 76, stockBias: 1.0, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "Petsmart.com::litter boxes" },
  { id: "r5-5178067", name: "Nature's Miracle® High Sided Cat Litter Box | Cat litter boxes | PetSmart", brand: "Nature's Miracle", category: "GPC", retailer: "r5", rank: 13, price: 23.99, rating: 4.0, reviews: 141, content: 43, stockBias: 1.0, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "Petsmart.com::litter boxes" },
  { id: "r5-5154725", name: "Nature's Miracle® Pet Block Repellent Pet Spray | Dog deterrents | PetSmart", brand: "Nature's Miracle", category: "GPC", retailer: "r5", rank: 14, price: 7.17, rating: 1.7, reviews: 135, content: 48, stockBias: 1.0, buyBoxRate: 1.0, priceChangePct: -32.3, priceGroup: "r5::GPC" },
  { id: "r5-5094985", name: "Tetra® Whisper Aquarium Air Pump | Fish air & water pumps | PetSmart", brand: "Tetra", category: "GPC", retailer: "r5", rank: 15, price: 16.99, rating: 3.1, reviews: 131, content: 72, stockBias: 1.0, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "r5::GPC" },
  { id: "r5-5162190", name: "Marineland® LED Aquarium Light Bar | Fish lights | PetSmart", brand: "Marineland", category: "GPC", retailer: "r5", rank: 16, price: 35.39, rating: 2.1, reviews: 115, content: 76, stockBias: 1.0, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "r5::GPC" },
  { id: "r5-5099366", name: "Tetra® Whisper Bio Bag Cartridges | Fish filters | PetSmart", brand: "Tetra", category: "GPC", retailer: "r5", rank: 17, price: 2.09, rating: 3.4, reviews: 112, content: 68, stockBias: 1.0, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "Petsmart.com::filters" },
  { id: "r5-1031503", name: "Tetra® TetraMin Tropical Flakes Fish Food | Fish food | PetSmart", brand: "Tetra", category: "GPC", retailer: "r5", rank: 18, price: 7.69, rating: 4.8, reviews: 106, content: 72, stockBias: 1.0, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "r5::GPC" },
  { id: "r5-5272047", name: "Marineland® Polishing Internal Filter | Fish filters | PetSmart", brand: "Marineland", category: "GPC", retailer: "r5", rank: 19, price: 87.99, rating: 3.4, reviews: 96, content: 76, stockBias: 1.0, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "Petsmart.com::filters" },
  { id: "r5-5254042", name: "Nature's Miracle® Hooded Cat Litter Pan | Cat litter boxes | PetSmart", brand: "Nature's Miracle", category: "GPC", retailer: "r5", rank: 20, price: 32.99, rating: 4.2, reviews: 93, content: 72, stockBias: 1.0, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "Petsmart.com::litter boxes" },
  { id: "r3-46092119", name: "BLACK+DECKER 12-Cup* QuickTouch Programmable Coffeemaker, White, CM1060W", brand: "BLACK+DECKER", category: "HPC", retailer: "r3", rank: 1, price: 46.4, rating: 4.3, reviews: 3376, content: 100, stockBias: 0.0, buyBoxRate: 1.0, priceChangePct: 159.5, priceGroup: "r3::HPC" },
  { id: "r3-39791215", name: "BLACK+DECKER 4-Slice Toaster with Extra-Wide Slots, Black/Silver, TR1478BD", brand: "BLACK+DECKER", category: "HPC", retailer: "r3", rank: 2, price: 29.96, rating: 4.3, reviews: 2003, content: 80, stockBias: 1.0, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "Walmart.com::black + decker toasters" },
  { id: "r3-49840437", name: "Black+Decker, Easy Steam Compact Iron, IR02V-T", brand: "BLACK+DECKER", category: "HPC", retailer: "r3", rank: 3, price: 10.36, rating: 4.5, reviews: 1626, content: 80, stockBias: 1.0, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "r3::HPC" },
  { id: "r3-43966519", name: "George Foreman 15+ Serving Indoor, Outdoor Electric Grill, Gun Metal, GFO240GM", brand: "George Foreman", category: "GPC", retailer: "r3", rank: 1, price: 99.92, rating: 4.6, reviews: 1512, content: 96, stockBias: 0.67, buyBoxRate: 0.67, priceChangePct: 0.0, priceGroup: "Walmart.com::indoor grills" },
  { id: "r3-28920902", name: "George Foreman 4-Serving Removable Plate Electric Grill and Panini Press, Black, GRP1", brand: "George Foreman", category: "GPC", retailer: "r3", rank: 2, price: 20.0, rating: 4.5, reviews: 1451, content: 68, stockBias: 1.0, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "Walmart.com::indoor grills" },
  { id: "r3-200093306", name: "Good 'n' Fun Triple Flavor Kabobs Rawhide Dog Chews, 24 oz. (36 Count)", brand: "Good 'n' Fun", category: "GPC", retailer: "r3", rank: 3, price: 19.78, rating: 4.8, reviews: 1435, content: 60, stockBias: 1.0, buyBoxRate: 0.83, priceChangePct: 10.0, priceGroup: "Walmart.com::good n fun dog treats" },
  { id: "r3-981923626", name: "BLACK+DECKER 4-in-1 5-Cup* Coffeemaker, Black, CM0750B", brand: "BLACK+DECKER", category: "HPC", retailer: "r3", rank: 4, price: 48.95, rating: 4.2, reviews: 1356, content: 100, stockBias: 1.0, buyBoxRate: 0.0, priceChangePct: -0.1, priceGroup: "r3::HPC" },
  { id: "r3-20564657", name: "BLACK+DECKER 2-Slice Extra Wide Slot Toaster, Red, Silver, TR1278TRM", brand: "BLACK+DECKER", category: "HPC", retailer: "r3", rank: 5, price: 55.99, rating: 4.4, reviews: 1332, content: 80, stockBias: 0.5, buyBoxRate: 0.9, priceChangePct: 124.0, priceGroup: "Walmart.com::black + decker toasters" },
  { id: "r3-43920730", name: "Good 'n' Fun Triple Flavor Kabobs Snack for All Dogs, 18 count, 12.0 oz", brand: "Good 'n' Fun", category: "GPC", retailer: "r3", rank: 4, price: 10.98, rating: 4.8, reviews: 1227, content: 52, stockBias: 1.0, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "Walmart.com::good n fun dog treats" },
  { id: "r3-14978527", name: "Remington S5500 1\" Anti-Static Flat Iron with Floating Ceramic Plates and Digital Con", brand: "Remington", category: "HPC", retailer: "r3", rank: 6, price: 19.84, rating: 4.5, reviews: 1159, content: 76, stockBias: 1.0, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "r3::HPC" },
  { id: "r3-772119289", name: "BLACK+DECKER Easy Assembly 8-Cup Food Processor, Black, FP4200B", brand: "BLACK+DECKER", category: "HPC", retailer: "r3", rank: 7, price: 41.88, rating: 4.4, reviews: 1052, content: 100, stockBias: 1.0, buyBoxRate: 0.93, priceChangePct: 0.0, priceGroup: "r3::HPC" },
  { id: "r3-22569723", name: "Hot Shot Bedbug & Flea Fogger, 3 Count, 2 oz, with Nylar", brand: "Hot Shot", category: "HG", retailer: "r3", rank: 1, price: 13.6, rating: 4.1, reviews: 1049, content: 96, stockBias: 1.0, buyBoxRate: 0.93, priceChangePct: 0.0, priceGroup: "r3::HG" },
  { id: "r3-164464324", name: "Remington Lithium All-In-One Men's Grooming Kit, Black/Silver, PG6027", brand: "Remington", category: "HPC", retailer: "r3", rank: 8, price: 29.99, rating: 4.4, reviews: 1026, content: 60, stockBias: 0.83, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "r3::HPC" },
  { id: "r3-51822911", name: "BLACK+DECKER Fruit and Vegetable Juice Extractor with Space Saving Design, Black, JE2", brand: "BLACK+DECKER", category: "HPC", retailer: "r3", rank: 9, price: 49.98, rating: 4, reviews: 1001, content: 80, stockBias: 0.83, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "r3::HPC" },
  { id: "r3-51800328", name: "BLACK+DECKER Convection Countertop Oven, Stainless Steel, TO3000G", brand: "BLACK+DECKER", category: "HPC", retailer: "r3", rank: 10, price: 39.92, rating: 4.3, reviews: 963, content: 80, stockBias: 0.0, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "r3::HPC" },
  { id: "r3-16816451", name: "Black+Decker, Professional Steam Iron with Stainless Steel Soleplate, Purple, IR1350S", brand: "BLACK+DECKER", category: "HPC", retailer: "r3", rank: 11, price: 28.56, rating: 4.3, reviews: 951, content: 80, stockBias: 1.0, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "r3::HPC" },
  { id: "r3-14321489", name: "Remington SP390 Screens and Cutter Refills", brand: "Remington", category: "HPC", retailer: "r3", rank: 12, price: 21.15, rating: 4.3, reviews: 903, content: 60, stockBias: 0.83, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "r3::HPC" },
  { id: "r3-2684038", name: "BLACK+DECKER 3-in-1 Waffle Maker & Indoor Grill/Griddle, Stainless Steel, G48TD", brand: "BLACK+DECKER", category: "HPC", retailer: "r3", rank: 13, price: 88.99, rating: 3.9, reviews: 864, content: 80, stockBias: 1.0, buyBoxRate: 0.0, priceChangePct: -10.1, priceGroup: "r3::HPC" },
  { id: "r3-24194217", name: "DreamBone Peanut Butter Flavored Rawhide-Free Dry Dog Chews, Mini, 5.6 oz. (10 Count)", brand: "DreamBone", category: "GPC", retailer: "r3", rank: 5, price: 4.94, rating: 4.8, reviews: 856, content: 56, stockBias: 0.0, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "r3::GPC" },
  { id: "r3-213639374", name: "Remington All-In-One Grooming Kit, Trimmer, Clippers , Black, PG6024A", brand: "Remington", category: "HPC", retailer: "r3", rank: 14, price: 17.97, rating: 4.2, reviews: 806, content: 80, stockBias: 0.23, buyBoxRate: 1.0, priceChangePct: 0.0, priceGroup: "r3::HPC" },
];

export const competitorBrands = [
  { id: "c1", name: "Corvus Group", share: 36.1, skus: 148, price: 7.2, rating: 4.28, content: 90 },
  { id: "c2", name: "Palisade Foods", share: 25.2, skus: 96, price: 6.1, rating: 4.41, content: 84 },
  { id: "c3", name: "Northwind Labs", share: 11.8, skus: 62, price: 9.4, rating: 4.05, content: 71 },
  { id: "c4", name: "Selby & Co", share: 8.4, skus: 44, price: 5.8, rating: 3.96, content: 66 },
];

/* Real keyword strings pulled directly from the Share of Search file's
   `keyword` column for our 6 retailers — search `volume` and `ownRank` are
   not in the source data (no traffic/volume field exists anywhere in the
   crawl, per the data audit) and remain illustrative. */
export const keywordSet = [
  { id: "k1", term: "automatic cat litter box", volume: 90400, ownRank: 3 },
  { id: "k2", term: "10 gallon fish tank", volume: 60200, ownRank: 5 },
  { id: "k3", term: "chew bones for large dogs", volume: 40100, ownRank: 2 },
  { id: "k4", term: "12 cup coffee maker", volume: 74800, ownRank: 4 },
  { id: "k5", term: "2 slice toaster", volume: 33200, ownRank: 8 },
  { id: "k6", term: "beard and body trimmer for men", volume: 52600, ownRank: 6 },
  { id: "k7", term: "bug bombs for all insects indoor", volume: 28700, ownRank: 12 },
  { id: "k8", term: "bbq grills", volume: 45300, ownRank: 9 },
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
  { id: "n1", severity: "high", title: "Stock alert", text: "Spectracide Bug Stop Home Barrier out of stock all month at Lowe's", time: "12m ago", product: "r6-50040952" },
  { id: "n2", severity: "high", title: "Price alert", text: "BLACK+DECKER 12-Cup Coffeemaker jumped 159% at Walmart the same day it went out of stock", time: "38m ago", product: "r3-46092119" },
  { id: "n3", severity: "medium", title: "Buy box alert", text: "Weed and Grass Concentrate Bundle Pack has lost the buy box to third-party sellers all month at The Home Depot", time: "1h ago", product: "r4-313473640" },
  { id: "n4", severity: "medium", title: "Search alert", text: "Chewy returned zero ranked results for 59% of tracked keywords this period", time: "2h ago", product: "r2-303600" },
  { id: "n5", severity: "low", title: "Content opportunity", text: "47 products scored under 80 on content completeness across the portfolio", time: "5h ago", product: "r5-5230281" },
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

/* Derived from the real September crawl: sos = inverse of each retailer's own
   zero-result rate on tracked keywords (Share of Search); stock/rating/content
   = this retailer's average vs. the 36-SKU portfolio average (Content + Price
   Data). Chewy's -34.6 sos reflects a genuine finding — 59.5% of its tracked
   keyword searches returned zero ranked results, vs. 0% for Amazon. */
const RETAILER_BIAS: Record<string, { sos: number; stock: number; rating: number; content: number }> = {
  all: { sos: 0, stock: 0, rating: 0, content: 0 },
  r1: { sos: 5.0, stock: 22.3, rating: 0.38, content: 5.5 },    // Amazon.com
  r2: { sos: -54.5, stock: 25.8, rating: 0.25, content: 1.7 },  // Chewy
  r3: { sos: 4.6, stock: 0.2, rating: 0.22, content: -3.6 },    // Walmart
  r4: { sos: 1.4, stock: -1.4, rating: -0.21, content: 7.9 },   // The Home Depot
  r5: { sos: 0.6, stock: 25.8, rating: -0.74, content: -16.9 }, // PetSmart
  r6: { sos: -4.1, stock: -70.6, rating: 0.12, content: 6.8 },  // Lowe's
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

/* Price Index needs a documented comparison set (per the data audit) — the
   raw category code (GPC/HPC/HG) is a business-unit label, not a product
   taxonomy, so it mixes $7 dog treats with $500 aquarium ensembles. Peer
   groups below are hand-assigned per product (same product type, often
   cross-retailer) as the actual comparison set. */
const PEER_GROUP_AVG_PRICE: Record<string, number> = {};
for (const p of catalog as any[]) {
  const g = p.priceGroup as string;
  if (!PEER_GROUP_AVG_PRICE[g]) {
    const peers = (catalog as any[]).filter((x) => x.priceGroup === g);
    PEER_GROUP_AVG_PRICE[g] = peers.reduce((a, x) => a + x.price, 0) / peers.length;
  }
}

/* Real weekly time series (5 points: Sep 1/8/15/22/29, the actual Content
   Data crawl cadence) per product, bucketed from the real daily Price
   history (ISO-week aligned, per the data audit's own recommendation) and
   the real weekly Content snapshots. Used to draw genuinely real trend
   charts for the "Last 4 weeks" period; other periods still use synthetic
   jitter since September is the only month this crawl covers. */
export const REAL_WEEK_LABELS = ["Sep 1", "Sep 8", "Sep 15", "Sep 22", "Sep 29"];
export const REAL_SOS_WEEK_LABELS = ["Sep 6", "Sep 13", "Sep 20", "Sep 27"];

export const REAL_PRODUCT_WEEKLY: Record<string, {
  rating: number[]; reviews: number[]; price: number[]; stockRate: number[]; buyBoxRate: number[];
}> = {
  "r1-B07BVL8TQF": { rating: [4.8, 4.8, 4.8, 4.8, 4.8], reviews: [46471, 46674, 46850, 47245, 47521], price: [14.23, 14.23, 14.23, 14.22, 14.23], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r1-B08VXNT9DW": { rating: [4.5, 4.5, 4.5, 4.4, 4.5], reviews: [45031, 45125, 45224, 43875, 45535], price: [17.33, 16.99, 16.99, 16.99, 16.99], stockRate: [57.1, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r1-B00H2B4H2M": { rating: [4.5, 4.5, 4.5, 4.4, 4.5], reviews: [45031, 45124, 45224, 43882, 45534], price: [20.99, 20.39, 20.43, 20.82, 20.99], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r1-B01GJOMWVA": { rating: [4.5, 4.5, 4.5, 4.5, 4.5], reviews: [42091, 42278, 42450, 42794, 43039], price: [29.99, 20.07, 28.46, 22.86, 17.92], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r1-B01GJOMWYC": { rating: [4.5, 4.5, 4.5, 4.5, 4.5], reviews: [42091, 42278, 42450, 42794, 43039], price: [29.89, 27.24, 28.29, 29.41, 29.81], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [100, 100, 100, 100, 50] },
  "r1-B002LAREDS": { rating: [4.5, 4.5, 4.5, 4.5, 4.5], reviews: [42091, 42278, 42450, 42806, 43039], price: [30.42, 30.9, 31.58, 32.39, 32.72], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [100, 86, 100, 100, 100] },
  "r1-B00MMRFUG8": { rating: [4.6, 4.6, 4.6, 4.6, 4.6], reviews: [40988, 41051, 41078, 41247, 41347], price: [17.08, 19.16, 19.16, 19.16, 19.16], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r1-B016Y8JSR2": { rating: [4.5, 4.5, 4.5, 4.5, 4.5], reviews: [39416, 39588, 39763, 40008, 40288], price: [49.74, 27.18, 27.03, 35.46, 53.75], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [0, 0, 0, 0, 0] },
  "r1-B01B7D3YW4": { rating: [4.5, 4.5, 4.5, 4.5, 4.5], reviews: [39416, 39588, 39763, 40008, 40288], price: [30.24, 28.28, 30.19, 29.89, 28.53], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r1-B016Y8JSC2": { rating: [4.5, 4.5, 4.5, 4.5, 4.5], reviews: [39416, 39588, 39763, 40019, 40286], price: [23.8, 23.65, 25.57, 26.24, 24.84], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r1-B016Y8JSK4": { rating: [4.5, 4.5, 4.5, 4.5, 4.5], reviews: [39416, 39588, 39763, 40019, 40286], price: [18.08, 18.05, 18.05, 17.91, 16.25], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r1-B003S516XO": { rating: [4.6, 4.6, 4.6, 4.6, 4.6], reviews: [36142, 36218, 36320, 36499, 36652], price: [18.02, 19.12, 19.65, 19.05, 18.86], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r1-B00OYHF7RQ": { rating: [4.4, 4.4, 4.4, 4.4, 4.4], reviews: [35982, 36047, 36106, 36281, 36407], price: [21.99, 21.99, 21.98, 21.8, 20.69], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r1-B004N59OFU": { rating: [4.4, 4.4, 4.4, 4.4, 4.4], reviews: [35340, 35500, 35634, 35936, 36143], price: [4.97, 4.97, 4.97, 4.97, 4.97], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r1-B010AFV1LQ": { rating: [4.4, 4.4, 4.4, 4.4, 4.4], reviews: [35340, 35500, 35634, 35935, 36143], price: [13.93, 14.42, 14.94, 15.37, 15.37], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [100, 100, 86, 100, 100] },
  "r1-B000HHLHDK": { rating: [4.7, 4.7, 4.7, 4.7, 4.7], reviews: [35327, 35493, 35661, 35904, 36110], price: [2.09, 2.09, 2.09, 2.09, 2.09], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r1-B07MZMLZZ3": { rating: [4.7, 4.7, 4.7, 4.7, 4.7], reviews: [34279, 34420, 34342, 34513, 34668], price: [33.9, 39.67, 35.9, 35.9, 35.9], stockRate: [57.1, 57.1, 85.7, 0.0, 0.0], buyBoxRate: [20, 0, 0, 0, 0] },
  "r1-B0009YF4FI": { rating: [4.6, 4.6, 4.6, 4.6, 4.6], reviews: [33378, 33563, 33712, 33986, 34222], price: [9.85, 8.93, 9.97, 9.04, 10.15], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r2-303600": { rating: [4.486, 4.4846, 4.485, 4.4847, 4.4863], reviews: [3605, 3607, 3612, 3617, 3621], price: [10.09, 10.09, 10.09, 10.09, 10.09], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r2-47575": { rating: [4.602, 4.6021, 4.6021, 4.6021, 4.6007], reviews: [2457, 2458, 2458, 2458, 2459], price: [37.95, 37.95, 37.95, 37.95, 37.95], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r2-129721": { rating: [4.8156, 4.8157, 4.8157, 4.816, 4.8163], reviews: [1659, 1660, 1660, 1663, 1666], price: [10.52, 10.52, 10.52, 10.5, 10.5], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r2-107282": { rating: [4.3976, 4.3982, 4.3982, 4.3982, 4.3969], reviews: [1104, 1105, 1105, 1105, 1106], price: [8.44, 8.44, 8.44, 8.44, 8.44], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r2-107286": { rating: [4.1415, 4.1423, 4.1393, 4.1393, 4.1393], reviews: [1039, 1040, 1041, 1041, 1041], price: [6.74, 6.74, 6.74, 6.74, 6.74], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r2-53154": { rating: [4.3958, 4.392, 4.392, 4.3927, 4.3934], reviews: [902, 903, 903, 904, 905], price: [7.8, 7.2, 7.2, 7.2, 7.2], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r2-56726": { rating: [4.4585, 4.4585, 4.4559, 4.4554, 4.456], reviews: [892, 892, 895, 896, 897], price: [63.3, 63.3, 63.3, 63.3, 63.3], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r2-52987": { rating: [4.7599, 4.7603, 4.7603, 4.7603, 4.7554], reviews: [779, 780, 780, 780, 781], price: [11.0, 11.0, 11.0, 11.0, 11.0], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r2-191386": { rating: [4.4425, 4.4392, 4.4345, 4.4345, 4.4362], reviews: [739, 740, 741, 741, 745], price: [29.55, 29.55, 29.55, 29.55, 29.55], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r2-323545": { rating: [4.3884, 4.3902, 4.3902, 4.3902, 4.3902], reviews: [672, 674, 674, 674, 674], price: [5.95, 5.95, 5.95, 5.95, 5.95], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r2-47595": { rating: [4.2297, 4.2297, 4.2259, 4.2295, 4.2291], reviews: [640, 640, 642, 645, 646], price: [15.99, 15.99, 15.33, 14.33, 15.99], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r2-40181": { rating: [3.5142, 3.5142, 3.5102, 3.5102, 3.5102], reviews: [634, 634, 635, 635, 635], price: [24.99, 24.99, 24.99, 24.99, 24.99], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r2-52982": { rating: [4.6548, 4.6548, 4.6548, 4.6548, 4.6554], reviews: [620, 620, 620, 620, 621], price: [11.02, 11.02, 11.02, 11.02, 11.02], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r2-51634": { rating: [3.3818, 3.3818, 3.3779, 3.3806, 3.3806], reviews: [605, 605, 606, 607, 607], price: [34.21, 34.21, 34.21, 34.21, 34.21], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r2-47652": { rating: [4.4595, 4.4595, 4.4595, 4.4595, 4.4549], reviews: [531, 531, 531, 531, 532], price: [22.94, 22.94, 22.94, 22.94, 22.94], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r2-131749": { rating: [4.5692, 4.5692, 4.5692, 4.5692, 4.5692], reviews: [520, 520, 520, 520, 520], price: [14.49, 14.49, 14.49, 14.49, 14.49], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r2-128260": { rating: [4.5755, 4.5755, 4.5755, 4.5755, 4.5755], reviews: [490, 490, 490, 490, 490], price: [7.58, 7.58, 7.58, 7.58, 7.58], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r2-192722": { rating: [4.7537, 4.7537, 4.7537, 4.7537, 4.7537], reviews: [467, 467, 467, 467, 467], price: [12.26, 12.26, 12.26, 12.26, 12.26], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r2-56736": { rating: [4.2802, 4.2802, 4.2802, 4.2802, 4.2802], reviews: [464, 464, 464, 464, 464], price: [105.99, 105.99, 105.99, 105.99, 105.99], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r2-107284": { rating: [4.5631, 4.5631, 4.5631, 4.564, 4.564], reviews: [444, 444, 444, 445, 445], price: [9.89, 9.89, 9.89, 9.89, 9.89], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r4-313473640": { rating: [4.1, 4.2, 4.2, 4.2, 4.2], reviews: [4622, 4647, 4684, 4720, 4734], price: [34.2, 34.2, 34.2, 34.2, 33.25], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [0, 0, 0, 0, 0] },
  "r4-311330332": { rating: [4.2, 4.2, 4.2, 4.2, 4.2], reviews: [3093, 3104, 3120, 3128, 3134], price: [47.55, 47.55, 47.55, 48.26, 50.05], stockRate: [0.0, 71.4, 14.3, 14.3, 100.0], buyBoxRate: [0, 0, 0, 0, 0] },
  "r4-205755526": { rating: [4.2, 4.2, 4.2, 4.2, 4.2], reviews: [3093, 3104, 3120, 3128, 3134], price: [17.47, 17.47, 17.47, 17.47, 17.47], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [0, 0, 0, 0, 0] },
  "r4-100211822": { rating: [3.9, 3.9, 3.9, 3.9, 3.9], reviews: [2884, 2898, 2913, 2934, 2942], price: [9.99, 9.99, 9.99, 9.99, 9.48], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [0, 0, 0, 0, 0] },
  "r4-313473669": { rating: [3.8, 3.8, 3.8, 3.8, 3.8], reviews: [2706, 2722, 2745, 2766, 2785], price: [22.57, 22.57, 22.57, 22.57, 22.57], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [0, 0, 0, 0, 0] },
  "r4-100578850": { rating: [4, 4, 4, 4, 4], reviews: [2610, 2642, 2689, 2733, 2760], price: [3.47, 3.47, 3.47, 3.47, 3.47], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [0, 0, 0, 0, 0] },
  "r4-203131746": { rating: [4, 4, 4, 4, 4], reviews: [2607, 2639, 2686, 2730, 2757], price: [6.97, 6.97, 6.97, 6.97, 6.97], stockRate: [71.4, 57.1, 57.1, 14.3, 100.0], buyBoxRate: [0, 0, 0, 0, 0] },
  "r4-313861639": { rating: [3.9, 3.9, 3.9, 4, 4], reviews: [2519, 2551, 2598, 2642, 2669], price: [32.16, 32.16, 32.16, 32.16, 32.16], stockRate: [42.9, 28.6, 57.1, 85.7, 0.0], buyBoxRate: [0, 0, 0, 0, 0] },
  "r4-205844053": { rating: [3.8, 3.8, 3.8, 3.8, 3.8], reviews: [2421, 2426, 2455, 2485, 2495], price: [24.97, 24.97, 24.97, 24.97, 24.97], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [0, 0, 0, 0, 0] },
  "r4-205844055": { rating: [3.8, 3.8, 3.8, 3.8, 3.8], reviews: [2421, 2426, 2455, 2485, 2495], price: [13.97, 13.97, 13.97, 13.97, 14.47], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [0, 0, 0, 0, 0] },
  "r4-100352378": { rating: [3.7, 3.7, 3.7, 3.7, 3.7], reviews: [2114, 2123, 2141, 2155, 2163], price: [12.97, 12.97, 12.97, 12.97, 12.97], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [0, 0, 0, 0, 0] },
  "r4-204706227": { rating: [3.7, 3.7, 3.7, 3.7, 3.7], reviews: [2114, 2123, 2141, 2155, 2163], price: [9.98, 9.98, 9.98, 9.98, 9.98], stockRate: [0.0, 0.0, 0.0, 0.0, 0.0], buyBoxRate: [0, 0, 0, 0, 0] },
  "r4-315285692": { rating: [4.1, 4.1, 4.1, 4.1, 4.1], reviews: [1956, 1996, 2008, 2022, 2030], price: [10.94, 10.94, 10.94, 10.99, 11.12], stockRate: [0.0, 0.0, 0.0, 0.0, 0.0], buyBoxRate: [0, 0, 0, 0, 0] },
  "r4-203842344": { rating: [4.1, 4.1, 4.1, 4.1, 4.1], reviews: [1959, 1976, 1987, 2001, 2009], price: [6.97, 6.97, 6.97, 6.97, 6.97], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [0, 0, 0, 0, 0] },
  "r4-206498775": { rating: [4.1, 4.1, 4.1, 4.1, 4.1], reviews: [1959, 1976, 1987, 2001, 2009], price: [4.26, 4.47, 4.47, 4.47, 4.47], stockRate: [85.7, 71.4, 42.9, 100.0, 100.0], buyBoxRate: [0, 0, 0, 0, 0] },
  "r4-202056480": { rating: [4.2, 4.2, 4.2, 4.2, 4.2], reviews: [1889, 1900, 1930, 1948, 1953], price: [16.68, 16.68, 16.68, 16.68, 16.68], stockRate: [0.0, 0.0, 0.0, 0.0, 0.0], buyBoxRate: [0, 0, 0, 0, 0] },
  "r4-100352290": { rating: [3.7, 3.7, 3.7, 3.7, 3.7], reviews: [1893, 1903, 1919, 1929, 1938], price: [9.97, 9.97, 9.97, 9.97, 9.97], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [0, 0, 0, 0, 0] },
  "r4-202561604": { rating: [3.6, 3.6, 3.6, 3.6, 3.6], reviews: [1793, 1798, 1804, 1805, 1811], price: [10.97, 10.97, 10.97, 10.97, 10.97], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [0, 0, 0, 0, 0] },
  "r6-50040952": { rating: [4, 4, 4, 4, 4], reviews: [1650, 1653, 1656, 1656, 1668], price: [6.98, 6.98, 6.98, 6.98, 6.98], stockRate: [0.0, 0.0, 0.0, 0.0, 0.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r6-1000373169": { rating: [4.5, 4.5, 4.5, 4.5, 4.5], reviews: [1566, 1580, 1591, 1591, 1604], price: [8.48, 8.48, 8.48, 8.48, 8.48], stockRate: [14.3, 0.0, 14.3, 0.0, 0.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r6-50243433": { rating: [4.5, 4.5, 4.5, 4.5, 4.5], reviews: [1566, 1580, 1591, 1591, 1604], price: [17.98, 17.98, 17.98, 17.98, 17.98], stockRate: [14.3, 0.0, 0.0, 0.0, 0.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r6-999989720": { rating: [4.5, 4.5, 4.5, 4.5, 4.5], reviews: [1568, 1580, 1591, 1597, 1604], price: [4.98, 4.98, 4.98, 4.98, 4.98], stockRate: [0.0, 0.0, 14.3, 0.0, 0.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r6-50260191": { rating: [4.5, 4.5, 4.5, 4.5, 4.5], reviews: [1534, 1548, 1559, 1564, 1570], price: [11.48, 11.48, 11.48, 11.48, 11.48], stockRate: [14.3, 0.0, 14.3, 0.0, 0.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r6-999930408": { rating: [4.5, 4.5, 4.5, 4.5, 4.5], reviews: [1536, 1548, 1559, 1559, 1570], price: [14.84, 14.98, 14.98, 14.98, 14.98], stockRate: [0.0, 0.0, 0.0, 0.0, 0.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r6-1003171818": { rating: [4, 4, 4, 4, 4], reviews: [1511, 1519, 1523, 1532, 1535], price: [11.28, 11.28, 11.28, 11.28, 11.28], stockRate: [14.3, 28.6, 0.0, 0.0, 0.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r6-1000309991": { rating: [4, 4, 4, 4, 4], reviews: [1491, 1499, 1502, 1502, 1514], price: [8.48, 8.48, 8.48, 8.48, 8.48], stockRate: [0.0, 0.0, 14.3, 0.0, 0.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r6-1000309995": { rating: [4, 4, 4, 4, 4], reviews: [1496, 1499, 1502, 1502, 1514], price: [4.98, 4.98, 4.98, 4.98, 4.98], stockRate: [0.0, 0.0, 14.3, 0.0, 0.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r6-50328417": { rating: [4, 4, 4, 4, 4], reviews: [1491, 1499, 1502, 1502, 1514], price: [14.48, 14.48, 14.48, 14.48, 14.48], stockRate: [0.0, 0.0, 14.3, 0.0, 0.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r6-50236519": { rating: [4.5, 4.5, 4.5, 4.5, 4.5], reviews: [1459, 1462, 1466, 1472, 1476], price: [7.98, 7.98, 7.98, 7.98, 7.98], stockRate: [14.3, 0.0, 0.0, 0.0, 0.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r6-1000769722": { rating: [4, 4, 4, 4, 4], reviews: [1352, 1359, 1361, 1363, 1365], price: [7.48, 7.48, 7.48, 7.48, 7.48], stockRate: [0.0, 0.0, 0.0, 0.0, 0.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r6-50065981": { rating: [4.5, 4.5, 4.5, 4.5, 4.5], reviews: [1166, 1171, 1178, 1178, 1184], price: [17.48, 17.48, 17.48, 17.48, 17.48], stockRate: [0.0, 0.0, 0.0, 0.0, 0.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r6-5005476109": { rating: [4.5, 4.5, 4.5, 4.5, 4.5], reviews: [1137, 1145, 1155, 1161, 1168], price: [14.28, 14.28, 14.28, 14.28, 14.28], stockRate: [0.0, 0.0, 28.6, 0.0, 0.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r6-4736729": { rating: [4, 4, 4, 4, 4], reviews: [1157, 1163, 1164, 1166, 1168], price: [9.98, 9.98, 9.98, 9.98, 9.98], stockRate: [0.0, 0.0, 0.0, 0.0, 0.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r6-1000321887": { rating: [4, 4, 4, 4, 4], reviews: [1158, 1162, 1164, 1164, 1167], price: [8.98, 8.98, 8.98, 8.98, 8.98], stockRate: [0.0, 0.0, 0.0, 0.0, 0.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r6-999912917": { rating: [4.5, 4.5, 4.5, 4.5, 4.5], reviews: [1135, 1140, 1147, 1147, 1152], price: [17.48, 17.48, 17.48, 17.48, 17.48], stockRate: [0.0, 0.0, 0.0, 0.0, 0.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r6-50328425": { rating: [4, 4, 4, 4, 4], reviews: [1121, 1121, 1121, 1121, 1121], price: [8.64, 8.73, 8.6, 8.69, 8.98], stockRate: [0.0, 0.0, 0.0, 0.0, 0.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r6-1000383881": { rating: [4.5, 4.5, 4.5, 4.5, 4.5], reviews: [941, 942, 943, 943, 943], price: [12.98, 12.98, 12.98, 12.98, 12.98], stockRate: [14.3, 0.0, 42.9, 0.0, 0.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r6-5001952515": { rating: [4.5, 4.5, 4.5, 4.5, 4.5], reviews: [876, 879, 883, 883, 893], price: [13.98, 13.98, 13.98, 13.98, 13.98], stockRate: [14.3, 0.0, 28.6, 0.0, 0.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r5-5230281": { rating: [2.52, 2.51, 2.52, 2.52, 2.52], reviews: [299, 300, 301, 301, 301], price: [10.99, 10.99, 10.99, 10.99, 10.99], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r5-5174325": { rating: [3.74, 3.74, 3.74, 3.74, 3.74], reviews: [276, 279, 279, 279, 281], price: [21.69, 21.69, 21.69, 21.69, 21.69], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r5-5154527": { rating: [3.14, 3.14, 3.14, 3.14, 3.14], reviews: [229, 229, 229, 229, 229], price: [99.99, 99.99, 99.99, 99.99, 99.99], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r5-5248474": { rating: [3.48, 3.47, 3.48, 3.47, 3.47], reviews: [218, 220, 219, 220, 220], price: [329.99, 329.99, 329.99, 329.99, 329.99], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r5-5306082": { rating: [4, 4.01, 4.02, 4.02, 4.02], reviews: [194, 195, 198, 198, 198], price: [392.85, 499.99, 499.99, 499.99, 499.99], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r5-5158650": { rating: [3.76, 3.76, 3.76, 3.76, 3.77], reviews: [196, 196, 197, 197, 198], price: [32.99, 32.99, 32.99, 32.99, 32.99], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r5-48922": { rating: [4.69, 4.69, 4.68, 4.68, 4.68], reviews: [183, 183, 184, 188, 188], price: [35.99, 35.99, 32.69, 28.28, 28.28], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r5-5084949": { rating: [3.01, 3.01, 3.01, 3.01, 3.01], reviews: [187, 187, 187, 187, 187], price: [14.99, 14.99, 14.99, 14.99, 14.99], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r5-5154528": { rating: [3.47, 3.47, 3.47, 3.47, 3.47], reviews: [178, 178, 178, 179, 179], price: [139.99, 139.99, 139.99, 139.99, 139.99], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r5-5307990": { rating: [4.79, 4.79, 4.8, 4.8, 4.8], reviews: [170, 170, 171, 171, 171], price: [10.99, 10.99, 10.99, 10.99, 10.99], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r5-5134180": { rating: [2.38, 2.49, 2.72, 2.85, 2.96], reviews: [116, 121, 134, 142, 151], price: [14.99, 14.99, 13.08, 12.32, 12.32], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r5-5286669": { rating: [2.09, 2.08, 2.1, 2.1, 2.1], reviews: [143, 144, 145, 146, 146], price: [199.99, 199.99, 199.99, 199.99, 199.99], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r5-5178067": { rating: [3.96, 3.96, 3.96, 3.96, 3.96], reviews: [141, 141, 141, 141, 141], price: [23.99, 23.99, 23.99, 23.99, 23.99], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r5-5154725": { rating: [1.67, 1.67, 1.67, 1.67, 1.67], reviews: [134, 134, 135, 135, 135], price: [7.66, 7.17, 7.17, 7.17, 7.17], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r5-5094985": { rating: [3.13, 3.13, 3.13, 3.13, 3.13], reviews: [131, 131, 131, 131, 131], price: [16.99, 16.99, 16.99, 16.99, 16.99], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r5-5162190": { rating: [2.06, 2.06, 2.06, 2.06, 2.09], reviews: [114, 114, 114, 114, 115], price: [35.39, 35.39, 35.39, 35.39, 35.39], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r5-5099366": { rating: [3.42, 3.42, 3.42, 3.42, 3.42], reviews: [112, 112, 112, 112, 112], price: [2.09, 2.09, 2.09, 2.09, 2.09], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r5-1031503": { rating: [4.76, 4.77, 4.77, 4.77, 4.77], reviews: [102, 105, 105, 105, 106], price: [7.69, 7.69, 7.69, 7.69, 7.69], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r5-5272047": { rating: [3.39, 3.37, 3.37, 3.37, 3.39], reviews: [94, 95, 95, 95, 96], price: [87.99, 87.99, 87.99, 87.99, 87.99], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r5-5254042": { rating: [4.14, 4.14, 4.15, 4.16, 4.16], reviews: [91, 91, 92, 93, 93], price: [32.99, 32.99, 32.99, 32.99, 32.99], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r3-46092119": { rating: [4.3, 4.3, 4.3, 4.3, 4.3], reviews: [3376, 3376, 3376, 3376, 3376], price: [17.88, 17.88, 17.88, 42.33, 46.4], stockRate: [0.0, 0.0, 0.0, 0.0, 0.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r3-39791215": { rating: [4.3, 4.3, 4.3, 4.3, 4.3], reviews: [1999, 1999, 2003, 2003, 2003], price: [29.03, 29.81, 29.96, 29.96, 29.96], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r3-49840437": { rating: [4.5, 4.5, 4.5, 4.5, 4.5], reviews: [1610, 1610, 1618, 1620, 1626], price: [10.36, 10.36, 10.36, 10.36, 10.36], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r3-43966519": { rating: [4.6, 4.6, 4.6, 4.6, 4.6], reviews: [1512, 1512, 1512, 1512, 1512], price: [99.95, 129.77, 99.92, 99.92, 99.92], stockRate: [14.3, 71.4, 71.4, 100.0, 100.0], buyBoxRate: [100, 57, 57, 71, 0] },
  "r3-28920902": { rating: [4.5, 4.5, 4.5, 4.5, 4.5], reviews: [1430, 1436, 1440, 1446, 1451], price: [20.0, 20.0, 20.0, 20.0, 20.0], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r3-200093306": { rating: [4.8, 4.8, 4.8, 4.8, 4.8], reviews: [1432, 1433, 1434, 1434, 1435], price: [18.75, 19.78, 28.34, 19.78, 19.78], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [100, 100, 29, 100, 100] },
  "r3-981923626": { rating: [4.2, 4.2, 4.2, 4.2, 4.2], reviews: [1356, 1356, 1356, 1356, 1356], price: [48.98, 48.96, 48.95, 48.95, 48.95], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [0, 0, 0, 0, 0] },
  "r3-20564657": { rating: [4.4, 4.4, 4.4, 4.4, 4.4], reviews: [1330, 1331, 1332, 1332, 1332], price: [24.99, 24.99, 24.99, 24.99, 55.99], stockRate: [28.6, 14.3, 42.9, 100.0, 100.0], buyBoxRate: [100, 100, 86, 100, 0] },
  "r3-43920730": { rating: [4.8, 4.8, 4.8, 4.8, 4.8], reviews: [1218, 1220, 1225, 1227, 1227], price: [10.98, 10.98, 10.98, 10.98, 10.98], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r3-14978527": { rating: [4.5, 4.5, 4.5, 4.5, 4.5], reviews: [1146, 1148, 1152, 1159, 1159], price: [19.84, 19.84, 19.08, 19.84, 19.84], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r3-772119289": { rating: [4.4, 4.4, 4.4, 4.4, 4.4], reviews: [1041, 1041, 1042, 1042, 1052], price: [41.88, 41.61, 41.88, 41.61, 41.88], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [100, 86, 100, 86, 100] },
  "r3-22569723": { rating: [4.1, 4.1, 4.1, 4.1, 4.1], reviews: [1049, 1049, 1049, 1049, 1049], price: [13.6, 13.6, 13.38, 13.38, 13.6], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [100, 100, 86, 86, 100] },
  "r3-164464324": { rating: [4.4, 4.4, 4.4, 4.4, 4.4], reviews: [1025, 1025, 1026, 1026, 1026], price: [29.99, 29.99, 29.99, 29.99, 29.99], stockRate: [100.0, 100.0, 28.6, 100.0, 100.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r3-51822911": { rating: [4, 4, 4, 4, 4], reviews: [1001, 1001, 1001, 1001, 1001], price: [49.98, 49.98, 48.56, 49.7, 49.98], stockRate: [100.0, 100.0, 28.6, 100.0, 100.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r3-51800328": { rating: [4.3, 4.3, 4.3, 4.3, 4.3], reviews: [963, 963, 963, 963, 963], price: [39.92, 39.92, 39.92, 39.92, 39.92], stockRate: [0.0, 0.0, 0.0, 0.0, 0.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r3-16816451": { rating: [4.3, 4.3, 4.3, 4.3, 4.3], reviews: [948, 948, 950, 951, 951], price: [28.56, 28.56, 28.56, 28.56, 28.56], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r3-14321489": { rating: [4.3, 4.3, 4.3, 4.3, 4.3], reviews: [899, 899, 901, 902, 903], price: [21.15, 21.15, 21.15, 21.15, 21.15], stockRate: [100.0, 100.0, 28.6, 100.0, 100.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r3-2684038": { rating: [3.9, 3.9, 3.9, 3.9, 3.9], reviews: [864, 864, 864, 864, 864], price: [99.0, 88.68, 82.38, 82.85, 88.99], stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [0, 0, 0, 0, 0] },
  "r3-24194217": { rating: [4.8, 4.8, 4.8, 4.8, 4.8], reviews: [856, 856, 856, 856, 856], price: [4.94, 4.94, 4.94, 4.94, 4.94], stockRate: [0.0, 0.0, 0.0, 0.0, 0.0], buyBoxRate: [100, 100, 100, 100, 100] },
  "r3-213639374": { rating: [4.2, 4.2, 4.2, 4.2, 4.2], reviews: [806, 806, 806, 806, 806], price: [17.97, 17.97, 17.97, 17.97, 17.97], stockRate: [100.0, 0.0, 0.0, 0.0, 0.0], buyBoxRate: [100, 100, 100, 100, 100] },
};

export const REAL_SOS_WEEKLY: Record<string, number[]> = {};

export const REAL_ROLLUP_WEEKLY: Record<string, {
  stockRate: number[]; buyBoxRate: number[]; rating: number[]; content: number[];
}> = {
  "portfolio": { stockRate: [74.63, 74.14, 73.65, 74.26, 75.0], buyBoxRate: [81.21, 80.42, 79.69, 80.54, 78.88], rating: [4.15, 4.15, 4.15, 4.15, 4.16], content: [81.9, 81.9, 81.8, 81.8, 81.8] },
  "r1": { stockRate: [95.23, 97.62, 99.21, 94.44, 94.44], buyBoxRate: [90.0, 88.11, 88.11, 88.89, 86.11], rating: [4.54, 4.54, 4.54, 4.53, 4.54], content: [87.6, 87.6, 87.3, 87.3, 87.3] },
  "r2": { stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [100.0, 100.0, 100.0, 100.0, 100.0], rating: [4.39, 4.39, 4.39, 4.39, 4.39], content: [83.5, 83.5, 83.5, 83.5, 83.5] },
  "r3": { stockRate: [77.15, 74.28, 65.0, 80.0, 80.0], buyBoxRate: [90.0, 87.15, 82.9, 87.15, 80.0], rating: [4.38, 4.38, 4.38, 4.38, 4.38], content: [78.2, 78.2, 78.2, 78.2, 78.2] },
  "r4": { stockRate: [72.22, 73.81, 70.63, 73.02, 77.78], buyBoxRate: [0.0, 0.0, 0.0, 0.0, 0.0], rating: [3.94, 3.94, 3.94, 3.95, 3.95], content: [89.8, 89.8, 89.8, 89.8, 89.8] },
  "r5": { stockRate: [100.0, 100.0, 100.0, 100.0, 100.0], buyBoxRate: [100.0, 100.0, 100.0, 100.0, 100.0], rating: [3.38, 3.38, 3.4, 3.4, 3.41], content: [64.9, 64.9, 64.9, 64.9, 64.9] },
  "r6": { stockRate: [5.01, 1.43, 9.29, 0.0, 0.0], buyBoxRate: [100.0, 100.0, 100.0, 100.0, 100.0], rating: [4.28, 4.28, 4.28, 4.28, 4.28], content: [88.6, 88.6, 88.6, 88.6, 88.6] },
};


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
    price: round(p.price * (0.99 + r() * 0.02), 2),
    priceIndex: round(p.price / (PEER_GROUP_AVG_PRICE[(p as any).priceGroup] || p.price), 2),
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

/* Real portfolio/retailer-level trend series for the "Last 4 weeks" period —
   same reasoning as REAL_PRODUCT_WEEKLY above: this is the one window the
   real September crawl can honestly fill point-for-point. Every other
   period keeps the synthetic series() curves. */
function realRollupSeries(period: string, retailer: string, field: "stockRate" | "buyBoxRate" | "rating" | "content"): number[] | null {
  if (period !== "4w") return null;
  const row = REAL_ROLLUP_WEEKLY[retailer === "all" ? "portfolio" : retailer];
  return row ? row[field].slice(1) : null;
}

/* Deliberately NOT wired to real data. The real Share of Search file gives a
   "% of tracked-keyword searches that returned any ranked result" per
   retailer per week (e.g. Amazon 100%, Chewy ~40% — consistent with the
   59.5% zero-result rate found in the audit). That is a genuinely real
   number, but it is not the same metric as this "Search Visibility / share
   of search among competitors" KPI (0–~50% scale, compared against a 40%
   target) — swapping one in for the other would misrepresent both. Left
   synthetic here; REAL_SOS_WEEKLY stays empty on purpose. A real "Keyword
   Result Coverage" chart would be the honest way to surface that number. */
function realRollupSeriesSos(period: string, retailer: string): number[] | null {
  if (period !== "4w") return null;
  const row = REAL_SOS_WEEKLY[retailer === "all" ? "portfolio" : retailer];
  return row ? row : null;
}

function realPriceIndexWeekly(period: string, retailer: string): number[] | null {
  if (period !== "4w") return null;
  const ids = Object.keys(REAL_PRODUCT_WEEKLY).filter((id) => retailer === "all" || id.startsWith(retailer + "-"));
  if (!ids.length) return null;
  const out: number[] = [];
  for (let wi = 1; wi < 5; wi++) {
    let sum = 0, count = 0;
    for (const id of ids) {
      const prod = (catalog as any[]).find((x) => x.id === id);
      const avg = prod && PEER_GROUP_AVG_PRICE[prod.priceGroup];
      if (!avg) continue;
      sum += (REAL_PRODUCT_WEEKLY[id].price[wi] / avg) * 100;
      count++;
    }
    out.push(count ? round(sum / count, 1) : 100);
  }
  return out;
}

function snapshot(retailer: string, period: string) {
  const key = retailer + "|" + period;
  const seed = hash(key);
  const labels = labelsFor(period);
  const n = labels.length;
  const bias = RETAILER_BIAS[retailer] || RETAILER_BIAS.all;
  const sw = swing[period] || 1;

  const sos = realRollupSeriesSos(period, retailer) ?? series(seed + 1, n, 34.2 - 5 * sw + bias.sos, 34.2 + bias.sos, 0.9, 1);
  const leader = series(seed + 2, n, 41 + 2 * sw, 36.1, 0.8, 1);
  const riser = series(seed + 3, n, 25.2 - 11 * sw, 25.2, 1.1, 1);
  const stockVals = realRollupSeries(period, retailer, "stockRate")
    ?? series(seed + 4, n, 96.4 + 1.4 * sw + bias.stock, 96.4 + bias.stock, 0.5, 1).map((v) => round(clamp(v, 88, 100), 1));
  const ratingVals = realRollupSeries(period, retailer, "rating")
    ?? series(seed + 5, n, 4.32 - 0.14 * sw + bias.rating, 4.32 + bias.rating, 0.03, 2);
  const contentVals = (realRollupSeries(period, retailer, "content")?.map((v) => Math.round(v)))
    ?? series(seed + 6, n, 87 - 8 * sw + bias.content, 87 + bias.content, 1.2, 0).map((v) => clamp(Math.round(v), 40, 100));

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
  /* Same seeds/formula as shelfData() so Price Index and Buy Box Presence
     read identically wherever they appear. */
  const idxNow = round((pool.reduce((a, p) => a + p.priceIndex, 0) / (pool.length || 1)) * 100, 1);
  const priceIdx = realPriceIndexWeekly(period, retailer) ?? series(seed + 21, n, idxNow - 1.8 * sw, idxNow, 0.6, 1);
  const buyNow = round((pool.filter((p) => p.buyBox).length / (pool.length || 1)) * 100, 0);
  const buyBoxSeries = realRollupSeries(period, retailer, "buyBoxRate")?.map((v) => Math.round(v))
    ?? series(seed + 22, n, buyNow + 2 * sw, buyNow, 1.2, 0).map((v) => clamp(Math.round(v), 40, 100));

  const out: any = {
    retailer, period, labels,
    generatedAt: "Today 06:40 UTC",
    kpis: [
      kpi("sos", "Search Visibility", "%", sos, 40, 1),
      kpi("instock", "Availability", "%", stockVals, 98, 1),
      kpi("pidx", "Price Index", "", priceIdx, 100, 1),
      kpi("content", "Content Completeness", "/100", contentVals, 95, 0),
      kpi("buybox", "Buy Box Presence", "%", buyBoxSeries, 95, 0),
      kpi("rating", "Average Rating", "", ratingVals, 4.5, 2),
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

  /* Same seeds as the overview snapshot so shared KPIs read identically —
     and the same real-data-for-"4w" substitution, so the two pages never
     disagree about whether a number is real. */
  const sos = realRollupSeriesSos(period, retailer) ?? series(seed + 1, n, 34.2 - 5 * sw + bias.sos, 34.2 + bias.sos, 0.9, 1);
  const stockVals = realRollupSeries(period, retailer, "stockRate")
    ?? series(seed + 4, n, 96.4 + 1.4 * sw + bias.stock, 96.4 + bias.stock, 0.5, 1).map((v) => round(clamp(v, 88, 100), 1));
  const contentVals = (realRollupSeries(period, retailer, "content")?.map((v) => Math.round(v)))
    ?? series(seed + 6, n, 87 - 8 * sw + bias.content, 87 + bias.content, 1.2, 0).map((v) => clamp(Math.round(v), 40, 100));

  const idxNow = round(avg(pool, (p) => p.priceIndex, 3) * 100, 1);
  const priceIdx = realPriceIndexWeekly(period, retailer) ?? series(seed + 21, n, idxNow - 1.8 * sw, idxNow, 0.6, 1);
  const buyNow = round((pool.filter((p) => p.buyBox).length / (pool.length || 1)) * 100, 0);
  const buyBox = realRollupSeries(period, retailer, "buyBoxRate")?.map((v) => Math.round(v))
    ?? series(seed + 22, n, buyNow + 2 * sw, buyNow, 1.2, 0).map((v) => clamp(Math.round(v), 40, 100));

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
    const buyBoxPresence = own.length ? Math.round((own.filter((p) => p.buyBox).length / own.length) * 100) : Math.round(60 + rr() * 30);
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
      problem: highPrice.length + " products are priced more than 10% above the category average.",
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
    retailer, period, labels, generatedAt: "Today 06:40 UTC",
    kpis: [
      kpi("sos", "Search Visibility", "%", sos, 40, 1),
      kpi("instock", "Availability", "%", stockVals, 98, 1),
      kpi("pidx", "Price Index", "", priceIdx, 100, 1),
      kpi("content", "Content Completeness", "/100", contentVals, 95, 0),
      kpi("buybox", "Buy Box Presence", "%", buyBox, 95, 0),
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
  GPC: "Pet treats & aquarium range",
  HPC: "Small kitchen & grooming appliances",
  HG: "Spectracide weed & pest control",
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

  /* Digital shelf signals for the same retailer + period — Performance
     Intelligence reads these directly rather than an estimated-sales figure. */
  const shelf = shelfData(retailer, period);
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
    /* "Last 4 weeks" is the one period the real September crawl can honestly
       fill end to end: 4 real weekly points (Sep 8/15/22/29) bucketed from
       the actual daily Price history and weekly Content snapshots, per
       product. Every other period keeps the synthetic jitter below, since
       there is no real history beyond this one month to draw from. Search
       rank stays synthetic in all periods — no reliable per-SKU crawled
       rank exists (see the Placement matching note). */
    const real = REAL_PRODUCT_WEEKLY[id];
    const trends = period === "4w" && real
      ? {
          rank: series(seed + 1, n, clamp(p.searchRank + 3 * sw, 1, 40), p.searchRank, 1.2, 0).map((v) => clamp(Math.round(v), 1, 40)),
          price: real.price.slice(1),
          stock: real.stockRate.slice(1),
          rating: real.rating.slice(1),
          reviews: real.reviews.slice(1),
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
      dataSource: period === "4w" && real ? "real" : "illustrative",
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
