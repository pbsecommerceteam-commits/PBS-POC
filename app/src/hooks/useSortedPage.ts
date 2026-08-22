import { useEffect, useMemo, useState } from "react";

/** Shared sort + paginate behavior for every product-shaped table
 *  (Overview, Digital Shelf, Sales & Share, keywords) — ported from the
 *  prototype's filteredProducts()/sort()/page state, generalized so each
 *  page just supplies per-column comparators instead of rewriting the
 *  sort-toggle and pagination logic each time.
 *
 *  `resetKey` should change whenever an upstream filter changes, so the
 *  page resets to 1 the way the original filter setters did. */
export function useSortedPage<T>(
  rows: T[],
  sorters: Record<string, (a: T, b: T) => number>,
  defaultKey: string,
  pageSize = 8,
  resetKey?: unknown,
) {
  const [sortKey, setSortKey] = useState(defaultKey);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);

  useEffect(() => { setPage(1); }, [resetKey]);

  const sorted = useMemo(() => {
    const cmp = sorters[sortKey];
    if (!cmp) return rows;
    const dir = sortDir === "asc" ? 1 : -1;
    return rows.slice().sort((a, b) => cmp(a, b) * dir);
  }, [rows, sorters, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const current = Math.min(page, totalPages);
  const slice = sorted.slice((current - 1) * pageSize, current * pageSize);

  const onSort = (key: string) => {
    setSortDir(sortKey === key && sortDir === "asc" ? "desc" : "asc");
    setSortKey(key);
    setPage(1);
  };

  const setSort = (key: string, dir: "asc" | "desc") => { setSortKey(key); setSortDir(dir); setPage(1); };

  return { slice, sortKey, sortDir, onSort, setSort, page: current, totalPages, setPage, total: sorted.length };
}
