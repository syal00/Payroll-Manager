"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, Eye, EyeOff, Lock, Mail, Shield, Timer, Zap } from "lucide-react";
import { LoginBrandIllustration } from "@/components/auth/LoginBrandIllustration";
import { DEMO_ADMIN_PASSWORD, DEMO_CREDENTIALS } from "@/lib/demo-credentials";
import { ForgotAccessModal } from "@/components/auth/ForgotAccessModal";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Login failed");
        return;
      }
      window.location.href = data.redirect ?? "/";
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  const brand = process.env.NEXT_PUBLIC_COMPANY_NAME ?? "Syal Operations Group";

  return (
    <div className="login-root">
      <ForgotAccessModal open={forgotOpen} onClose={() => setForgotOpen(false)} />
      <div className="login-brand">
        <LoginBrandIllustration />
        <div className="login-brand-content">
          <div className="login-brand-logo-row">
            <div className="login-brand-logo-icon" aria-hidden>
              <Zap className="h-5 w-5 text-white" strokeWidth={2.5} fill="white" />
            </div>
            <span className="login-brand-logo-name">{brand}</span>
          </div>

          <div className="login-brand-body">
            <h1 className="login-brand-headline">
              Intelligent Payroll,
              <br />
              Perfectly on <span>Autopilot</span>
            </h1>
            <p className="login-brand-desc">
              Streamline your entire payroll lifecycle from hours-to-paycheck, eliminating spreadsheets and human error.
            </p>

            <div className="login-features">
              <div className="login-feature">
                <div className="login-feature-icon">
                  <Timer className="h-4 w-4" aria-hidden />
                </div>
                <span>Real-time timesheet visibility across your team</span>
              </div>
              <div className="login-feature">
                <div className="login-feature-icon">
                  <Shield className="h-4 w-4" aria-hidden />
                </div>
                <span>Role-based access with a clean audit trail</span>
              </div>
            </div>
          </div>

          <p className="login-brand-footer">Encrypted session · Built for modern teams</p>
        </div>
      </div>

      <div className="login-form-panel">
        <div className="login-form-box">
          <p className="login-form-eyebrow small-label">Administrator</p>
          <h2 className="login-form-title dashboard-title">Welcome back</h2>
          <p className="login-form-sub">
            Sign in with your admin email and password. Employees use the portal separately—no shared password.
          </p>

          <form onSubmit={onSubmit}>
            {error && (
              <div className="login-alert-error mb-4" role="alert">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-danger)]" aria-hidden />
                <span>{error}</span>
              </div>
            )}

            <div className="login-fields">
              <div className="form-group">
                <label className="form-label" htmlFor="email">
                  Email
                </label>
                <div className="form-input-icon-wrapper">
                  <Mail className="form-input-icon" aria-hidden />
                  <input
                    id="email"
                    type="email"
                    autoComplete="username"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="form-input !pl-10"
                    placeholder="you@company.com"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="password">
                  Password
                </label>
                <div className="form-input-icon-wrapper">
                  <Lock className="form-input-icon" aria-hidden />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="form-input !pr-11 !pl-10"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-[var(--color-text-muted)] transition hover:bg-[var(--color-accent-soft)] hover:text-[var(--color-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    aria-pressed={showPassword}
                    title={showPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowPassword((v) => !v)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" strokeWidth={2} /> : <Eye className="h-4 w-4" strokeWidth={2} />}
                  </button>
                </div>
                <p className="form-hint">Use a password unique to this account.</p>
              </div>
            </div>

            <div className="login-forgot-row">
              <button
                type="button"
                className="text-sm text-[var(--color-accent-light)] underline decoration-[var(--color-accent-tint)] underline-offset-2 hover:text-[var(--color-accent)]"
                onClick={() => setForgotOpen(true)}
              >
                Forgot access? Contact your payroll owner.
              </button>
            </div>

            <button type="submit" className="login-submit btn-text" disabled={loading}>
              {loading ? (
                <span className="inline-flex items-center justify-center gap-2">
                  <span
                    className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
                    aria-hidden
                  />
                  Signing in…
                </span>
              ) : (
                "Sign in as admin"
              )}
            </button>
          </form>

          <div className="login-divider">
            <div className="login-divider-line" />
            <span className="login-divider-text">or</span>
            <div className="login-divider-line" />
          </div>

          <Link href="/employee-access" className="login-sso-btn btn-text">
            Continue to employee portal
          </Link>

          <div className="login-signup-row text-balance">
            <p className="font-medium text-[var(--color-text-secondary)]">Demo admin accounts (after seed)</p>
            <p className="mt-2 text-xs leading-relaxed">
              Password for both:{" "}
              <code className="rounded bg-[var(--color-accent-soft)] border border-[var(--color-accent-tint)] px-1.5 py-0.5 font-mono font-semibold text-[var(--color-accent-light)]">
                {DEMO_ADMIN_PASSWORD}
              </code>
            </p>
            <ul className="mt-2 space-y-1 text-left text-xs">
              <li>
                <code className="font-mono text-[var(--color-text-secondary)]">{DEMO_CREDENTIALS.admin.email}</code>
              </li>
              <li>
                <code className="font-mono text-[var(--color-text-secondary)]">{DEMO_CREDENTIALS.manager.email}</code>
              </li>
            </ul>
            <p className="mt-2 text-[11px] text-[var(--color-text-muted)]">
              Run <code className="font-mono">npm run setup</code> or <code className="font-mono">npm run db:seed</code> to refresh demo data.
            </p>
          </div>

          <div className="login-back-home">
            <Link href="/" className="login-back-home-link">
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
