import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { catalog, categories, retailers, type DateRange } from "../data/mockData";

interface FiltersValue {
  retailer: string;
  category: string;
  /** Real catalog brand name, "" for every brand. A plain filter dimension
   *  (unlike `sku` below) -- composes with retailer/category the same way
   *  they compose with each other, doesn't override anything on its own. */
  brand: string;
  dateRange: DateRange | null;
  /** Real catalog product id (e.g. "r3-8207932"), "" when no single SKU is
   *  pinned. Lets a page jump straight to one item's own row/overview
   *  instead of only the whole retailer/category-scoped pool. */
  sku: string;
  setRetailer: (id: string) => void;
  setCategory: (id: string) => void;
  setBrand: (name: string) => void;
  setDateRange: (range: DateRange | null) => void;
  /** Setting a SKU also corrects retailer/category if the current global
     scope would otherwise exclude that product (each catalog SKU belongs
     to exactly one retailer) -- so picking one always actually shows it,
     the same way picking a Retailer always shows that retailer's SKUs. */
  setSku: (id: string) => void;
  retailerName: string;
  categoryName: string;
  retailers: typeof retailers;
  categories: typeof categories;
  brands: string[];
}

const FiltersContext = createContext<FiltersValue | null>(null);

/** The global filters every analytics page reads instead of keeping its own
 *  copy, so changing any of them updates every page consistently. `dateRange`
 *  is an optional custom window (start/end ISO dates) that, when set, scopes
 *  the data to that window — clearing it reverts to "Last 4 weeks" (the only
 *  window backed by real crawl data; there's no user-facing period control
 *  any more, see mockData.ts's real-vs-synthetic gating on `period === "4w"`,
 *  which every fetch call below still receives, just always as this fixed
 *  value). */
const BRANDS = Array.from(new Set((catalog as any[]).map((p) => p.brand as string))).sort();

export function FiltersProvider({ children }: { children: ReactNode }) {
  const [retailer, setRetailer] = useState("all");
  const [category, setCategory] = useState("");
  const [brand, setBrand] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | null>(null);
  const [sku, setSkuState] = useState("");

  const setSku = (id: string) => {
    setSkuState(id);
    if (!id) return;
    const p = (catalog as any[]).find((c) => c.id === id);
    if (!p) return;
    if (retailer !== "all" && retailer !== p.retailer) setRetailer(p.retailer);
    if (category && category !== p.category) setCategory(p.category);
    if (brand && brand !== p.brand) setBrand(p.brand);
  };

  const value = useMemo<FiltersValue>(() => ({
    retailer, category, brand, dateRange, sku, setRetailer, setCategory, setBrand, setDateRange, setSku,
    retailerName: retailers.find((r) => r.id === retailer)?.name ?? "",
    categoryName: category || "All categories",
    retailers, categories, brands: BRANDS,
  }), [retailer, category, brand, dateRange, sku]);

  return <FiltersContext.Provider value={value}>{children}</FiltersContext.Provider>;
}

export function useFilters() {
  const ctx = useContext(FiltersContext);
  if (!ctx) throw new Error("useFilters must be used within FiltersProvider");
  return ctx;
}
