"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Check, Clock3, ShieldCheck } from "lucide-react";
import { DemoRequestModal } from "@/components/marketing/DemoRequestModal";
import { MobileMenuHamburger, MobileSlideMenu } from "@/components/MobileMenu";

export default function LandingPage() {
  const router = useRouter();
  const [demoOpen, setDemoOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const brand = process.env.NEXT_PUBLIC_COMPANY_NAME ?? "Syal Operations Group";
  const brandUpper = brand.toUpperCase();

  function gotoEmployee() {
    router.push("/employee-access");
  }

  return (
    <div className="landing-root">
      <DemoRequestModal open={demoOpen} onClose={() => setDemoOpen(false)} />
      <nav className="landing-nav">
        <div className="landing-logo-row">
          <div className="landing-logo-icon" aria-hidden>
            <LightningBolt />
          </div>
          <span className="landing-logo-text nav-brand">{brandUpper}</span>
        </div>
        <div className="landing-nav-right landing-nav-desktop-cta">
          <Link href="/login" className="landing-nav-signin btn-text">
            Sign in
          </Link>
          <button type="button" className="landing-nav-cta btn-text" onClick={() => setDemoOpen(true)}>
            Request a Demo
          </button>
        </div>
        <MobileMenuHamburger
          className="landing-nav-mobile-toggle"
          open={navOpen}
          onClick={() => setNavOpen((o) => !o)}
        />
      </nav>

      <MobileSlideMenu open={navOpen} onClose={() => setNavOpen(false)} title={brandUpper}>
        <div className="landing-mobile-nav-stack">
          <Link href="/login" className="landing-mobile-nav-link" onClick={() => setNavOpen(false)}>
            Sign in
          </Link>
          <button
            type="button"
            className="landing-mobile-nav-link landing-mobile-nav-link-cta"
            onClick={() => {
              setNavOpen(false);
              setDemoOpen(true);
            }}
          >
            Request a Demo
          </button>
          <button
            type="button"
            className="landing-mobile-nav-link"
            onClick={() => {
              setNavOpen(false);
              gotoEmployee();
            }}
          >
            Employee portal
          </button>
        </div>
      </MobileSlideMenu>

      <main className="landing-hero">
        <div className="landing-hero-text">
          <h1 className="landing-headline hero-headline">
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
            <button type="button" className="landing-primary-cta btn-text" onClick={() => setDemoOpen(true)}>
              Book a Demo
              <ArrowRight className="h-4 w-4" strokeWidth={2.5} aria-hidden />
            </button>
            <button type="button" className="landing-secondary-cta btn-text" onClick={gotoEmployee}>
              Employee portal
            </button>
          </div>
        </div>
        <div className="landing-hero-visual" aria-hidden>
          <div className="landing-hero-bg-gradient" />
        </div>
      </main>

      <section className="landing-feature-cards" aria-label="Key features">
        <div className="landing-fcard">
          <div className="landing-fcard-icon">
            <Clock3 className="h-5 w-5" strokeWidth={2} aria-hidden />
          </div>
          <div className="landing-fcard-title section-title">Real-Time Visibility</div>
          <p className="landing-fcard-desc">
            Real-time timesheet visibility across your team
          </p>
        </div>
        <div className="landing-fcard">
          <div className="landing-fcard-icon">
            <ShieldCheck className="h-5 w-5" strokeWidth={2} aria-hidden />
          </div>
          <div className="landing-fcard-title section-title">Audit Trail</div>
          <p className="landing-fcard-desc">
            Role-based access with a clean audit trail
          </p>
        </div>
        <div className="landing-fcard">
          <div className="landing-fcard-icon">
            <Check className="h-5 w-5" strokeWidth={2.5} aria-hidden />
          </div>
          <div className="landing-fcard-title section-title">Precision Payslips</div>
          <p className="landing-fcard-desc">
            Payslips generated from approved hours — not guesswork
          </p>
        </div>
      </section>

      <section className="landing-stats" aria-label="Trust metrics">
        <div className="stat-pill">
          <span className="stat-num stat-value stat-num-accent">99.9%</span>
          <span className="stat-label">Uptime</span>
        </div>
        <div className="stat-divider" aria-hidden />
        <div className="stat-pill">
          <span className="stat-num stat-value">2 min</span>
          <span className="stat-label">Avg payroll run</span>
        </div>
        <div className="stat-divider" aria-hidden />
        <div className="stat-pill">
          <span className="stat-num stat-value">0 errors</span>
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

