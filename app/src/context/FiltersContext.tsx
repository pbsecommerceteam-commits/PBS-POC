import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { periods, retailers, type DateRange } from "../data/mockData";

interface FiltersValue {
  retailer: string;
  period: string;
  dateRange: DateRange | null;
  setRetailer: (id: string) => void;
  setPeriod: (id: string) => void;
  setDateRange: (range: DateRange | null) => void;
  retailerName: string;
  periodName: string;
  retailers: typeof retailers;
  periods: typeof periods;
}

const FiltersContext = createContext<FiltersValue | null>(null);

/** The global filters every analytics page reads instead of keeping its own
 *  copy, so changing any of them updates every page consistently. `dateRange`
 *  is an optional custom window (start/end ISO dates) that, when set, takes
 *  over from `period` for data-fetching purposes — clearing it reverts to
 *  whichever period was selected, which is kept around for exactly that. */
export function FiltersProvider({ children }: { children: ReactNode }) {
  const [retailer, setRetailer] = useState("all");
  const [period, setPeriod] = useState("12w");
  const [dateRange, setDateRange] = useState<DateRange | null>(null);

  const value = useMemo<FiltersValue>(() => ({
    retailer, period, dateRange, setRetailer, setPeriod, setDateRange,
    retailerName: retailers.find((r) => r.id === retailer)?.name ?? "",
    periodName: periods.find((p) => p.id === period)?.name ?? "",
    retailers, periods,
  }), [retailer, period, dateRange]);

  return <FiltersContext.Provider value={value}>{children}</FiltersContext.Provider>;
}

export function useFilters() {
  const ctx = useContext(FiltersContext);
  if (!ctx) throw new Error("useFilters must be used within FiltersProvider");
  return ctx;
}
