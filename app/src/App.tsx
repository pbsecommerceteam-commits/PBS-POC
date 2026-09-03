import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { RequireAuth } from "./components/layout/RequireAuth";
import { AuthProvider } from "./context/AuthContext";
import { FiltersProvider } from "./context/FiltersContext";
import { DataProvider } from "./context/DataContext";
import { UiProvider } from "./context/UiContext";
import Login from "./pages/Login";
import Overview from "./pages/Overview";
import SalesShareLayout from "./pages/sales-share/Layout";
import SalesShareSummary from "./pages/sales-share/Summary";
import SalesShareDrivers from "./pages/sales-share/Drivers";
import SalesShareProducts from "./pages/sales-share/Products";
import ContentLayout from "./pages/content/Layout";
import ContentSummary from "./pages/content/Summary";
import ContentBenchmarks from "./pages/content/Benchmarks";
import ContentProducts from "./pages/content/Products";
import ReviewsLayout from "./pages/reviews/Layout";
import ReviewsSummary from "./pages/reviews/Summary";
import ReviewsBenchmarks from "./pages/reviews/Benchmarks";
import ReviewsProducts from "./pages/reviews/Products";
import CompetitorsLayout from "./pages/competitors/Layout";
import CompetitorsSummary from "./pages/competitors/Summary";
import CompetitorList from "./pages/competitors/CompetitorList";
import CompetitorsKeywords from "./pages/competitors/Keywords";
import Alerts from "./pages/Alerts";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import ProductDetail from "./pages/ProductDetail";

export default function App() {
  return (
    <AuthProvider>
      <FiltersProvider>
        <UiProvider>
          <DataProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<RequireAuth><AppShell /></RequireAuth>}>
              <Route index element={<Navigate to="/overview" replace />} />
              <Route path="overview" element={<Overview />} />

              <Route path="sales-share" element={<SalesShareLayout />}>
                <Route index element={<SalesShareSummary />} />
                <Route path="drivers" element={<SalesShareDrivers />} />
                <Route path="products" element={<SalesShareProducts />} />
              </Route>

              <Route path="content" element={<ContentLayout />}>
                <Route index element={<ContentSummary />} />
                <Route path="benchmarks" element={<ContentBenchmarks />} />
                <Route path="products" element={<ContentProducts />} />
              </Route>

              <Route path="reviews" element={<ReviewsLayout />}>
                <Route index element={<ReviewsSummary />} />
                <Route path="benchmarks" element={<ReviewsBenchmarks />} />
                <Route path="products" element={<ReviewsProducts />} />
              </Route>

              <Route path="competitors" element={<CompetitorsLayout />}>
                <Route index element={<CompetitorsSummary />} />
                <Route path="list" element={<CompetitorList />} />
                <Route path="keywords" element={<CompetitorsKeywords />} />
              </Route>

              <Route path="alerts" element={<Alerts />} />
              <Route path="reports" element={<Reports />} />
              <Route path="settings" element={<Settings />} />
              <Route path="product/:id" element={<ProductDetail />} />
              <Route path="*" element={<Navigate to="/overview" replace />} />
            </Route>
          </Routes>
          </DataProvider>
        </UiProvider>
      </FiltersProvider>
    </AuthProvider>
  );
}
