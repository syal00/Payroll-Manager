"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, Check, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { ForgotAccessModal } from "@/components/auth/ForgotAccessModal";
import { BrandLogo } from "@/components/brand/BrandLogo";
import "./login.css";

const FEATURES = [
  "Real-time timesheet visibility across your team",
  "Automated payroll calculations with audit trails",
  "Role-based access for admins and managers",
] as const;

function AuthBrandPanel() {
  return (
    <div className="login-brand">
      <div className="login-brand-illus-bg" aria-hidden />
      <div className="login-brand-overlay-main" aria-hidden />
      <div className="login-brand-content">
        <BrandLogo
          size={44}
          priority
          wrapperClassName="login-brand-logo-row"
          imageClassName="brand-logo-img login-brand-logo-img"
          textWrapperClassName="login-brand-logo-text"
          nameClassName="login-brand-logo-name"
          tagClassName="login-brand-logo-tag"
        />

        <div className="login-brand-body">
          <p className="login-brand-overline">Secure admin access</p>
          <h1 className="login-brand-headline">
            Welcome back to
            <br />
            <span>Syal Operations</span>
          </h1>
          <p className="login-brand-desc">
            Sign in to manage payroll, approvals, and team operations from one secure workspace.
          </p>

          <div className="login-features">
            {FEATURES.map((text) => (
              <div key={text} className="login-feature">
                <div className="login-feature-check">
                  <Check className="h-3.5 w-3.5" aria-hidden strokeWidth={3} />
                </div>
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="login-brand-footer">Encrypted session · Built for modern teams</p>
      </div>
    </div>
  );
}

export function AdminLoginForm() {
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

  return (
    <div className="login-root">
      <ForgotAccessModal open={forgotOpen} onClose={() => setForgotOpen(false)} />
      <AuthBrandPanel />

      <div className="login-form-panel">
        <div className="login-form-topbar">
          <Link href="/" className="login-back-home-link">
            ← Back to home
          </Link>
        </div>

        <div className="login-form-card">
          <div className="login-form-box">
            <div className="login-mobile-brand">
              <BrandLogo
                size={36}
                wrapperClassName="login-brand-logo-row"
                imageClassName="brand-logo-img login-brand-logo-img"
                textWrapperClassName="login-brand-logo-text"
                nameClassName="login-brand-logo-name"
                tagClassName="login-brand-logo-tag"
              />
            </div>

            <p className="login-form-eyebrow">Sign in</p>
            <h2 className="login-form-title">Welcome back</h2>
            <p className="login-form-sub">
              Access your payroll dashboard with your work email and password.
            </p>

            <form onSubmit={onSubmit}>
              {error && (
                <div className="login-alert-error mb-4" role="alert">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-danger)]" aria-hidden />
                  <span>{error}</span>
                </div>
              )}

              <div className="login-fields">
                <div>
                  <label className="login-field-label" htmlFor="email">
                    Email
                  </label>
                  <div className="login-field-box">
                    <span className="login-field-icon-badge" aria-hidden>
                      <Mail strokeWidth={1.75} />
                    </span>
                    <input
                      id="email"
                      type="email"
                      autoComplete="username"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="login-field-input"
                      placeholder="you@company.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="login-field-label" htmlFor="password">
                    Password
                  </label>
                  <div className="login-field-box">
                    <span className="login-field-icon-badge" aria-hidden>
                      <Lock strokeWidth={1.75} />
                    </span>
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="login-field-input"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      className="login-password-toggle"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      aria-pressed={showPassword}
                      onClick={() => setShowPassword((v) => !v)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" strokeWidth={2} /> : <Eye className="h-4 w-4" strokeWidth={2} />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="login-remember-row">
                <label className="login-remember">
                  <input type="checkbox" name="remember" />
                  <span>Remember me</span>
                </label>
                <button
                  type="button"
                  className="login-forgot-link"
                  onClick={() => setForgotOpen(true)}
                >
                  Forgot password?
                </button>
              </div>

              <button type="submit" className="login-submit" disabled={loading}>
                {loading ? (
                  <span className="inline-flex items-center justify-center gap-2">
                    <span
                      className="h-4 w-4 animate-spin rounded-full border-2 border-[#0b1426]/30 border-t-[#0b1426]"
                      aria-hidden
                    />
                    Signing in…
                  </span>
                ) : (
                  "Sign in"
                )}
              </button>
            </form>

            <p className="login-admin-note">
              Need access?{" "}
              <button type="button" className="login-forgot-link" onClick={() => setForgotOpen(true)}>
                Contact your administrator
              </button>
            </p>

            <p className="login-legal-links">
              <a href="#">Privacy</a>
              <span aria-hidden>·</span>
              <a href="#">Terms</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return <AdminLoginForm />;
}
