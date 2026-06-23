import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { isStaffRole, isMainAdminRole } from "@/lib/roles";
import { getAdminHeaderForEmail } from "@/lib/admin-header";
import { AdminLayoutClient } from "@/components/shells/AdminLayoutClient";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const headerList = await headers();
  const pathname = headerList.get("x-pathname") ?? "";
  const isLoginRoute = pathname === "/admin/login";

  const session = await getSession();
  if (!isLoginRoute && (!session || !isStaffRole(session.role))) {
    redirect("/login");
  }

  if (isLoginRoute) {
    return <AdminLayoutClient userName="" isMainAdmin={false}>{children}</AdminLayoutClient>;
  }

  const header = getAdminHeaderForEmail(session!.email);
  return (
    <AdminLayoutClient
      userName={session!.name}
      userEmail={session!.email}
      header={header ?? undefined}
      isMainAdmin={isMainAdminRole(session!.role)}
    >
      {children}
    </AdminLayoutClient>
  );
}
