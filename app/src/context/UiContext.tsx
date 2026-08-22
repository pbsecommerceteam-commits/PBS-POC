import { createContext, useContext, useRef, useState, type ReactNode } from "react";
import { alertTypes, notificationFeed } from "../data/mockData";

export interface Toast {
  id: number;
  text: string;
}

interface AlertDraft {
  type: string;
  scope: string;
  retailer: string;
  threshold: string;
  frequency: string;
  channel: string;
}

interface UiValue {
  collapsed: boolean;
  toggleCollapse: () => void;
  toasts: Toast[];
  toast: (text: string) => void;
  notifDismissed: boolean;
  markAllRead: () => void;
  notifications: typeof notificationFeed;
  alertOpen: boolean;
  openAlert: () => void;
  closeAlert: () => void;
  alertDraft: AlertDraft;
  setAlertDraft: (patch: Partial<AlertDraft>) => void;
  alertError: string;
  saveAlert: () => void;
}

const UiContext = createContext<UiValue | null>(null);

const DEFAULT_DRAFT: AlertDraft = {
  type: "instock", scope: "portfolio", retailer: "all", threshold: "95",
  frequency: "Daily digest", channel: "Email digest",
};

/** Chrome state shared by the sidebar, header and the "Create alert" dialog
 *  — reachable from every page, so it lives above the router rather than in
 *  any one page component. */
export function UiProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [notifDismissed, setNotifDismissed] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertDraft, setAlertDraftState] = useState<AlertDraft>(DEFAULT_DRAFT);
  const [alertError, setAlertError] = useState("");
  const seq = useRef(0);

  const toast = (text: string) => {
    const id = ++seq.current;
    setToasts((t) => t.concat({ id, text }));
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  };

  const setAlertDraft = (patch: Partial<AlertDraft>) => setAlertDraftState((d) => ({ ...d, ...patch }));

  const saveAlert = () => {
    const t = String(alertDraft.threshold).trim();
    if (!t || isNaN(Number(t))) { setAlertError("Enter a numeric threshold."); return; }
    const type = alertTypes.find((x) => x.id === alertDraft.type) || alertTypes[0];
    setAlertOpen(false);
    setAlertError("");
    toast(type.name + " alert created at " + t + type.unit + ".");
  };

  const value: UiValue = {
    collapsed, toggleCollapse: () => setCollapsed((c) => !c),
    toasts, toast,
    notifDismissed, markAllRead: () => { setNotifDismissed(true); toast("All notifications marked as read."); },
    notifications: notificationFeed,
    alertOpen, openAlert: () => { setAlertOpen(true); setAlertError(""); }, closeAlert: () => { setAlertOpen(false); setAlertError(""); },
    alertDraft, setAlertDraft, alertError, saveAlert,
  };
  return <UiContext.Provider value={value}>{children}</UiContext.Provider>;
}

export function useUi() {
  const ctx = useContext(UiContext);
  if (!ctx) throw new Error("useUi must be used within UiProvider");
  return ctx;
}
