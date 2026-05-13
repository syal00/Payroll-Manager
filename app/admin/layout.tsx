import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { isStaffRole, isMainAdminRole } from "@/lib/roles";
import { AdminShell } from "@/components/shells/AdminShell";
import { getAdminHeaderForEmail } from "@/lib/admin-header";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || !isStaffRole(session.role)) {
    redirect("/login");
  }
  const header = getAdminHeaderForEmail(session.email);
  return (
    <AdminShell
      userName={session.name}
      userEmail={session.email}
      header={header ?? undefined}
      isMainAdmin={isMainAdminRole(session.role)}
    >
      {children}
    </AdminShell>
  );
}
