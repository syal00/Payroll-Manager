"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, Check, Clock3, ShieldCheck } from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
  const brand = process.env.NEXT_PUBLIC_COMPANY_NAME ?? "Syal Operations Group";
  const brandUpper = brand.toUpperCase();

  function gotoLogin() {
    router.push("/login");
  }

  function gotoEmployee() {
    router.push("/employee-access");
  }

  return (
    <div className="landing-root">
      <nav className="landing-nav">
        <div className="landing-logo-row">
          <div className="landing-logo-icon" aria-hidden>
            <LightningBolt />
          </div>
          <span className="landing-logo-text">{brandUpper}</span>
        </div>
        <div className="landing-nav-right">
          <button type="button" className="landing-nav-signin" onClick={gotoLogin}>
            Sign in
          </button>
          <button type="button" className="landing-nav-cta" onClick={gotoLogin}>
            Request a Demo
          </button>
        </div>
      </nav>

      <main className="landing-hero">
        <div className="landing-hero-visual" aria-hidden>
          <img
            src="/bg-images/bg-image-landing.png"
            alt="Payroll illustration"
            className="landing-hero-bg-img"
            width={1920}
            height={1080}
            decoding="async"
          />
          <div className="landing-hero-fade landing-hero-fade-left" />
          <div className="landing-hero-fade landing-hero-fade-bottom" />
        </div>
        <div className="landing-hero-content">
          <h1 className="landing-headline">
            Intelligent Payroll,
            <br />
            Perfectly on <span className="headline-accent">Autopilot</span>
          </h1>

          <p className="landing-sub">
            Streamline your entire payroll lifecycle from hours-to-paycheck, eliminating spreadsheets and human error.
          </p>

          <ul className="landing-features-inline">
            <li className="feature-item">
              <span className="feature-icon-inline">
                <Clock3 className="h-4 w-4" strokeWidth={2} aria-hidden />
              </span>
              Real-time timesheet visibility across your team
            </li>
            <li className="feature-item">
              <span className="feature-icon-inline">
                <ShieldCheck className="h-4 w-4" strokeWidth={2} aria-hidden />
              </span>
              Role-based access with a clean audit trail
            </li>
          </ul>

          <div className="landing-cta-row">
            <button type="button" className="landing-primary-cta" onClick={gotoLogin}>
              Book a Demo
              <ArrowRight className="h-4 w-4" strokeWidth={2.5} aria-hidden />
            </button>
            <button type="button" className="landing-secondary-cta" onClick={gotoEmployee}>
              Employee portal
            </button>
          </div>
        </div>
      </main>

      <section className="landing-feature-cards" aria-label="Key features">
        <div className="landing-fcard">
          <div className="landing-fcard-icon">
            <Clock3 className="h-5 w-5" strokeWidth={2} aria-hidden />
          </div>
          <div className="landing-fcard-title">Real-Time Visibility</div>
          <p className="landing-fcard-desc">
            Real-time timesheet visibility across your team
          </p>
        </div>
        <div className="landing-fcard">
          <div className="landing-fcard-icon">
            <ShieldCheck className="h-5 w-5" strokeWidth={2} aria-hidden />
          </div>
          <div className="landing-fcard-title">Audit Trail</div>
          <p className="landing-fcard-desc">
            Role-based access with a clean audit trail
          </p>
        </div>
        <div className="landing-fcard">
          <div className="landing-fcard-icon">
            <Check className="h-5 w-5" strokeWidth={2.5} aria-hidden />
          </div>
          <div className="landing-fcard-title">Precision Payslips</div>
          <p className="landing-fcard-desc">
            Payslips generated from approved hours — not guesswork
          </p>
        </div>
      </section>

      <section className="landing-stats" aria-label="Trust metrics">
        <div className="stat-pill">
          <span className="stat-num stat-num-accent">99.9%</span>
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
      </section>

      <section className="landing-logos" aria-label="Customers">
        <div className="landing-logos-title">Trusted by leaders across industries</div>
      </section>
    </div>
  );
}

function LightningBolt() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
        fill="#fff"
      />
    </svg>
  );
}

