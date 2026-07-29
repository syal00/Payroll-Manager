import type { Metadata } from "next";
import { MarketingPage } from "@/components/marketing/MarketingPage";

export const metadata: Metadata = {
  title: "Super admin — WorkLedger",
  description: "Cross-company platform access for super administrators who manage multiple tenant workspaces.",
};

export default function SuperAdminAccessPage() {
  return (
    <MarketingPage
      overline="Product"
      title="Super admin access"
      lead="Super admins operate across all company workspaces. They can view company lists, drill into tenant dashboards, and oversee platform-level activity."
      actions={[
        { label: "Sign in as super admin", href: "/login", primary: true },
        { label: "Admin sign in", href: "/admin-access" },
      ]}
    >
      <div className="mkt-section">
        <h2>What super admins can do</h2>
        <ul className="mkt-list">
          <li>
            <strong>View all companies</strong>
            Browse every tenant workspace registered on the platform.
          </li>
          <li>
            <strong>Company drill-down dashboards</strong>
            Open a specific company to review employees, timesheets, payslips, and stats.
          </li>
          <li>
            <strong>Cross-tenant oversight</strong>
            Monitor activity across organizations without mixing data between tenants.
          </li>
          <li>
            <strong>Platform administration</strong>
            Support onboarding and troubleshooting for multiple company accounts.
          </li>
        </ul>
      </div>
      <div className="mkt-section mkt-prose">
        <h2>How to sign in</h2>
        <p>
          Super admins use the same sign-in page as other staff. After login, accounts with the{" "}
          <strong>SUPER_ADMIN</strong> role are redirected to <code>/super-admin/companies</code>{" "}
          instead of the single-company admin dashboard.
        </p>
        <p>
          Super admin accounts are created manually by platform operators — they are not part of
          the standard demo seed. Contact your platform administrator if you need access.
        </p>
      </div>
    </MarketingPage>
  );
}
