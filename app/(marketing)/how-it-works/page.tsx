import type { Metadata } from "next";
import { MarketingPage } from "@/components/marketing/MarketingPage";
import { MARKETING_STEPS } from "@/lib/marketing-content";

export const metadata: Metadata = {
  title: "How it works — PayRun",
  description: "Submit hours, approve timesheets, and generate payslips in three clear steps.",
};

export default function HowItWorksPage() {
  return (
    <MarketingPage
      overline="Product"
      title="How PayRun works"
      lead="Every pay period follows the same path: employees log hours, managers approve them, and payroll generates payslips from approved data."
      actions={[
        { label: "See all features", href: "/features", primary: true },
        { label: "Employee portal", href: "/employee-portal" },
      ]}
    >
      <div className="mkt-steps">
        {MARKETING_STEPS.map((step, index) => (
          <div key={step.title} className="mkt-step">
            <div className="mkt-step-num">{index + 1}</div>
            <div>
              <h2>{step.title}</h2>
              <p>{step.desc}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="mkt-section mkt-prose">
        <h2>Who is involved at each step?</h2>
        <ul>
          <li>Employees use the employee portal to submit and track their hours.</li>
          <li>Main admins and managers review submissions from the admin dashboard.</li>
          <li>Main admins generate payslips once hours are approved for the pay period.</li>
          <li>Super admins can oversee multiple company workspaces from a separate dashboard.</li>
        </ul>
      </div>
    </MarketingPage>
  );
}
