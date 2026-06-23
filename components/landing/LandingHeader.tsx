"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { MagneticButton } from "@/components/landing/MagneticButton";
import { BrandLogo } from "@/components/brand/BrandLogo";

const NAV = [
  { label: "Services", href: "#features" },
  { label: "About", href: "#process" },
  { label: "Contact", href: "#cta" },
  { label: "FAQ", href: "#faq" },
];

type LandingHeaderProps = {
  scrolled: boolean;
  mobileOpen: boolean;
  onToggleMobile: () => void;
  onCloseMobile: () => void;
  onBookDemo: () => void;
};

export function LandingHeader({
  scrolled,
  mobileOpen,
  onToggleMobile,
  onCloseMobile,
  onBookDemo,
}: LandingHeaderProps) {
  return (
    <>
      <div className={`lp-header-shell ${scrolled ? "is-scrolled" : ""}`}>
        <header
          className={`lp-header ${scrolled ? "is-scrolled" : ""}`}
          data-testid="landing-header"
        >
          <div className="lp-header-inner">
            <BrandLogo
              href="/"
              size={38}
              priority
              testId="header-logo"
              wrapperClassName="lp-logo"
              imageClassName="brand-logo-img lp-logo-img"
              textWrapperClassName="lp-logo-text"
              nameClassName="lp-logo-name"
              tagClassName="lp-logo-tag"
            />

            <nav className="lp-nav-center" aria-label="Main">
              {NAV.map((item) => (
                <a
                  key={item.href + item.label}
                  href={item.href}
                  className="lp-nav-link lp-u-link"
                  data-testid={`nav-${item.label.toLowerCase()}`}
                >
                  {item.label}
                </a>
              ))}
            </nav>

            <div className="lp-nav-actions">
              <Link href="/login" className="lp-nav-portal lp-u-link" data-testid="header-portal-link">
                Sign In
              </Link>
              <MagneticButton
                onClick={onBookDemo}
                className="lp-copper-btn lp-nav-cta"
                data-testid="header-book-demo-btn"
              >
                Get a Quote
                <ArrowRight className="h-4 w-4" strokeWidth={2} />
              </MagneticButton>
            </div>

            <button
              type="button"
              className="lp-hamburger"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              onClick={onToggleMobile}
              data-testid="mobile-menu-toggle"
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </header>
      </div>

      {mobileOpen && (
        <nav className="lp-mobile-panel" aria-label="Mobile" data-testid="mobile-menu-panel">
          {NAV.map((item) => (
            <a key={item.href + item.label} href={item.href} onClick={onCloseMobile}>
              {item.label}
            </a>
          ))}
          <a href="/login" onClick={onCloseMobile}>
            Sign In
          </a>
          <button
            type="button"
            className="lp-copper-btn mt-4"
            onClick={() => {
              onCloseMobile();
              onBookDemo();
            }}
            data-testid="mobile-book-demo-btn"
          >
            Book Demo →
          </button>
        </nav>
      )}
    </>
  );
}
