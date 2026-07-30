import type { Metadata } from "next";
import { MarketingPage } from "@/components/marketing/MarketingPage";

export const metadata: Metadata = {
  title: "Documentation — PayRun",
  description: "Getting started guides for admins, managers, employees, and super admins.",
};

export default function DocumentationPage() {
  return (
    <MarketingPage
      overline="Resources"
      title="Documentation"
      lead="A quick reference for getting started with PayRun across admin, employee, and super admin roles."
      actions={[
        { label: "Admin sign in", href: "/login", primary: true },
        { label: "Employee portal", href: "/employee-access" },
      ]}
    >
      <div className="mkt-section mkt-prose">
        <h2>For admins & managers</h2>
        <ul>
          <li>Sign in at <a href="/login">/login</a> with your admin credentials.</li>
          <li>Open the dashboard to see pending timesheets and current pay period stats.</li>
          <li>Approve employee registrations before they can submit hours.</li>
          <li>Review timesheets from the timesheets queue and move them to approved status.</li>
          <li>Generate payslips from approved timesheets for the active pay period.</li>
          <li>Use reports and audit logs to review payroll activity.</li>
        </ul>
      </div>
      <div className="mkt-section mkt-prose">
        <h2>For employees</h2>
        <ul>
          <li>Go to <a href="/employee-access">/employee-access</a> to sign in or register.</li>
          <li>Submit regular, overtime, and leave hours for the open pay period.</li>
          <li>Check submission status until a manager approves your timesheet.</li>
          <li>View and download payslips once payroll generates them.</li>
        </ul>
      </div>
      <div className="mkt-section mkt-prose">
        <h2>For super admins</h2>
        <ul>
          <li>Sign in at <a href="/login">/login</a> with a super admin account.</li>
          <li>You will be redirected to the companies list at <code>/super-admin/companies</code>.</li>
          <li>Select a company to open its drill-down dashboard with employees, timesheets, and payslips.</li>
        </ul>
      </div>
      <div className="mkt-section mkt-prose">
        <h2>Local development setup</h2>
        <p>
          Developers can run <code>npm run setup</code> to migrate the database and load demo data.
          Demo admin credentials are documented in the project README.
        </p>
      </div>
    </MarketingPage>
  );
}
