import type { Metadata } from "next";
import { MarketingPage } from "@/components/marketing/MarketingPage";
import { MARKETING_FEATURES } from "@/lib/marketing-content";

export const metadata: Metadata = {
  title: "Features — WorkLedger",
  description: "Timesheets, approvals, payslips, pay periods, and audit logs in one payroll workspace.",
};

export default function FeaturesPage() {
  return (
    <MarketingPage
      overline="Product"
      title="Platform features"
      lead="WorkLedger covers the full payroll workflow — from hour submissions through manager approval to payslip generation."
      actions={[
        { label: "Request a demo", href: "/demo-request", primary: true },
        { label: "Admin sign in", href: "/login" },
      ]}
      wide
    >
      <div className="mkt-card-grid">
        {MARKETING_FEATURES.map((feature) => (
          <article key={feature.title} className="mkt-card">
            <h3>{feature.title}</h3>
            <p>{feature.desc}</p>
          </article>
        ))}
      </div>
    </MarketingPage>
  );
}
