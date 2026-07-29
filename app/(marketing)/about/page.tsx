import type { Metadata } from "next";
import { MarketingPage } from "@/components/marketing/MarketingPage";

export const metadata: Metadata = {
  title: "About — WorkLedger",
  description: "Learn about WorkLedger and Syal Operations Group's payroll management platform.",
};

export default function AboutPage() {
  return (
    <MarketingPage
      overline="Company"
      title="About WorkLedger"
      lead="WorkLedger is a payroll management platform built by Syal Operations Group to help teams track hours, run approvals, and distribute payslips."
      actions={[
        { label: "Request a demo", href: "/demo-request", primary: true },
        { label: "Contact us", href: "/contact" },
      ]}
    >
      <div className="mkt-section mkt-prose">
        <h2>Our focus</h2>
        <p>
          We built WorkLedger for teams that need a clear, reliable workflow — not bloated enterprise
          software. The platform centers on three things: timesheet submissions, manager approvals,
          and payslip generation with a full audit trail.
        </p>
        <p>
          Each company gets its own workspace with role-based access for admins, managers,
          supervisors, and employees. Platform operators can use super admin access to support
          multiple tenants from one dashboard.
        </p>
      </div>
      <div className="mkt-section mkt-prose">
        <h2>Who we serve</h2>
        <ul>
          <li>Operations teams managing hourly staff</li>
          <li>Payroll admins who need approval workflows before issuing payslips</li>
          <li>Employees who want self-service access to hours and payslips</li>
          <li>Multi-company platforms that need tenant isolation with cross-company oversight</li>
        </ul>
      </div>
    </MarketingPage>
  );
}
