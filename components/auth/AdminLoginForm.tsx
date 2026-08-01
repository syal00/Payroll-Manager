"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, Check, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { ForgotAccessModal } from "@/components/auth/ForgotAccessModal";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { APP_NAME } from "@/lib/brand";
import "@/app/login/login.css";

const FEATURES = [
  "Real-time timesheet visibility across your team",
  "Automated payroll calculations with audit trails",
  "Role-based access for admins and managers",
] as const;

type AdminLoginFormProps = {
  companyName?: string | null;
  companyLogoUrl?: string | null;
};

function AuthBrandPanel({ companyName, companyLogoUrl }: AdminLoginFormProps) {
  return (
    <div className="login-brand">
      <div className="login-brand-illus-bg" aria-hidden />
      <div className="login-brand-overlay-main" aria-hidden />
      <div className="login-brand-content">
        <BrandLogo
          size={44}
          priority
          logoSrc={companyLogoUrl}
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
            <span>{companyName ?? APP_NAME}</span>
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

export function AdminLoginForm({ companyName, companyLogoUrl }: AdminLoginFormProps) {
  const [step, setStep] = useState<"credentials" | "2fa">("credentials");
  const [twoFaMode, setTwoFaMode] = useState<"setup" | "verify">("verify");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [challengeToken, setChallengeToken] = useState<string | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [setupKey, setSetupKey] = useState<string | null>(null);
  const [setupKeyCopied, setSetupKeyCopied] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [mustChangePassword, setMustChangePassword] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Login failed");
        return;
      }
      if (data.requires2fa) {
        setChallengeToken(data.challengeToken ?? null);
        setTwoFaMode(data.mode === "setup" ? "setup" : "verify");
        setQrCodeDataUrl(typeof data.qrCodeDataUrl === "string" ? data.qrCodeDataUrl : null);
        setSetupKey(typeof data.setupKey === "string" ? data.setupKey : null);
        setInfo(
          typeof data.message === "string"
            ? data.message
            : twoFaMode === "setup"
              ? "Set up Microsoft Authenticator to continue."
              : "Enter the code from your authenticator app."
        );
        setMustChangePassword(Boolean(data.mustChangePassword));
        setOtpCode("");
        setStep("2fa");
        return;
      }
      window.location.href = data.redirect ?? "/";
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  async function onVerify2fa(e: React.FormEvent) {
    e.preventDefault();
    if (!challengeToken) {
      setError("Verification session expired. Sign in again.");
      setStep("credentials");
      return;
    }
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login/verify-2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ challengeToken, code: otpCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Verification failed");
        return;
      }
      window.location.href = data.redirect ?? "/admin";
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  async function copySetupKey() {
    if (!setupKey) return;
    await navigator.clipboard.writeText(setupKey);
    setSetupKeyCopied(true);
    setTimeout(() => setSetupKeyCopied(false), 2000);
  }

  function backToCredentials() {
    setStep("credentials");
    setChallengeToken(null);
    setQrCodeDataUrl(null);
    setSetupKey(null);
    setOtpCode("");
    setError(null);
    setInfo(null);
    setMustChangePassword(false);
    setTwoFaMode("verify");
  }

  return (
    <div className="login-root">
      <ForgotAccessModal open={forgotOpen} onClose={() => setForgotOpen(false)} />
      <AuthBrandPanel companyName={companyName} companyLogoUrl={companyLogoUrl} />

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
                logoSrc={companyLogoUrl}
                wrapperClassName="login-brand-logo-row"
                imageClassName="brand-logo-img login-brand-logo-img"
                textWrapperClassName="login-brand-logo-text"
                nameClassName="login-brand-logo-name"
                tagClassName="login-brand-logo-tag"
              />
            </div>

            <p className="login-form-eyebrow">{step === "2fa" ? "Two-factor auth" : "Sign in"}</p>
            <h2 className="login-form-title">
              {step === "2fa"
                ? twoFaMode === "setup"
                  ? "Set up authenticator"
                  : "Authenticator code"
                : "Welcome back"}
            </h2>
            <p className="login-form-sub">
              {step === "2fa"
                ? twoFaMode === "setup"
                  ? `Scan the QR code with Microsoft Authenticator, or enter the setup key manually. Then enter the 6-digit code (refreshes every 30 seconds).${mustChangePassword ? " You will set a new password after verification." : ""}`
                  : `Open Microsoft Authenticator and enter the current 6-digit code for PayRun.${mustChangePassword ? " You will set a new password after verification." : ""}`
                : "Sign in with your contact email and password."}
            </p>

            {step === "2fa" ? (
              <form onSubmit={onVerify2fa}>
                {error && (
                  <div className="login-alert-error mb-4" role="alert">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-danger)]" aria-hidden />
                    <span>{error}</span>
                  </div>
                )}
                {info && !error && (
                  <div className="mb-4 rounded-lg border border-[var(--color-info-border)] bg-[var(--color-info-bg)] px-3 py-2.5 text-sm text-[var(--color-info-text)]">
                    {info}
                  </div>
                )}
                {twoFaMode === "setup" && qrCodeDataUrl && (
                  <div className="mb-5 flex flex-col items-center gap-4 rounded-xl border border-[var(--color-border)] bg-white p-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={qrCodeDataUrl}
                      alt="QR code for Microsoft Authenticator setup"
                      width={220}
                      height={220}
                      className="rounded-lg"
                    />
                    {setupKey && (
                      <div className="w-full text-center">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Setup key</p>
                        <p className="mt-1 break-all font-mono text-sm text-slate-800">{setupKey}</p>
                        <button
                          type="button"
                          className="login-forgot-link mt-2 text-xs"
                          onClick={() => void copySetupKey()}
                        >
                          {setupKeyCopied ? "Copied!" : "Copy setup key"}
                        </button>
                      </div>
                    )}
                  </div>
                )}
                <div className="login-fields">
                  <div>
                    <label className="login-field-label" htmlFor="otp-code">
                      {twoFaMode === "setup" ? "Confirm with authenticator code" : "Authenticator code"}
                    </label>
                    <div className="login-field-box">
                      <input
                        id="otp-code"
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        required
                        maxLength={6}
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        className="login-field-input font-mono tracking-[0.25em]"
                        placeholder="000000"
                      />
                    </div>
                    <p className="mt-1.5 text-xs text-slate-500">Codes refresh every 30 seconds.</p>
                  </div>
                </div>
                <button type="submit" className="login-submit" disabled={loading || otpCode.length < 6}>
                  {loading ? "Verifying…" : twoFaMode === "setup" ? "Complete setup" : "Verify and continue"}
                </button>
                <div className="mt-4">
                  <button type="button" className="login-forgot-link text-sm" onClick={backToCredentials}>
                    ← Back to sign in
                  </button>
                </div>
              </form>
            ) : (
            <form onSubmit={onSubmit}>
              {error && (
                <div className="login-alert-error mb-4" role="alert">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-danger)]" aria-hidden />
                  <span>{error}</span>
                </div>
              )}

              <div className="login-fields">
                <div>
                  <label className="login-field-label" htmlFor="username">
                    Email
                  </label>
                  <div className="login-field-box">
                    <span className="login-field-icon-badge" aria-hidden>
                      <Mail strokeWidth={1.75} />
                    </span>
                    <input
                      id="username"
                      type="text"
                      autoComplete="username"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
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
            )}

            {step === "credentials" && (
            <>
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
            </>
            )}

            {step === "2fa" && (
            <p className="login-legal-links mt-6">
              <a href="#">Privacy</a>
              <span aria-hidden>·</span>
              <a href="#">Terms</a>
            </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
