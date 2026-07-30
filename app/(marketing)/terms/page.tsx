import type { Metadata } from "next";
import { MarketingPage } from "@/components/marketing/MarketingPage";
import { SUPPORT_EMAIL } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Terms of Use — PayRun",
  description: "Terms and conditions for using the PayRun payroll platform.",
};

export default function TermsPage() {
  return (
    <MarketingPage
      overline="Legal"
      title="Terms of use"
      lead="By using PayRun, you agree to the following terms governing access to the platform."
    >
      <div className="mkt-section mkt-prose">
        <h2>Acceptable use</h2>
        <p>
          PayRun is provided for legitimate payroll and workforce management purposes.
          Users must not attempt to access data outside their assigned role or company workspace.
        </p>
      </div>
      <div className="mkt-section mkt-prose">
        <h2>Account responsibilities</h2>
        <ul>
          <li>Admins are responsible for approving employee access and managing company settings.</li>
          <li>Users must keep login credentials confidential.</li>
          <li>Super admin accounts must only be used by authorized platform operators.</li>
        </ul>
      </div>
      <div className="mkt-section mkt-prose">
        <h2>Service availability</h2>
        <p>
          We aim to keep PayRun available and accurate, but payroll decisions remain the
          responsibility of your organization. Generated payslips should be reviewed before
          distribution to employees.
        </p>
      </div>
      <div className="mkt-section mkt-prose">
        <h2>Contact</h2>
        <p>
          Questions about these terms can be sent to{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
        </p>
      </div>
    </MarketingPage>
  );
}
