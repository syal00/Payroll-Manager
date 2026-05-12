import Link from "next/link";
import { Bell, Search, User } from "lucide-react";

export default function EmployeeAccessHubPage() {
  const brand = process.env.NEXT_PUBLIC_COMPANY_NAME ?? "Payroll Manager";

  return (
    <div className="employee-portal-hub flex min-h-screen flex-col bg-[var(--color-page-bg)]">
      <header className="portal-hub-header sticky top-0 z-50 border-b border-white/[0.06] bg-[#0b1220] text-white shadow-[0_1px_0_rgba(255,255,255,0.04)]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between gap-3 sm:h-[60px] sm:gap-4">
            <Link href="/employee-access" className="flex min-w-0 items-center gap-2.5">
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-primary)] text-[13px] font-extrabold tracking-tight text-white shadow-[var(--shadow-violet)]"
                aria-hidden
              >
                PM
              </span>
              <span className="truncate text-[15px] font-semibold tracking-tight">{brand}</span>
            </Link>

            <nav
              className="hidden items-center gap-8 text-[13px] font-medium md:absolute md:left-1/2 md:flex md:-translate-x-1/2"
              aria-label="Primary"
            >
              <a href="#employee-portal" className="text-white">
                Employee Portal
              </a>
              <Link href="/login" className="text-white/75 transition-colors hover:text-white">
                Admin Access
              </Link>
              <a href="#help" className="text-white/75 transition-colors hover:text-white">
                Help
              </a>
            </nav>

            <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-full text-white/85 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Account"
              >
                <User className="h-[18px] w-[18px]" strokeWidth={2} />
              </button>
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-full text-white/85 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Notifications"
              >
                <Bell className="h-[18px] w-[18px]" strokeWidth={2} />
              </button>
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-full text-white/85 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Search"
              >
                <Search className="h-[18px] w-[18px]" strokeWidth={2} />
              </button>
            </div>
          </div>

          <nav
            className="flex items-center justify-center gap-6 border-t border-white/[0.08] py-3 text-[13px] font-medium md:hidden"
            aria-label="Primary mobile"
          >
            <a href="#employee-portal" className="text-white">
              Employee Portal
            </a>
            <Link href="/login" className="text-white/75">
              Admin Access
            </Link>
            <a href="#help" className="text-white/75">
              Help
            </a>
          </nav>
        </div>
      </header>

      <main className="portal-hub-main flex flex-1 flex-col px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6">
          <section
            id="employee-portal"
            className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-[var(--shadow-card)] sm:p-10"
          >
            <div className="mx-auto max-w-2xl text-center">
              <h1 className="text-xl font-bold tracking-tight text-[var(--color-text-primary)] sm:text-2xl">
                Employee Portal
              </h1>
              <p className="mt-3 text-[15px] leading-relaxed text-[var(--color-text-primary)] sm:text-base">
                Create your profile once, then return anytime with your work email—no password to remember.
              </p>
              <a
                href="#access-options"
                className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-[var(--color-primary)] px-8 text-[14px] font-semibold text-white shadow-[var(--shadow-sm)] transition-[var(--transition-base)] hover:bg-[var(--color-primary-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
              >
                Get started
              </a>
            </div>
          </section>

          <div id="access-options" className="grid flex-1 gap-6 md:grid-cols-2 md:items-stretch">
            <section className="flex flex-col rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-[var(--shadow-card)] sm:p-9">
              <h2 className="text-lg font-bold tracking-tight text-[var(--color-text-primary)]">
                Create Employee ID
              </h2>
              <p className="mt-3 flex-1 text-[15px] leading-relaxed text-[var(--color-text-primary)]">
                New here? Add your name and work email. We assign an ID (e.g., EMP001) and open your dashboard.
              </p>
              <Link
                href="/employee-access/register"
                className="mt-8 inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-[var(--color-primary)] px-6 text-[14px] font-semibold text-white shadow-[var(--shadow-sm)] transition-[var(--transition-base)] hover:bg-[var(--color-primary-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
              >
                Get started
              </Link>
            </section>

            <section className="flex flex-col rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-[var(--shadow-card)] sm:p-9">
              <h2 className="text-lg font-bold tracking-tight text-[var(--color-text-primary)]">
                I already have a profile
              </h2>
              <p className="mt-3 flex-1 text-[15px] leading-relaxed text-[var(--color-text-primary)]">
                Enter the email you used before. We&apos;ll send you straight to your hours and payslips.
              </p>
              <Link
                href="/employee-access/existing"
                className="mt-8 inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-[var(--color-border-strong)] bg-white px-6 text-[14px] font-semibold text-[var(--color-text-primary)] shadow-[var(--shadow-xs)] transition-[var(--transition-base)] hover:border-[var(--color-border-focus)] hover:bg-[var(--color-surface-secondary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
              >
                Continue
              </Link>
            </section>
          </div>

          <p
            id="help"
            className="text-center text-[13px] leading-relaxed text-[var(--color-text-secondary)] sm:text-[14px]"
          >
            Questions? Contact your payroll administrator, or use <strong className="font-semibold text-[var(--color-text-primary)]">Admin Access</strong> if you manage payroll.
          </p>

          <p className="mt-auto pb-2 pt-6 text-center text-[14px]">
            <Link
              href="/login"
              className="font-medium text-[var(--color-primary)] underline-offset-4 transition-colors hover:text-[var(--color-primary-hover)] hover:underline"
            >
              Administrator sign in
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
