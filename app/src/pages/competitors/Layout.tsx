import { Outlet } from "react-router-dom";
import { PageShell } from "../../components/layout/PageShell";
import { PageTabs } from "../../components/ui/PageTabs";
import { useDashboardData } from "../../context/DataContext";

export interface CompetitorsContext {
  snap: any;
}

export default function CompetitorsLayout() {
  const { snap } = useDashboardData();

  return (
    <PageShell title="Competitors" subtitle="Rival portfolios tracked against the same keyword set"
      tabs={<PageTabs items={[
        { label: "Summary", to: "/competitors", end: true },
        { label: "Competitors", to: "/competitors/list" },
      ]} />}
    >
      {!snap ? <div /> : <Outlet context={{ snap } satisfies CompetitorsContext} />}
    </PageShell>
  );
}
