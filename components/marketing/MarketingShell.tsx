import Link from "next/link";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { LandingFooter } from "@/components/landing/LandingFooter";
import "@/components/landing/landing.css";
import "./marketing-pages.css";

type MarketingShellProps = {
  children: React.ReactNode;
};

export function MarketingShell({ children }: MarketingShellProps) {
  return (
    <div className="mkt-root lp-root">
      <header className="mkt-header">
        <div className="mkt-header-inner">
          <BrandLogo
            href="/"
            size={36}
            wrapperClassName="lp-logo"
            imageClassName="brand-logo-img lp-logo-img"
            textWrapperClassName="lp-logo-text"
            nameClassName="lp-logo-name"
            tagClassName="lp-logo-tag"
          />
          <div className="mkt-header-actions">
            <Link href="/" className="mkt-nav-link">
              Home
            </Link>
            <Link href="/login" className="mkt-nav-link">
              Sign in
            </Link>
            <Link href="/demo-request" className="mkt-btn mkt-btn--primary">
              Request demo
            </Link>
          </div>
        </div>
      </header>
      <main className="mkt-main">{children}</main>
      <LandingFooter />
    </div>
  );
}
