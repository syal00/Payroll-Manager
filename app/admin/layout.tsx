import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { isStaffRole, isMainAdminRole, isSupervisorRole, isSuperAdminRole } from "@/lib/roles";
import { getAdminHeaderForEmail } from "@/lib/admin-header";
import { AdminLayoutClient } from "@/components/shells/AdminLayoutClient";
import { getTenantActingCompanyId } from "@/lib/tenant-acting";
import { prisma } from "@/lib/prisma";
import type { TenantBranding } from "@/lib/tenant-branding";

async function loadTenantBranding(companyId: string): Promise<TenantBranding | undefined> {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { name: true, logoUrl: true },
  });
  if (!company) return undefined;
  return { name: company.name, logoUrl: company.logoUrl };
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const headerList = await headers();
  const pathname = headerList.get("x-pathname") ?? "";
  const isLoginRoute = pathname === "/admin/login";
  const isChangePasswordRoute = pathname === "/admin/change-password";

  const session = await getSession();

  let superAdminActing: { companyId: string; companyName: string } | undefined;
  let tenantBranding: TenantBranding | undefined;

  if (session && isSuperAdminRole(session.role)) {
    const tenantId = await getTenantActingCompanyId();
    if (!tenantId) {
      redirect("/super-admin/companies");
    }
    const company = await prisma.company.findUnique({
      where: { id: tenantId },
      select: { id: true, name: true, logoUrl: true },
    });
    if (!company) {
      redirect("/super-admin/companies");
    }
    superAdminActing = { companyId: company.id, companyName: company.name };
    tenantBranding = { name: company.name, logoUrl: company.logoUrl };
  } else if (session?.companyId) {
    tenantBranding = await loadTenantBranding(session.companyId);
  }

  if (
    !isLoginRoute &&
    (!session ||
      (!isStaffRole(session.role) && !isSupervisorRole(session.role) && !isSuperAdminRole(session.role)))
  ) {
    redirect("/login");
  }

  if (isLoginRoute) {
    return <AdminLayoutClient userName="" isMainAdmin={false}>{children}</AdminLayoutClient>;
  }

  if (session && !isChangePasswordRoute && !isSuperAdminRole(session.role)) {
    const userRow = await prisma.user.findUnique({
      where: { id: session.id },
      select: { mustChangePassword: true },
    });
    if (userRow?.mustChangePassword) {
      redirect("/admin/change-password");
    }
  }

  if (isChangePasswordRoute) {
    return <>{children}</>;
  }

  const header = getAdminHeaderForEmail(session!.email);
  const isMainAdmin = superAdminActing ? true : isMainAdminRole(session!.role);

  return (
    <AdminLayoutClient
      userName={session!.name}
      userEmail={session!.email}
      header={header ?? undefined}
      isMainAdmin={isMainAdmin}
      superAdminActing={superAdminActing}
      tenantBranding={tenantBranding}
    >
      {children}
    </AdminLayoutClient>
  );
}
