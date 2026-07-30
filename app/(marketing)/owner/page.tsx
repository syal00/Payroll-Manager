import type { Metadata } from "next";
import { OwnerProfile } from "@/components/marketing/OwnerProfile";

export const metadata: Metadata = {
  title: "Owner — PayRun",
  description:
    "Meet Rakesh Syal — full-stack developer and creator of PayRun, a payroll and workforce management platform.",
};

export default function OwnerPage() {
  return <OwnerProfile />;
}
