import { Outlet } from "react-router-dom";
import { PageShell } from "../../components/layout/PageShell";
import { useDashboardData } from "../../context/DataContext";

export interface CompetitorsContext {
  snap: any;
  sh: any;
}

export default function CompetitorsLayout() {
  const { snap, shelf: sh } = useDashboardData();

  return (
    <PageShell title="Competitive Intelligence" subtitle="Compare listings, pricing, availability and search presence across the monitored competitive set.">
      {!snap || !sh ? <div /> : <Outlet context={{ snap, sh } satisfies CompetitorsContext} />}
    </PageShell>
  );
}
