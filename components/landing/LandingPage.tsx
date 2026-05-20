"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Check, Clock3, ShieldCheck } from "lucide-react";
import { DemoRequestModal } from "@/components/marketing/DemoRequestModal";
import { MobileMenuHamburger, MobileSlideMenu } from "@/components/MobileMenu";
import { DashboardPreview } from "@/components/landing/DashboardPreview";
import { AnimatedSection } from "@/components/motion/AnimatedSection";
import { fadeUp, staggerContainer, staggerItem } from "@/lib/motion";

export default function LandingPage() {
  const router = useRouter();
  const [demoOpen, setDemoOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const reduceMotion = useReducedMotion();
  const brand = process.env.NEXT_PUBLIC_COMPANY_NAME ?? "Syal Operations Group";
  const brandUpper = brand.toUpperCase();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function gotoEmployee() {
    router.push("/employee-access");
  }

  const MotionTag = reduceMotion ? "div" : motion.div;
  const motionHero = reduceMotion
    ? {}
    : { initial: "hidden", animate: "visible", variants: fadeUp };

  return (
    <div className="landing-root">
      <DemoRequestModal open={demoOpen} onClose={() => setDemoOpen(false)} />

      <header className={`landing-nav ${scrolled ? "landing-nav-scrolled" : ""}`}>
        <div className="landing-logo-row">
          <div className="landing-logo-icon" aria-hidden>
            <BrandMark />
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
      </header>

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
        <MotionTag className="landing-hero-text" {...motionHero}>
          {!reduceMotion && (
            <motion.p className="landing-hero-eyebrow" variants={fadeUp}>
              Payroll operations platform
            </motion.p>
          )}
          {reduceMotion && <p className="landing-hero-eyebrow">Payroll operations platform</p>}

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
        </MotionTag>

        <div className="landing-hero-visual">
          <div className="landing-hero-bg-gradient" aria-hidden />
          <DashboardPreview />
        </div>
      </main>

      <FeatureCards reduceMotion={!!reduceMotion} />

      <AnimatedSection className="landing-stats" aria-label="Trust metrics">
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
      </AnimatedSection>

      <AnimatedSection className="landing-logos" aria-label="Customers">
        <div className="landing-logos-title">Trusted by leaders across industries</div>
      </AnimatedSection>

      <section className="landing-cta-band" aria-label="Get started">
        <div className="landing-cta-band-inner">
          <p className="landing-cta-eyebrow">Ready when you are</p>
          <h2 className="landing-cta-title">Run payroll with clarity and confidence</h2>
          <p className="landing-cta-desc">
            See how hours, approvals, and payslips flow together in one refined workspace built for modern teams.
          </p>
          <div className="landing-cta-actions">
            <button type="button" className="landing-cta-primary btn-text" onClick={() => setDemoOpen(true)}>
              Book a Demo
              <ArrowRight className="h-4 w-4" strokeWidth={2.5} aria-hidden />
            </button>
            <button type="button" className="landing-cta-secondary btn-text" onClick={gotoEmployee}>
              Employee portal
            </button>
          </div>
        </div>
      </section>

      <footer className="site-footer" role="contentinfo">
        <div className="site-footer-inner">
          <div className="site-footer-brand">
            <div className="site-footer-logo" aria-hidden>
              <BrandMark />
            </div>
            <div>
              <p className="site-footer-name">{brandUpper}</p>
              <p className="site-footer-tagline">Premium payroll operations for modern teams</p>
            </div>
          </div>
          <nav className="site-footer-links" aria-label="Footer">
            <Link href="/login">Sign in</Link>
            <button type="button" className="border-0 bg-transparent p-0 text-inherit" onClick={() => setDemoOpen(true)}>
              Request demo
            </button>
            <button type="button" className="border-0 bg-transparent p-0 text-inherit" onClick={gotoEmployee}>
              Employee portal
            </button>
          </nav>
          <p className="site-footer-copy">
            © {new Date().getFullYear()} {brand}. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCards({ reduceMotion }: { reduceMotion: boolean }) {
  const cards = [
    {
      icon: <Clock3 className="h-5 w-5" strokeWidth={2} aria-hidden />,
      title: "Real-Time Visibility",
      desc: "Real-time timesheet visibility across your team",
    },
    {
      icon: <ShieldCheck className="h-5 w-5" strokeWidth={2} aria-hidden />,
      title: "Audit Trail",
      desc: "Role-based access with a clean audit trail",
    },
    {
      icon: <Check className="h-5 w-5" strokeWidth={2.5} aria-hidden />,
      title: "Precision Payslips",
      desc: "Payslips generated from approved hours — not guesswork",
    },
  ];

  if (reduceMotion) {
    return (
      <section className="landing-feature-cards" aria-label="Key features">
        {cards.map((c) => (
          <div key={c.title} className="landing-fcard">
            <div className="landing-fcard-icon">{c.icon}</div>
            <div className="landing-fcard-title section-title">{c.title}</div>
            <p className="landing-fcard-desc">{c.desc}</p>
          </div>
        ))}
      </section>
    );
  }

  return (
    <motion.section
      className="landing-feature-cards"
      aria-label="Key features"
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
    >
      {cards.map((c) => (
        <motion.div key={c.title} className="landing-fcard" variants={staggerItem}>
          <div className="landing-fcard-icon">{c.icon}</div>
          <div className="landing-fcard-title section-title">{c.title}</div>
          <p className="landing-fcard-desc">{c.desc}</p>
        </motion.div>
      ))}
    </motion.section>
  );
}

function BrandMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
        fill="currentColor"
      />
    </svg>
  );
}
