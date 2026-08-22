import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { GlobalHeader } from "./GlobalHeader";
import { AlertDialog } from "./AlertDialog";
import { ToastStack } from "./ToastStack";

export function AppShell() {
  return (
    <div style={{ display: "flex", height: "100vh", width: "100%", background: "var(--surface-page)", color: "var(--text-primary)", overflow: "hidden" }}>
      <Sidebar />
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <GlobalHeader />
        <Outlet />
      </div>
      <AlertDialog />
      <ToastStack />
    </div>
  );
}
