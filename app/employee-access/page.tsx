import Link from "next/link";
import { headers } from "next/headers";
import { ArrowRight, Mail, Shield, UserPlus } from "lucide-react";
import { LoginBrandIllustration } from "@/components/auth/LoginBrandIllustration";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { DEFAULT_BRAND_NAME } from "@/lib/brand";
import "@/app/login/login.css";

export default async function EmployeeAccessHubPage() {
  const h = await headers();
  const companyName = h.get("x-company-name");
  const companyLogoUrl = h.get("x-company-logo");
  const brand = (companyName ?? process.env.NEXT_PUBLIC_COMPANY_NAME ?? DEFAULT_BRAND_NAME).toUpperCase();

  return (
    <div className="login-root">
      <div className="login-brand">
        <LoginBrandIllustration />
        <div className="login-brand-content">
          <BrandLogo
            size={44}
            showTag={false}
            nameLine1={brand}
            logoSrc={companyLogoUrl}
            wrapperClassName="login-brand-logo-row"
            imageClassName="brand-logo-img login-brand-logo-img"
            textWrapperClassName="login-brand-logo-text"
            nameClassName="login-brand-logo-name"
            tagClassName="login-brand-logo-tag"
          />

          <div className="login-brand-body">
            <h1 className="login-brand-headline">
              Your Work,
              <br />
              Your Hours, <span>Your Pay</span>
            </h1>
            <p className="login-brand-desc">
              Log into the employee portal with your email and password.
              Submit hours, track approvals, and download payslips, all in one place.
            </p>

            <div className="login-features">
              <div className="login-feature">
                <div className="login-feature-icon">
                  <Mail className="h-4 w-4" aria-hidden />
                </div>
                <span>Register with your email — an administrator approves new accounts before access</span>
              </div>
              <div className="login-feature">
                <div className="login-feature-icon">
                  <Shield className="h-4 w-4" aria-hidden />
                </div>
                <span>Your data is private to you and your payroll administrator</span>
              </div>
            </div>
          </div>

          <p className="login-brand-footer">Encrypted session · Employee privacy first</p>
        </div>
      </div>

      <div className="login-form-panel">
        <div className="login-form-topbar">
          <Link href="/" className="login-back-home-link">
            ← Back to home
          </Link>
        </div>

        <div className="login-form-card">
          <div className="login-form-box">
            <div className="login-mobile-brand">
              <BrandLogo
                size={36}
                showTag={false}
                nameLine1={brand}
                logoSrc={companyLogoUrl}
                wrapperClassName="login-brand-logo-row"
                imageClassName="brand-logo-img login-brand-logo-img"
                textWrapperClassName="login-brand-logo-text"
                nameClassName="login-brand-logo-name"
                tagClassName="login-brand-logo-tag"
              />
            </div>

            <p className="login-form-eyebrow">Employee Portal</p>
            <h2 className="login-form-title">Welcome</h2>
            <p className="login-form-sub">
              Choose how you&rsquo;d like to access your dashboard. New employees get a fresh ID;
              returning employees pick up right where they left off.
            </p>

            <div className="flex flex-col gap-4">
              <Link href="/employee-access/register" className="login-access-option login-access-option--primary group">
                <span className="login-access-option-icon" aria-hidden>
                  <UserPlus className="h-5 w-5" strokeWidth={2} />
                </span>
                <span className="flex-1">
                  <span className="login-access-option-title">New Employee</span>
                  <span className="login-access-option-desc">
                    Enter your name, email, and password. Your account stays pending until an administrator approves it.
                  </span>
                </span>
                <ArrowRight className="login-access-option-arrow" strokeWidth={2.5} aria-hidden />
              </Link>

              <Link href="/employee-access/existing" className="login-access-option group">
                <span className="login-access-option-icon" aria-hidden>
                  <Mail className="h-5 w-5" strokeWidth={2} />
                </span>
                <span className="flex-1">
                  <span className="login-access-option-title">Returning Employee</span>
                  <span className="login-access-option-desc">
                    Sign in with the email and password you used when registering.
                  </span>
                </span>
                <ArrowRight className="login-access-option-arrow" strokeWidth={2.5} aria-hidden />
              </Link>
            </div>

            <div className="login-divider login-form-card-divider">
              <div className="login-divider-line" />
              <span className="login-divider-text">or</span>
              <div className="login-divider-line" />
            </div>

            <Link href="/login" className="login-sso-btn login-form-card-sso">
              Administrator sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
