import Image from "next/image";
import Link from "next/link";
import { Globe, Mail, MapPin } from "lucide-react";
import { APP_NAME } from "@/lib/brand";

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12Z" />
    </svg>
  );
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zm0 10.162a3.999 3.999 0 1 1 0-7.998 3.999 3.999 0 0 1 0 7.998zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
    </svg>
  );
}

const TECH_STACK = [
  "HTML",
  "CSS",
  "JavaScript",
  "Python",
  "C#",
  "PHP",
  "SQL",
  "XML/JSON",
  "React",
  ".NET",
  "ASP.NET Core MVC",
  "Laravel",
  "Bootstrap",
  "MySQL",
  "REST APIs",
  "Git",
  "GitHub",
  "VS Code",
  "Docker",
  "Figma",
  "Photoshop",
  "Illustrator",
] as const;

const SOCIAL_LINKS = [
  {
    label: "GitHub",
    href: "https://github.com/syal00",
    icon: GitHubIcon,
    testId: "github",
  },
  {
    label: "LinkedIn",
    href: "https://linkedin.com/in/rakesh-syal-974b61362",
    icon: LinkedInIcon,
    testId: "linkedin",
  },
  {
    label: "Portfolio",
    href: "https://syal-portfolio.vercel.app",
    icon: Globe,
    testId: "portfolio",
  },
  {
    label: "Instagram",
    href: "https://instagram.com/syal_pb07",
    icon: InstagramIcon,
    testId: "instagram",
  },
  {
    label: "Email",
    href: "mailto:syal0005@algonquinlive.com",
    icon: Mail,
    testId: "email",
  },
] as const;

export function OwnerProfile() {
  return (
    <section className="lp-owner" data-testid="owner-profile">
      <div className="lp-container">
        <div className="lp-owner-card">
          <div className="lp-owner-header">
            <div className="lp-owner-photo-wrap">
              <Image
                src="/images/rakesh-syal.jpg"
                alt="Rakesh Syal"
                width={160}
                height={160}
                className="lp-owner-photo"
                priority
                sizes="160px"
              />
            </div>
            <div className="lp-owner-intro">
              <p className="lp-owner-overline">Built by</p>
              <h1 className="lp-owner-name">Rakesh Syal</h1>
              <p className="lp-owner-role">
                Web Development and Internet Applications (WDIA) student at Algonquin College,
                and full-stack developer
              </p>
              <p className="lp-owner-location">
                <MapPin className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                Ottawa, ON, Canada
              </p>
              <p className="lp-owner-tagline">
                Blending clean engineering with user-centered design to build practical,
                reliable digital experiences.
              </p>
            </div>
          </div>

          <p className="lp-owner-bio">
            {APP_NAME} is one of my personal full-stack projects — a payroll and workforce
            management web app with a live dashboard, timesheets, payslip generation, role-based
            access, and this landing page — built to demonstrate practical skills across frontend,
            backend, and data.
          </p>

          <div className="lp-owner-stack">
            <h2 className="lp-owner-stack-label">Tech stack</h2>
            <ul className="lp-owner-tags" aria-label="Technologies">
              {TECH_STACK.map((tech) => (
                <li key={tech}>
                  <span className="lp-owner-tag">{tech}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="lp-owner-links">
            {SOCIAL_LINKS.map(({ label, href, icon: Icon, testId }) => (
              <Link
                key={testId}
                href={href}
                className="lp-owner-link"
                aria-label={label}
                data-testid={`owner-link-${testId}`}
                {...(href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              >
                {testId === "portfolio" || testId === "email" ? (
                  <Icon className="h-4 w-4" strokeWidth={1.5} />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
