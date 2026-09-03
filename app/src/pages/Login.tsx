import { useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { catalog, retailers, user } from "../data/mockData";
import { Badge } from "../components/ui/Badge";

const STATS = [
  { label: "Tracked SKUs", value: String(catalog.length) },
  { label: "Retailers monitored", value: String(retailers.length - 1) },
  { label: "Source crawl", value: "Sep 2022" },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const from = (location.state as { from?: string } | null)?.from || "/overview";

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("Enter an email and password to continue.");
      return;
    }
    login();
    navigate(from, { replace: true });
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", width: "100%" }}>
      <div
        style={{
          flex: "1 1 42%", display: "flex", flexDirection: "column", justifyContent: "space-between",
          padding: "40px 44px", background: "var(--sidebar-bg)", color: "var(--sidebar-text)",
          minWidth: 320,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div className="sl-brand-mark" style={{ width: 34, height: 34, fontSize: 14 }}>SL</div>
          <div style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 18 }}>Shelfline</div>
          <span style={{ marginLeft: "auto" }}>
            <Badge tone="positive">
              <span
                style={{
                  width: 6, height: 6, borderRadius: "50%",
                  background: "var(--status-positive-fg)", animation: "sl-pulse 1.6s ease-in-out infinite",
                }}
              />
              All systems live
            </Badge>
          </span>
        </div>

        <div style={{ maxWidth: 380 }}>
          <div className="sl-eyebrow" style={{ color: "var(--sidebar-muted)", marginBottom: 10 }}>Digital shelf intelligence</div>
          <h1 style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 30, lineHeight: 1.25, margin: "0 0 14px" }}>
            Availability, pricing, content, and rank — tracked across every retailer you sell on.
          </h1>
          <p style={{ color: "var(--sidebar-muted)", fontSize: 14, lineHeight: 1.6, margin: 0 }}>
            This workspace runs on a real September 2022 crawl across {retailers.slice(1).map((r) => r.name).join(", ")}.
          </p>
          <div style={{ display: "flex", gap: 28, marginTop: 28 }}>
            {STATS.map((s) => (
              <div key={s.label}>
                <div style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 22 }}>{s.value}</div>
                <div style={{ color: "var(--sidebar-muted)", fontSize: 12 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ color: "var(--sidebar-muted)", fontSize: 11.5 }}>© 2026 Shelfline. Internal demo workspace.</div>
      </div>

      <div style={{ flex: "1 1 58%", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--surface-page)", padding: 32 }}>
        <form onSubmit={submit} style={{ width: "100%", maxWidth: 360 }}>
          <h2 style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 22, margin: "0 0 6px" }}>Sign in</h2>
          <p className="sl-muted" style={{ fontSize: 13.5, margin: "0 0 26px" }}>Welcome back to your digital shelf workspace.</p>

          <label style={{ display: "block", fontSize: 12.5, fontWeight: 500, color: "var(--text-label)", marginBottom: 6 }}>Email</label>
          <input
            className="input" type="email" autoFocus placeholder="you@company.com" value={email}
            onChange={(e) => { setEmail(e.target.value); setError(""); }}
            style={{ width: "100%", marginBottom: 16 }}
          />

          <label style={{ display: "block", fontSize: 12.5, fontWeight: 500, color: "var(--text-label)", marginBottom: 6 }}>Password</label>
          <input
            className="input" type="password" placeholder="••••••••" value={password}
            onChange={(e) => { setPassword(e.target.value); setError(""); }}
            style={{ width: "100%", marginBottom: 8 }}
          />

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "4px 0 20px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12.5, color: "var(--text-secondary)" }}>
              <input type="checkbox" style={{ margin: 0 }} /> Remember me
            </label>
            <span className="sl-faint" style={{ fontSize: 12.5 }}>Forgot password?</span>
          </div>

          {error && <div style={{ color: "var(--status-critical-fg)", fontSize: 12.5, marginBottom: 14 }}>{error}</div>}

          <button type="submit" className="btn btn-primary" style={{ width: "100%", justifyContent: "center", height: 40 }}>Sign in</button>

          <div
            style={{
              marginTop: 20, padding: "10px 12px", borderRadius: "var(--radius-sm)",
              background: "var(--surface-secondary)", border: "1px solid var(--border-subtle)",
              fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5,
            }}
          >
            Demo workspace — there is no backend behind this POC, so any email and password will sign you in as <strong>{user.name}</strong>.
          </div>
        </form>
      </div>
    </div>
  );
}
