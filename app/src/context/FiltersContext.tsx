import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { periods, retailers } from "../data/mockData";

interface FiltersValue {
  retailer: string;
  period: string;
  setRetailer: (id: string) => void;
  setPeriod: (id: string) => void;
  retailerName: string;
  periodName: string;
  retailers: typeof retailers;
  periods: typeof periods;
}

const FiltersContext = createContext<FiltersValue | null>(null);

/** The two filters the brief calls out as global: retailer and reporting
 *  period. Every analytics page reads them from here instead of keeping its
 *  own copy, so changing either one updates every page consistently. */
export function FiltersProvider({ children }: { children: ReactNode }) {
  const [retailer, setRetailer] = useState("all");
  const [period, setPeriod] = useState("12w");

  const value = useMemo<FiltersValue>(() => ({
    retailer, period, setRetailer, setPeriod,
    retailerName: retailers.find((r) => r.id === retailer)?.name ?? "",
    periodName: periods.find((p) => p.id === period)?.name ?? "",
    retailers, periods,
  }), [retailer, period]);

  return <FiltersContext.Provider value={value}>{children}</FiltersContext.Provider>;
}

export function useFilters() {
  const ctx = useContext(FiltersContext);
  if (!ctx) throw new Error("useFilters must be used within FiltersProvider");
  return ctx;
}
