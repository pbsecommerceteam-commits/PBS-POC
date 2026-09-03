# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Shelfline — a digital shelf intelligence dashboard (availability, pricing, content, rank, reviews, competitors) built as a client-only proof-of-concept. There is no backend: `app/src/data/mockData.ts` stands in for a future API, and `AuthContext` accepts any email/password. The product catalog (117 SKUs) and its base metrics are a real slice of a September 2022 retailer crawl across Amazon, Chewy, Walmart, The Home Depot, PetSmart, Lowe's, and Petco — not synthetic — with deterministic pseudo-random jitter layered on for periods the crawl didn't cover. The catalog and every `REAL_*` table are generated from `app/scripts/build_mock_data.py`, which reads the source workbook (Content / Price / Share Of Search tabs) directly — re-run it and re-splice into `mockData.ts` if the source data is refreshed; see the script's docstring and in-file comments for the exact derivation of every field.

## Commands

All commands run from `app/` (the repo root has no package.json — it only holds `.github/` and `.claude/`).

```bash
cd app
npm install       # install deps
npm run dev       # start Vite dev server (localhost:5173)
npm run build     # tsc -b (project references) + vite build -> app/dist
npm run preview   # preview a production build
npm run lint      # oxlint
```

There is no test suite configured (no Jest/Vitest, no test files) — treat `npm run build` (which type-checks via `tsc -b`) and `npm run lint` as the correctness gates.

To run the app end-to-end, use the `.claude/launch.json` config named `shelfline-dev` (already wired for the preview tool) rather than inventing a new one.

## Git workflow

Work directly on `main` — do not create per-task feature branches for changes in this repo. `git pull origin main` before starting work, and commit + `git push origin main` as you go while working (not batched at the end). A push to `main` immediately triggers the GitHub Pages deploy (see below), so verify `npm run build` and `npm run lint` pass before each push.

## Deployment

`.github/workflows/deploy.yml` builds `app/` and pushes `app/dist` to GitHub Pages on every push to `main`. Because the app is served from `https://<user>.github.io/PBS-POC/` rather than a domain root:
- `vite.config.ts` sets `base: '/PBS-POC/'` only when `GITHUB_ACTIONS` is set (local dev still serves from `/`).
- `main.tsx` uses `HashRouter`, not `BrowserRouter`, so client-side routes survive a static host with no server-side rewrite rules.
- Any asset URL built by hand (see `ProductCell`) must be prefixed with `import.meta.env.BASE_URL`, not a literal `/`.

## Global state: four contexts wrapping the router

`App.tsx` nests providers in a specific, load-bearing order: `AuthProvider > FiltersProvider > UiProvider > DataProvider`, then `<Routes>`. Know what each owns before adding new shared state — there's rarely a reason to add a fifth:

- **AuthContext** — a single `sessionStorage` boolean gate. Not real auth; don't add validation to it.
- **FiltersContext** — the two globally-scoped filters (`retailer`, `period`). Every analytics page reads these instead of keeping a local copy.
- **UiContext** — chrome state reachable from anywhere: sidebar collapse, toast queue, the notification feed's read state, and the "Create alert" dialog's draft/validation/save flow.
- **DataContext** — refetches `fetchSnapshot`/`fetchShelf`/`fetchSales` together (one `Promise.all`) whenever `retailer` or `period` changes, keyed so a stale in-flight response can't clobber a newer one. Every page reads from this single load rather than fetching its own slice, so no two pages can disagree about a number. `reload()` bumps a tick to force a refetch.

## Data layer (`src/data/mockData.ts`)

This file is written as a drop-in replacement target: each exported `fetch*` function already returns a `Promise` of a plain JSON-shaped object, and the file header comments map every function/property to the real endpoint it stands in for (e.g. `fetchSnapshot` → `GET /dashboard/overview`, `.shelf.opportunities` → `GET /digital-shelf/opportunities`). When wiring a real backend, swap the function bodies for `fetch(...).then(r => r.json())` calls — the shapes in `src/models/types.ts` describe what each endpoint must return, and no component should need to change.

