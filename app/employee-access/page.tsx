import Link from "next/link";
import { ArrowRight, Mail, Shield, UserPlus, Zap } from "lucide-react";
import { LoginBrandIllustration } from "@/components/auth/LoginBrandIllustration";

export default function EmployeeAccessHubPage() {
  const brand = (process.env.NEXT_PUBLIC_COMPANY_NAME ?? "Syal Operations Group").toUpperCase();

  return (
    <div className="login-root">
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
              Your Work,
              <br />
              Your Hours, <span>Your Pay</span>
            </h1>
            <p className="login-brand-desc">
              Log into the employee portal with just your work email — no passwords to remember.
              Submit hours, track approvals, and download payslips, all in one place.
            </p>

            <div className="login-features">
              <div className="login-feature">
                <div className="login-feature-icon">
                  <Mail className="h-4 w-4" aria-hidden />
                </div>
                <span>Sign in with your work email — no password required</span>
              </div>
              <div className="login-feature">
                <div className="login-feature-icon">
                  <Shield className="h-4 w-4" aria-hidden />
                </div>
                <span>Your data is private to you and your payroll administrator</span>
              </div>
            </div>
          </div>

          <p className="login-brand-footer">Encrypted session · Employee privacy first</p>
        </div>
      </div>

      <div className="login-form-panel">
        <div className="login-form-box">
          <p className="login-form-eyebrow small-label">Employee Portal</p>
          <h2 className="login-form-title dashboard-title">Welcome</h2>
          <p className="login-form-sub">
            Choose how you&rsquo;d like to access your dashboard. New employees get a fresh ID;
            returning employees pick up right where they left off.
          </p>

          <div className="flex flex-col gap-4">
            <Link
              href="/employee-access/register"
              className="group relative flex items-start gap-4 rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-bg-card)] p-5 transition-all hover:border-[var(--color-accent)] hover:bg-[var(--color-accent-soft)]"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[var(--color-accent-soft)] text-[var(--color-accent)] ring-1 ring-[var(--color-accent-tint)]">
                <UserPlus className="h-5 w-5" strokeWidth={2} aria-hidden />
              </span>
              <span className="flex-1">
                <span className="font-display block text-[15px] font-bold text-[var(--color-text-primary)]">
                  New Employee
                </span>
                <span className="mt-1 block text-[13px] leading-relaxed text-[var(--color-text-secondary)]">
                  Enter your name + email, get an ID (e.g. EMP001) and open your dashboard.
                </span>
              </span>
              <ArrowRight
                className="mt-1 h-4 w-4 shrink-0 text-[var(--color-text-muted)] transition group-hover:translate-x-1 group-hover:text-[var(--color-accent)]"
                strokeWidth={2.5}
                aria-hidden
              />
            </Link>

            <Link
              href="/employee-access/existing"
              className="group relative flex items-start gap-4 rounded-xl border border-[var(--color-border)] bg-transparent p-5 transition-all hover:border-[var(--color-accent-tint)] hover:bg-[var(--color-accent-soft)]"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[var(--color-accent-soft)] text-[var(--color-accent)] ring-1 ring-[var(--color-accent-tint)]">
                <Mail className="h-5 w-5" strokeWidth={2} aria-hidden />
              </span>
              <span className="flex-1">
                <span className="font-display block text-[15px] font-bold text-[var(--color-text-primary)]">
                  Returning Employee
                </span>
                <span className="mt-1 block text-[13px] leading-relaxed text-[var(--color-text-secondary)]">
                  Enter the email you used before — straight to your hours and payslips.
                </span>
              </span>
              <ArrowRight
                className="mt-1 h-4 w-4 shrink-0 text-[var(--color-text-muted)] transition group-hover:translate-x-1 group-hover:text-[var(--color-accent)]"
                strokeWidth={2.5}
                aria-hidden
              />
            </Link>
          </div>

          <div className="login-divider">
            <div className="login-divider-line" />
            <span className="login-divider-text">or</span>
            <div className="login-divider-line" />
          </div>

          <Link href="/login" className="login-sso-btn">
            Administrator sign in
          </Link>

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
