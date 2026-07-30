import type { Metadata } from "next";
import { MarketingPage } from "@/components/marketing/MarketingPage";
import { SUPPORT_EMAIL } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Contact — PayRun",
  description: "Get in touch with the PayRun team for support, demos, or general inquiries.",
};

export default function ContactPage() {
  return (
    <MarketingPage
      overline="Company"
      title="Contact us"
      lead="Have a question about PayRun, need help with your account, or want to schedule a walkthrough? Reach out below."
      actions={[
        { label: "Request a demo", href: "/demo-request", primary: true },
        { label: "Read the FAQ", href: "/faq" },
      ]}
    >
      <div className="mkt-contact-card">
        <p>
          <strong>Email</strong>
          <br />
          <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
        </p>
        <p style={{ marginTop: "1rem" }}>
          <strong>Support hours</strong>
          <br />
          Monday – Friday, 9:00 AM – 5:00 PM (local time)
        </p>
        <p style={{ marginTop: "1rem" }}>
          <strong>Demo requests</strong>
          <br />
          Use the <a href="/demo-request">demo request form</a> and our team will respond within
          24 hours.
        </p>
      </div>
      <div className="mkt-section mkt-prose">
        <h2>What to include in your message</h2>
        <ul>
          <li>Your company name and team size</li>
          <li>Whether you need admin, employee, or super admin access</li>
          <li>A brief description of your current payroll process</li>
        </ul>
      </div>
    </MarketingPage>
  );
}
