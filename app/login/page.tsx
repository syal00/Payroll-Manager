"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, Eye, EyeOff, Lock, Mail, Sparkles } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

  const brand = process.env.NEXT_PUBLIC_COMPANY_NAME ?? "Payroll Manager";

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#05020c] text-slate-100">
      {/* Mobile / stacked: cosmic backdrop */}
      <div className="login-space-panel login-starfield absolute inset-0 lg:hidden" aria-hidden />
      <div
        className="login-orb -left-20 top-1/4 h-72 w-72 bg-violet-600/30 opacity-70 lg:hidden"
        aria-hidden
      />
      <div
        className="login-orb right-0 top-0 h-96 w-96 bg-blue-600/20 opacity-60 lg:hidden"
        aria-hidden
      />

      <div className="relative grid min-h-screen lg:grid-cols-2">
        {/* Left — branded space panel (desktop) */}
        <div className="relative hidden flex-col justify-between overflow-hidden login-space-panel px-10 py-14 text-white lg:flex xl:px-14 xl:py-16">
          <div className="login-starfield" aria-hidden />
          <div
            className="login-orb -left-32 top-1/4 h-[28rem] w-[28rem] bg-violet-600/40"
            aria-hidden
          />
          <div
            className="login-orb right-[-10%] top-[-10%] h-[22rem] w-[22rem] bg-indigo-500/35"
            aria-hidden
          />
          <div
            className="login-orb bottom-[-20%] left-[20%] h-[20rem] w-[20rem] bg-blue-600/25"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#05020c]/90 via-transparent to-transparent"
            aria-hidden
          />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium tracking-wide text-violet-200/90 backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-violet-300" aria-hidden />
              {brand}
            </div>
          </div>

          <div className="relative z-10 mt-auto max-w-xl pb-4">
            <h1 className="text-4xl font-bold leading-[1.1] tracking-tight xl:text-5xl">
              Manage payroll with clarity and confidence
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-slate-300/95">
              Track employee hours, review submissions, and manage pay periods in one streamlined
              workspace.
            </p>
            <div className="mt-10 h-px max-w-xs bg-gradient-to-r from-violet-400/60 via-transparent to-transparent" />
            <p className="mt-6 text-sm text-slate-400">
              Secure admin access · Real-time visibility · Built for modern teams
            </p>
          </div>
        </div>

        {/* Right — sign-in */}
        <div className="relative flex flex-col justify-center px-4 py-12 sm:px-8 lg:px-12 xl:px-16">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-violet-950/20 via-transparent to-blue-950/10 lg:bg-none" aria-hidden />

          <div className="relative z-10 mx-auto w-full max-w-[420px]">
            <div className="mb-8 text-center lg:text-left">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-[0_0_40px_-8px_rgba(139,92,246,0.7)] ring-1 ring-white/20 lg:mx-0">
                <Sparkles className="h-7 w-7 text-white" aria-hidden />
              </div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-400/90">{brand}</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">Sign in</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                Welcome back. Access your payroll dashboard and manage operations securely.
              </p>
            </div>

            <div className="rounded-2xl border border-white/[0.1] bg-white/[0.05] p-6 shadow-[0_0_0_1px_rgba(139,92,246,0.08),0_32px_64px_-32px_rgba(0,0,0,0.8),0_0_80px_-20px_rgba(139,92,246,0.25)] backdrop-blur-2xl sm:p-8">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-slate-500">
                Sign in to continue
              </p>
              <p className="mt-2 text-[0.9375rem] leading-relaxed text-slate-400">
                Administrator credentials. Employees use the portal below—no password required.
              </p>

              <form onSubmit={onSubmit} className="mt-7 flex flex-col gap-5">
                {error && (
                  <div className="login-alert-error" role="alert">
                    <AlertCircle
                      className="mt-0.5 h-4 w-4 shrink-0 text-rose-400/90"
                      aria-hidden
                    />
                    <span>{error}</span>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="label-field text-slate-300" htmlFor="email">
                      Email
                    </label>
                    <div className="relative mt-2">
                      <Mail
                        className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
                        aria-hidden
                      />
                      <input
                        id="email"
                        type="email"
                        autoComplete="username"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="input-field input-field--icon"
                        placeholder="you@company.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="label-field text-slate-300" htmlFor="password">
                      Password
                    </label>
                    <div className="relative mt-2">
                      <Lock
                        className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
                        aria-hidden
                      />
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="input-field input-field--icon pr-12"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/10 hover:text-violet-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        aria-pressed={showPassword}
                        title={showPassword ? "Hide password" : "Show password"}
                        onClick={() => setShowPassword((v) => !v)}
                      >
                        {/* Open eye = password hidden (tap to reveal); strikethrough eye = visible (tap to hide) */}
                        {showPassword ? <EyeOff className="h-4 w-4" strokeWidth={2} /> : <Eye className="h-4 w-4" strokeWidth={2} />}
                      </button>
                    </div>
                    <p className="mt-2 text-[0.75rem] leading-normal text-slate-500">
                      Use a strong password unique to this account.
                    </p>
                  </div>
                </div>

                <div className="pt-1">
                  <button type="submit" className="btn-gradient" disabled={loading}>
                    {loading ? (
                      <span className="inline-flex items-center gap-2">
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
                </div>
              </form>

              <div className="mt-7 border-t border-white/10 pt-6">
                <p className="text-center text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Employee portal
                </p>
                <p className="mt-1.5 text-center text-[0.8125rem] leading-snug text-slate-400">
                  Need to submit work hours? Continue as employee.
                </p>
                <Link href="/employee-access" className="btn-glass-outline mt-3">
                  Employee portal
                </Link>
              </div>

              <p className="mt-6 text-center text-[0.7rem] text-slate-500">
                Demo admin{" "}
                <span className="rounded-md bg-white/5 px-2 py-0.5 font-mono text-slate-400 ring-1 ring-white/10">
                  anmolchahal871@gmail.com
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
