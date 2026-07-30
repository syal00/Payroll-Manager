import type { Metadata } from "next";
import { MarketingPage } from "@/components/marketing/MarketingPage";

export const metadata: Metadata = {
  title: "About — PayRun",
  description: "Learn about PayRun — payroll management for timesheets, approvals, and payslips.",
};

export default function AboutPage() {
  return (
    <MarketingPage
      overline="Company"
      title="About PayRun"
      lead="PayRun helps teams track hours, run approvals, and distribute payslips — with clear roles for admins, managers, and employees."
      actions={[
        { label: "Request a demo", href: "/demo-request", primary: true },
        { label: "Contact us", href: "/contact" },
      ]}
    >
      <div className="mkt-section mkt-prose">
        <h2>Our focus</h2>
        <p>
          We built PayRun for teams that need a clear, reliable workflow — not bloated enterprise
          software. The platform centers on three things: timesheet submissions, manager approvals,
          and payslip generation with a full audit trail.
        </p>
        <p>
          Each company gets its own workspace with three roles: main admin, manager, and employee.
          Platform operators can use a separate super-admin console to support multiple tenants —
          that layer is invisible to company users.
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
