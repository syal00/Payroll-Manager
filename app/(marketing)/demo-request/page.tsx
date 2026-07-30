import type { Metadata } from "next";
import { DemoRequestForm } from "@/components/marketing/DemoRequestForm";
import { MarketingPage } from "@/components/marketing/MarketingPage";

export const metadata: Metadata = {
  title: "Request a demo — PayRun",
  description: "Request a PayRun demo and see how timesheets, approvals, and payslips work together.",
};

export default function DemoRequestPage() {
  return (
    <MarketingPage
      overline="Company"
      title="Request a demo"
      lead="Tell us about your team and we'll set up a walkthrough of PayRun — timesheets, approvals, pay periods, and payslip generation."
      wide
    >
      <DemoRequestForm />
      <div className="mkt-section mkt-prose">
        <p>
          Already have an account? <a href="/login">Sign in to the admin dashboard</a> or visit the{" "}
          <a href="/employee-portal">employee portal</a>.
        </p>
      </div>
    </MarketingPage>
  );
}
