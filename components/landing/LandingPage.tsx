"use client";

import { useRouter } from "next/navigation";

export default function LandingPage() {
  const router = useRouter();
  const brand = process.env.NEXT_PUBLIC_COMPANY_NAME ?? "SYAL OPERATIONS GROUP";

  function handleContinue() {
    router.push("/login");
  }

  return (
    <div className="landing-root">
      <nav className="landing-nav">
        <div className="landing-logo-row">
          <div className="landing-logo-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
                stroke="#fff"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <span className="landing-logo-text">{brand}</span>
        </div>
        <button type="button" className="landing-nav-signin" onClick={handleContinue}>
          Sign in
        </button>
      </nav>

      <main className="landing-hero">
        <div className="blob blob-1" aria-hidden />
        <div className="blob blob-2" aria-hidden />
        <div className="blob blob-3" aria-hidden />

        <div className="landing-content">
          <div className="landing-badge">
            <span className="badge-dot" />
            Built for modern payroll teams
          </div>

          <h1 className="landing-headline">
            Payroll that runs on <span className="headline-accent">autopilot</span>
          </h1>

          <p className="landing-sub">
            Track hours, streamline approvals, and keep every pay period tidy — without drowning in
            spreadsheets.
          </p>

          <ul className="landing-features">
            <li className="feature-item">
              <span className="feature-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                  <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </span>
              Real-time timesheet visibility across your team
            </li>
            <li className="feature-item">
              <span className="feature-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              Role-based access with a clean audit trail
            </li>
            <li className="feature-item">
              <span className="feature-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <polyline
                    points="20 6 9 17 4 12"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              Payslips generated from approved hours — not guesswork
            </li>
          </ul>

          <div className="landing-stats">
            <div className="stat-pill">
              <span className="stat-num">99.9%</span>
              <span className="stat-label">Uptime</span>
            </div>
            <div className="stat-divider" aria-hidden />
            <div className="stat-pill">
              <span className="stat-num">2 min</span>
              <span className="stat-label">Avg payroll run</span>
            </div>
            <div className="stat-divider" aria-hidden />
            <div className="stat-pill">
              <span className="stat-num">0 errors</span>
              <span className="stat-label">Calculation mistakes</span>
            </div>
          </div>
        </div>
      </main>

      <footer className="landing-footer">
        <span className="footer-caption">Encrypted session · Built for modern teams</span>

        <button type="button" className="landing-continue-btn" onClick={handleContinue}>
          Continue to sign in
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M5 12h14M12 5l7 7-7 7"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </footer>
    </div>
  );
}
