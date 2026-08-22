import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { fetchSales, fetchShelf, fetchSnapshot } from "../data/mockData";
import { useFilters } from "./FiltersContext";

interface DataValue {
  snap: any | null;
  shelf: any | null;
  sales: any | null;
  loading: boolean;
  error: string;
  reload: () => void;
}

const DataContext = createContext<DataValue | null>(null);

/** Fetches the overview/shelf/sales snapshots together whenever retailer or
 *  period changes — mirroring the prototype's single Promise.all load(), so
 *  every page reads from the same in-flight response and never disagrees
 *  about a number. Pages that only need one slice (e.g. Reviews only needs
 *  `snap`) simply ignore the others. */
export function DataProvider({ children }: { children: ReactNode }) {
  const { retailer, period } = useFilters();
  const [snap, setSnap] = useState<any | null>(null);
  const [shelf, setShelf] = useState<any | null>(null);
  const [sales, setSales] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadTick, setReloadTick] = useState(0);
  const reqKey = useRef("");

  useEffect(() => {
    const key = retailer + "|" + period + "|" + reloadTick;
    reqKey.current = key;
    setLoading(true);
    setError("");
    Promise.all([
      fetchSnapshot({ retailer, period }),
      fetchShelf({ retailer, period }),
      fetchSales({ retailer, period }),
    ]).then(([s, sh, sa]) => {
      if (reqKey.current !== key) return;
      setSnap(s); setShelf(sh); setSales(sa); setLoading(false);
    }).catch((err) => {
      if (reqKey.current !== key) return;
      setLoading(false);
      setError(String(err?.message || err));
    });
  }, [retailer, period, reloadTick]);

  const value: DataValue = { snap, shelf, sales, loading, error, reload: () => setReloadTick((t) => t + 1) };
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useDashboardData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useDashboardData must be used within DataProvider");
  return ctx;
}
