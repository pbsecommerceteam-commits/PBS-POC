import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { catalog, companies, retailers, type DateRange } from "../data/mockData";

interface FiltersValue {
  /** The selected client/company -- "" means none chosen yet, which gates
   *  the whole authenticated app behind a company picker (see
   *  RequireCompany) rather than defaulting to a blended cross-company
   *  view that would average together unrelated businesses' numbers. */
  company: string;
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
  setCompany: (name: string) => void;
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
  companies: typeof companies;
  /** Scoped to the selected company's own real retailers/categories/brands
   *  -- every company only ever sells on a handful of the globally-known
   *  retailer codes, and category/account values are entirely company-
   *  specific, so these must never be the raw global lists. */
  retailers: typeof retailers;
  categories: string[];
  brands: string[];
}

const FiltersContext = createContext<FiltersValue | null>(null);

export function FiltersProvider({ children }: { children: ReactNode }) {
  const [company, setCompanyState] = useState("");
  const [retailer, setRetailer] = useState("all");
  const [category, setCategory] = useState("");
  const [brand, setBrand] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | null>(null);
  const [sku, setSkuState] = useState("");

  const setCompany = (name: string) => {
    setCompanyState(name);
    // A retailer/category/brand/SKU picked under one company is almost
    // never valid for another (different companies rarely share a
    // category/account label, and never share a SKU) -- reset the whole
    // scope on switch rather than leaving a stale, silently-mismatched
    // filter in place.
    setRetailer("all");
    setCategory("");
    setBrand("");
    setSkuState("");
    setDateRange(null);
  };

  const setSku = (id: string) => {
    setSkuState(id);
    if (!id) return;
    const p = (catalog as any[]).find((c) => c.id === id);
    if (!p) return;
    if (retailer !== "all" && retailer !== p.retailer) setRetailer(p.retailer);
    if (category && category !== p.category) setCategory(p.category);
    if (brand && brand !== p.brand) setBrand(p.brand);
  };

  const companyRetailers = useMemo(() => {
    if (!company) return [];
    const codes = new Set((catalog as any[]).filter((p) => p.company === company).map((p) => p.retailer));
    return retailers.filter((r) => r.id !== "all" && codes.has(r.id));
  }, [company]);

  const companyCategories = useMemo(() => {
    if (!company) return [];
    return Array.from(new Set((catalog as any[]).filter((p) => p.company === company).map((p) => p.category as string))).sort();
  }, [company]);

  const companyBrands = useMemo(() => {
    if (!company) return [];
    return Array.from(new Set((catalog as any[]).filter((p) => p.company === company).map((p) => p.brand as string))).sort();
  }, [company]);

  const value = useMemo<FiltersValue>(() => ({
    company, retailer, category, brand, dateRange, sku,
    setCompany, setRetailer, setCategory, setBrand, setDateRange, setSku,
    retailerName: companyRetailers.find((r) => r.id === retailer)?.name ?? (retailer === "all" ? "All retailers" : ""),
    categoryName: category || "All categories",
    companies, retailers: companyRetailers, categories: companyCategories, brands: companyBrands,
  }), [company, retailer, category, brand, dateRange, sku, companyRetailers, companyCategories, companyBrands]);

  return <FiltersContext.Provider value={value}>{children}</FiltersContext.Provider>;
}

export function useFilters() {
  const ctx = useContext(FiltersContext);
  if (!ctx) throw new Error("useFilters must be used within FiltersProvider");
  return ctx;
}
