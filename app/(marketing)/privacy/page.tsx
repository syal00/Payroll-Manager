import type { Metadata } from "next";
import { MarketingPage } from "@/components/marketing/MarketingPage";
import { SUPPORT_EMAIL } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Privacy Policy — PayRun",
  description: "How PayRun collects, uses, and protects your data.",
};

export default function PrivacyPage() {
  return (
    <MarketingPage
      overline="Legal"
      title="Privacy policy"
      lead="This policy describes how PayRun handles information in the payroll platform."
    >
      <div className="mkt-section mkt-prose">
        <h2>Information we collect</h2>
        <p>
          PayRun stores account information (name, email, role), employee payroll data
          (timesheets, hourly rates, payslips), and activity logs (approvals, admin actions)
          required to operate the service.
        </p>
      </div>
      <div className="mkt-section mkt-prose">
        <h2>How we use information</h2>
        <ul>
          <li>To authenticate users and enforce role-based access</li>
          <li>To process timesheets, approvals, and payslip generation</li>
          <li>To maintain audit logs for payroll accountability</li>
          <li>To respond to demo requests and support inquiries</li>
        </ul>
      </div>
      <div className="mkt-section mkt-prose">
        <h2>Data retention & security</h2>
        <p>
          Payroll records are retained for operational and audit purposes. Access is restricted
          by role and company workspace. Sessions are signed and scoped so users only see data
          for their assigned tenant.
        </p>
      </div>
      <div className="mkt-section mkt-prose">
        <h2>Contact</h2>
        <p>
          Privacy questions can be sent to{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
        </p>
      </div>
    </MarketingPage>
  );
}
