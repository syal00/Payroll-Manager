import type { Metadata } from "next";
import { MarketingFaqList } from "@/components/marketing/MarketingFaqList";
import { MarketingPage } from "@/components/marketing/MarketingPage";

export const metadata: Metadata = {
  title: "FAQ — WorkLedger",
  description: "Frequently asked questions about WorkLedger roles, timesheets, payslips, and access.",
};

export default function FaqPage() {
  return (
    <MarketingPage
      overline="Resources"
      title="Frequently asked questions"
      lead="Quick answers about how WorkLedger handles hours, approvals, payslips, and user roles."
      actions={[
        { label: "View documentation", href: "/documentation", primary: true },
        { label: "Request a demo", href: "/demo-request" },
      ]}
    >
      <MarketingFaqList />
    </MarketingPage>
  );
}
