import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { categories, retailers, type DateRange } from "../data/mockData";

interface FiltersValue {
  retailer: string;
  category: string;
  dateRange: DateRange | null;
  setRetailer: (id: string) => void;
  setCategory: (id: string) => void;
  setDateRange: (range: DateRange | null) => void;
  retailerName: string;
  categoryName: string;
  retailers: typeof retailers;
  categories: typeof categories;
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
export function FiltersProvider({ children }: { children: ReactNode }) {
  const [retailer, setRetailer] = useState("all");
  const [category, setCategory] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | null>(null);

  const value = useMemo<FiltersValue>(() => ({
    retailer, category, dateRange, setRetailer, setCategory, setDateRange,
    retailerName: retailers.find((r) => r.id === retailer)?.name ?? "",
    categoryName: category || "All categories",
    retailers, categories,
  }), [retailer, category, dateRange]);

  return <FiltersContext.Provider value={value}>{children}</FiltersContext.Provider>;
}

export function useFilters() {
  const ctx = useContext(FiltersContext);
  if (!ctx) throw new Error("useFilters must be used within FiltersProvider");
  return ctx;
}
