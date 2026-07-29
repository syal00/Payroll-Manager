import { headers } from "next/headers";
import { AdminLoginForm } from "@/components/auth/AdminLoginForm";

export default async function AdminLoginPage() {
  const h = await headers();
  const companyName = h.get("x-company-name");
  const companyLogoUrl = h.get("x-company-logo");

  return <AdminLoginForm companyName={companyName} companyLogoUrl={companyLogoUrl} />;
}
