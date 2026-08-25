import { createContext, useContext, useState, type ReactNode } from "react";

interface AuthValue {
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthValue | null>(null);

const STORAGE_KEY = "shelfline_demo_authed";

/** There is no backend behind this POC, so there is nothing to authenticate
 *  against — this gates navigation for demo purposes only. login() accepts
 *  any credentials by design; see pages/Login.tsx for the disclosure copy. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => sessionStorage.getItem(STORAGE_KEY) === "1");

  const login = () => {
    sessionStorage.setItem(STORAGE_KEY, "1");
    setIsAuthenticated(true);
  };
  const logout = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    setIsAuthenticated(false);
  };

  return <AuthContext.Provider value={{ isAuthenticated, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
