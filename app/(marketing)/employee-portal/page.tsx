import type { Metadata } from "next";
import { MarketingPage } from "@/components/marketing/MarketingPage";

export const metadata: Metadata = {
  title: "Employee portal — WorkLedger",
  description: "Submit timesheets, track approvals, and download payslips from the employee portal.",
};

export default function EmployeePortalPage() {
  return (
    <MarketingPage
      overline="Product"
      title="Employee portal"
      lead="A dedicated workspace where staff submit hours, follow approval status, and access payslips — without needing admin access."
      actions={[
        { label: "Go to employee portal", href: "/employee-access", primary: true },
        { label: "Register as employee", href: "/employee-access/register" },
      ]}
    >
      <div className="mkt-section">
        <h2>What employees can do</h2>
        <ul className="mkt-list">
          <li>
            <strong>Submit timesheets</strong>
            Log regular, overtime, and leave hours for the current pay period.
          </li>
          <li>
            <strong>Track approval status</strong>
            See whether a submission is pending, under review, or approved.
          </li>
          <li>
            <strong>View payslips</strong>
            Open generated payslips and download PDF copies when payroll is complete.
          </li>
          <li>
            <strong>Review history</strong>
            Browse past submissions and payslips from previous pay periods.
          </li>
        </ul>
      </div>
      <div className="mkt-section mkt-prose">
        <h2>Getting started</h2>
        <p>
          New employees can register through the employee access page. Once an admin approves
          the registration, the employee can sign in with their username and start submitting
          hours for the active pay period.
        </p>
      </div>
    </MarketingPage>
  );
}