Key internal mechanics if you're touching this file:
- `catalog` is the real crawled product list; `RETAILER_BIAS` encodes genuine per-retailer findings (e.g. Chewy's negative share-of-search bias reflects a real 40% zero-result rate on tracked keywords this period).
- `rowRng(key, tag, id)` seeds a PRNG from a hash of its own identity so sibling rows never collapse onto the same jittered value — always derive new derived series this way rather than sharing a seed across rows.
- `REAL_*` maps (`REAL_PRODUCT_WEEKLY`, `REAL_SOS_WEEKLY`, `REAL_ROLLUP_WEEKLY`, `REAL_BUYBOX_COMPETITOR`, `CROSS_RETAILER_MATCH`) hold actual per-week crawl values; the "Last 4 weeks" period is the only one that can be filled end-to-end from real data — other periods fall back to `series()`-generated jitter around the real base value. Preserve this distinction if you extend period coverage.
- `snapshot()`, `shelfData()`, `salesData()`, and `fetchProduct()` all derive from the same `catalog` + bias tables, which is what keeps Overview, Digital Shelf, Performance Intelligence, and a product's detail page mutually consistent.

## Routing & page structure

Each top-level section (`digital-shelf`, `sales-share`, `content`, `reviews`, `competitors`) is a nested route: a section `Layout.tsx` renders `PageShell` + `PageTabs` and passes typed data down via `<Outlet context={... satisfies XContext}>`; its child pages (`Summary`, `Products`, `Benchmarks`, etc.) pull that context with `useOutletContext<XContext>()`. Follow this pattern for any new section rather than having each page fetch/derive independently. The `Layout` is also where CSV export and "save view" toasts are wired (via `PageShell`'s `onExportCsv`/`onSaveView` props and `data/mockData.ts`'s `toCsv`).

`RequireAuth` gates the whole authenticated subtree at `/` in `App.tsx`; `/login` is the only public route.

## Styling

Two-layer CSS system, loaded in this order in `main.tsx`: `design-system.css` (a vendor-style primitive layer — `--color-*` ramps, `.btn`/`.input`/`.card`/`.tag`/`.seg` classes) then `theme.css` (Shelfline's semantic tokens — surface/border/text/status/radius/shadow/chart-palette — which repoint the same primitive variable names to the brand palette) then `app.css` (layout/component-specific rules). **Never hardcode a color in a component** — resolve everything through a `var(--...)` token so a palette change only ever touches `theme.css`. Components mix this CSS-variable approach with inline `style={{}}` objects for layout (grid/flex) rather than component-scoped stylesheets.

## Shared formatting & table/chart helpers

- `lib/format.ts` — `cell()`/`table()` builder pattern used by the generic `DataTable` component for the "static" tables (content coverage, review themes, competitors, alert rules, reports); `kpiCard()` transforms a raw `KpiMetric` into everything `KpiCard` renders (value/delta text, color, status, sparkline path). These were ported near-verbatim from an earlier prototype's `Component` methods — keep new formatting logic here rather than duplicating it in a page.
- `lib/charts.ts` — `lineChart`/`barChart`/`spark` builders consumed by `ChartCard`; `useChartHover` provides shared hover-index state for chart tooltips.
- `hooks/useSortedPage.ts` — shared sort+paginate behavior for every product-shaped table; pages supply per-column comparators and a `resetKey` (bump it when an upstream filter changes) instead of reimplementing sort/page state.
- Product photos live in `public/product-images/{id}.jpg` (id = catalog SKU id, e.g. `r1-B07BVL8TQF.jpg`); `ProductCell` renders the photo and falls back to a deterministic initials avatar on load error or a missing id — it does not fall back to placeholder network images.

## Conventions worth preserving

- No path aliases — all imports are relative (`../../lib/format`, etc.).
- `tsconfig.app.json` enables `noUnusedLocals`/`noUnusedParameters`; `npm run build` will fail on these, so don't leave unused bindings.
- oxlint is configured with only `react/rules-of-hooks` (error) and `react/only-export-components` (warn) beyond defaults — see `app/.oxlintrc.json`.
