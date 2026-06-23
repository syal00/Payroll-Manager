import Link from "next/link";
import { Globe, Mail, Share2 } from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";

const FOOTER_LINKS = {
  Product: ["Features", "Process", "Integrations", "Security"],
  Company: ["About", "Careers", "Press", "Contact"],
  Resources: ["Documentation", "API", "Status", "Blog"],
  Legal: ["Privacy", "Terms", "Cookies", "GDPR"],
};

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
              nameLine1="Syal"
              nameLine2="Operations"
              wrapperClassName="lp-logo"
              imageClassName="brand-logo-img lp-logo-img"
              textWrapperClassName="lp-logo-text"
              nameClassName="lp-logo-name"
              tagClassName="lp-logo-tag"
            />
            <p className="lp-footer-brand-desc">
              Enterprise payroll and workforce management for growing businesses.
            </p>
            <div className="lp-footer-social">
              <a href="#" aria-label="Website" data-testid="social-linkedin">
                <Globe className="h-4 w-4" strokeWidth={1.5} />
              </a>
              <a href="#" aria-label="Share" data-testid="social-twitter">
                <Share2 className="h-4 w-4" strokeWidth={1.5} />
              </a>
              <a href="mailto:hello@syaloperations.com" aria-label="Email" data-testid="social-email">
                <Mail className="h-4 w-4" strokeWidth={1.5} />
              </a>
            </div>
          </div>

          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title} className="lp-footer-col">
              <h4>{title}</h4>
              {links.map((link) => (
                <a key={link} href="#" data-testid={`footer-link-${link.toLowerCase()}`}>
                  {link}
                </a>
              ))}
            </div>
          ))}
        </div>

        <div className="lp-footer-meta">
          <span>© {year} Syal Operations Group</span>
          <span>ISO 27001 · SOC 2 Type II · GDPR</span>
          <span>
            <span className="lp-status-dot" aria-hidden />
            All systems normal
          </span>
        </div>

        <p className="lp-huge-footer" aria-hidden>
          SYAL.
        </p>
      </div>
    </footer>
  );
}
