import type { Metadata } from "next";
import Link from "next/link";
import { MarketingPage } from "@/components/marketing/MarketingPage";

export const metadata: Metadata = {
  title: "Admin access — WorkLedger",
  description: "Sign in as an admin or manager to review timesheets, manage employees, and run payroll.",
};

export default function AdminAccessPage() {
  return (
    <MarketingPage
      overline="Product"
      title="Admin & manager sign in"
      lead="Company admins and managers use the admin dashboard to review timesheets, manage staff, open pay periods, and generate payslips."
      actions={[
        { label: "Sign in to admin dashboard", href: "/login", primary: true },
        { label: "Request a demo", href: "/demo-request" },
      ]}
    >
      <div className="mkt-section">
        <h2>Admin dashboard capabilities</h2>
        <ul className="mkt-list">
          <li>
            <strong>Review timesheets</strong>
            Approve or reject employee submissions and move them through the review workflow.
          </li>
          <li>
            <strong>Manage employees</strong>
            Add staff, assign managers, set hourly rates, and approve new registrations.
          </li>
          <li>
            <strong>Run pay periods</strong>
            Open and close pay cycles so timesheets and payslips stay organized by period.
          </li>
          <li>
            <strong>Generate payslips</strong>
            Create payslips from approved hours with earnings, deductions, and PDF export.
          </li>
          <li>
            <strong>View reports & audit logs</strong>
            Track payroll activity and see who approved or changed records.
          </li>
        </ul>
      </div>
        <div className="mkt-section mkt-prose">
        <h2>Who should use this login?</h2>
        <p>
          Use the admin sign in if you are a <strong>main admin</strong>, <strong>manager</strong>,
          or <strong>supervisor</strong> for your company workspace. Employees should use the{" "}
          <Link href="/employee-portal">employee portal</Link> instead.
        </p>
      </div>
    </MarketingPage>
  );
}
