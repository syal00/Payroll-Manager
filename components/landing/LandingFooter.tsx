import Link from "next/link";
import { Globe, Mail, Share2 } from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { APP_NAME, SUPPORT_EMAIL } from "@/lib/brand";
import { FOOTER_SECTIONS } from "@/lib/marketing-content";

export function LandingFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="lp-footer lp-footer--navy" data-testid="landing-footer">
      <div className="lp-container">
        <div className="lp-footer-grid">
          <div>
            <BrandLogo
              href="/"
              size={38}
              testId="footer-logo"
              showTag={false}
              nameLine1={APP_NAME}
              wrapperClassName="lp-logo"
              imageClassName="brand-logo-img lp-logo-img"
              textWrapperClassName="lp-logo-text"
              nameClassName="lp-logo-name"
              tagClassName="lp-logo-tag"
            />
            <p className="lp-footer-brand-desc">
              PayRun — timesheets, approvals, and payslips for your team.
            </p>
            <div className="lp-footer-social">
              <Link href="/" aria-label="Website" data-testid="social-linkedin">
                <Globe className="h-4 w-4" strokeWidth={1.5} />
              </Link>
              <Link href="/contact" aria-label="Contact" data-testid="social-twitter">
                <Share2 className="h-4 w-4" strokeWidth={1.5} />
              </Link>
              <a href={`mailto:${SUPPORT_EMAIL}`} aria-label="Email" data-testid="social-email">
                <Mail className="h-4 w-4" strokeWidth={1.5} />
              </a>
            </div>
          </div>

          {FOOTER_SECTIONS.map((section) => (
            <div key={section.title} className="lp-footer-col">
              <h4>{section.title}</h4>
              {section.links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  data-testid={`footer-link-${link.testId}`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          ))}
        </div>

        <div className="lp-footer-meta">
          <span>© {year} {APP_NAME}</span>
          <span>{APP_NAME}</span>
        </div>

        <p className="lp-huge-footer" aria-hidden>
          PAYRUN.
        </p>
      </div>
    </footer>
  );
}
