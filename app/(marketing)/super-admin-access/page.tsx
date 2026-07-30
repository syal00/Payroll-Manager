import { redirect } from "next/navigation";

/** Super admins sign in on the same page as other staff — no separate info page. */
export default function SuperAdminAccessPage() {
  redirect("/login");
}
