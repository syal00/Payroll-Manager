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
      <div className="blob blob-1" aria-hidden />
      <div className="blob blob-2" aria-hidden />
      <div className="blob blob-3" aria-hidden />

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

        <div className="landing-hero-illustration" aria-hidden>
          <HeroIllustration />
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
        <div className="landing-logos-row">
          <PlaceholderLogo variant="cloud" />
          <PlaceholderLogo variant="bank" />
          <PlaceholderLogo variant="bolt" />
          <PlaceholderLogo variant="music" />
          <PlaceholderLogo variant="diamond" />
        </div>
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

function HeroIllustration() {
  return (
    <svg
      className="landing-illustration-svg"
      viewBox="0 0 560 480"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Orbiting payroll automation illustration"
    >
      <defs>
        <radialGradient id="sunGrad" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#ffc78b" stopOpacity="0.95" />
          <stop offset="55%" stopColor="#f07828" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#c4540a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="planeGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fff7ec" />
          <stop offset="100%" stopColor="#ffd5a7" />
        </linearGradient>
        <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f07828" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#c4540a" stopOpacity="0.45" />
        </linearGradient>
      </defs>

      {/* Glow sun */}
      <circle cx="335" cy="240" r="170" fill="url(#sunGrad)" opacity="0.85" />
      <circle cx="335" cy="240" r="44" fill="#ffae6b" opacity="0.95" />
      <circle cx="335" cy="240" r="22" fill="#fff2dc" opacity="0.95" />

      {/* Orbits */}
      <ellipse
        cx="335"
        cy="240"
        rx="200"
        ry="80"
        stroke="url(#ringGrad)"
        strokeWidth="1.5"
        strokeDasharray="2 6"
        opacity="0.85"
        transform="rotate(-18 335 240)"
      />
      <ellipse
        cx="335"
        cy="240"
        rx="240"
        ry="100"
        stroke="url(#ringGrad)"
        strokeWidth="1.2"
        strokeDasharray="2 7"
        opacity="0.55"
        transform="rotate(18 335 240)"
      />
      <ellipse
        cx="335"
        cy="240"
        rx="155"
        ry="62"
        stroke="#f07828"
        strokeWidth="1"
        strokeDasharray="1 5"
        opacity="0.75"
        transform="rotate(8 335 240)"
      />

      {/* Orbiting icons — gear */}
      <g transform="translate(190 130)" opacity="0.95">
        <circle r="20" fill="#1c0e0a" stroke="#f07828" strokeWidth="1.4" />
        <g stroke="#ffa563" strokeWidth="1.8" strokeLinecap="round">
          <path d="M0 -14 v6" />
          <path d="M0 14 v-6" />
          <path d="M-14 0 h6" />
          <path d="M14 0 h-6" />
          <path d="M-10 -10 l4 4" />
          <path d="M10 10 l-4 -4" />
          <path d="M-10 10 l4 -4" />
          <path d="M10 -10 l-4 4" />
        </g>
        <circle r="5" fill="#f07828" />
      </g>

      {/* Orbiting icons — document */}
      <g transform="translate(490 200)" opacity="0.95">
        <rect x="-18" y="-22" width="36" height="44" rx="5" fill="#1c0e0a" stroke="#f07828" strokeWidth="1.4" />
        <path d="M-10 -10 h20 M-10 -2 h20 M-10 6 h14 M-10 14 h10" stroke="#ffa563" strokeWidth="1.6" strokeLinecap="round" />
      </g>

      {/* Orbiting icons — checkmark badge */}
      <g transform="translate(485 350)" opacity="0.95">
        <circle r="22" fill="#1c0e0a" stroke="#22c55e" strokeWidth="1.6" />
        <path d="M-9 1 l6 6 l12 -12" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </g>

      {/* Orbiting icons — chart bars */}
      <g transform="translate(170 340)" opacity="0.95">
        <rect x="-22" y="-20" width="44" height="40" rx="5" fill="#1c0e0a" stroke="#f07828" strokeWidth="1.4" />
        <rect x="-14" y="-2" width="6" height="14" fill="#ffa563" rx="1" />
        <rect x="-4" y="-10" width="6" height="22" fill="#f07828" rx="1" />
        <rect x="6" y="-6" width="6" height="18" fill="#ffa563" rx="1" />
      </g>

      {/* Paper plane — flagship icon */}
      <g transform="translate(165 195) rotate(-18)">
        <path
          d="M0 0 L150 30 L60 60 L70 105 L40 70 L0 0 Z"
          fill="url(#planeGrad)"
          stroke="#f07828"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path d="M0 0 L60 60" stroke="#c4540a" strokeWidth="1.3" opacity="0.7" />
        <path d="M40 70 L60 60" stroke="#c4540a" strokeWidth="1.3" opacity="0.7" />
        <path
          d="M-30 -8 q-20 20 -50 18 M-40 4 q-26 14 -64 24 M-32 18 q-22 10 -56 32"
          stroke="#f07828"
          strokeWidth="1.4"
          strokeLinecap="round"
          fill="none"
          opacity="0.55"
        />
      </g>

      {/* Sparkles */}
      <g fill="#ffa563" opacity="0.85">
        <circle cx="120" cy="220" r="2.2" />
        <circle cx="530" cy="120" r="2.5" />
        <circle cx="80" cy="380" r="1.8" />
        <circle cx="540" cy="430" r="2" />
        <circle cx="280" cy="80" r="1.6" />
        <circle cx="420" cy="430" r="1.8" />
      </g>
    </svg>
  );
}

function PlaceholderLogo({ variant }: { variant: "cloud" | "bank" | "bolt" | "music" | "diamond" }) {
  switch (variant) {
    case "cloud":
      return (
        <svg width="44" height="32" viewBox="0 0 44 32" fill="none" aria-hidden>
          <path
            d="M11 26h22a7 7 0 0 0 1.5-13.84A10 10 0 0 0 15.5 9.5 8 8 0 0 0 11 26z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "bank":
      return (
        <svg width="44" height="32" viewBox="0 0 44 32" fill="none" aria-hidden>
          <path d="M22 4l18 8H4l18-8z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          <path
            d="M8 14v10M16 14v10M28 14v10M36 14v10M4 26h36"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      );
    case "bolt":
      return (
        <svg width="34" height="34" viewBox="0 0 34 34" fill="none" aria-hidden>
          <circle cx="17" cy="17" r="14" stroke="currentColor" strokeWidth="1.8" />
          <path
            d="M18 7l-7 11h6l-1 9 8-12h-6l1-8z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "music":
      return (
        <svg width="34" height="34" viewBox="0 0 34 34" fill="none" aria-hidden>
          <path d="M13 23V7l14-3v16" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          <circle cx="11" cy="24" r="3.5" stroke="currentColor" strokeWidth="1.8" />
          <circle cx="25" cy="21" r="3.5" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      );
    case "diamond":
      return (
        <svg width="34" height="34" viewBox="0 0 34 34" fill="none" aria-hidden>
          <path
            d="M17 4l11 9-11 17L6 13l11-9z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path d="M6 13h22M17 4v26" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      );
  }
}
