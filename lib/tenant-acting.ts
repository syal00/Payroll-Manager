import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { Role } from "@/lib/enums";
import { isSuperAdminRole } from "@/lib/roles";
import type { SessionUser } from "@/lib/session";

import { TENANT_ACTING_COOKIE } from "@/lib/tenant-acting-constants";

export async function getTenantActingCompanyId(): Promise<string | null> {
  const jar = await cookies();
  const raw = jar.get(TENANT_ACTING_COOKIE)?.value?.trim();
  return raw || null;
}

/** Company id for tenant-scoped admin API routes (session, super-admin drill-down cookie). */
export async function resolveTenantCompanyId(session: SessionUser): Promise<string | null> {
  if (session.companyId) return session.companyId;
  if (!isSuperAdminRole(session.role)) return null;
  const acting = await applySuperAdminTenantActing(session);
  return acting.companyId;
}

/** API prefixes super admin may call when tenant-acting cookie is set. */
export function isTenantScopedApiPath(pathname: string): boolean {
  return (
    pathname.startsWith("/api/admin/") ||
    pathname.startsWith("/api/timesheets") ||
    pathname.startsWith("/api/payslips") ||
    pathname.startsWith("/api/pay-periods") ||
    pathname.startsWith("/api/validate-email") ||
    pathname.startsWith("/api/profile")
  );
}

/**
 * When SUPER_ADMIN has a valid tenant cookie, act as MAIN_ADMIN for that company so all
 * existing admin/manager routes and scope helpers behave identically to a company admin.
 */
export async function applySuperAdminTenantActing(session: SessionUser): Promise<SessionUser> {
  if (!isSuperAdminRole(session.role)) return session;

  const companyId = await getTenantActingCompanyId();
  if (!companyId) return session;

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { id: true },
  });
  if (!company) return session;

  return {
    ...session,
    role: Role.MAIN_ADMIN,
    companyId: company.id,
  };
}

export async function requireSuperAdminTenantActing(session: SessionUser): Promise<SessionUser> {
  const acting = await applySuperAdminTenantActing(session);
  if (acting.companyId && acting.role === Role.MAIN_ADMIN) return acting;

  const err = new Error(
    "Open a company from the super-admin console and use Admin console to manage that tenant."
  );
  (err as Error & { status: number }).status = 403;
  throw err;
}

export function isSuperAdminActingAsTenant(
  originalRole: SessionUser["role"],
  acting: SessionUser
): boolean {
  return isSuperAdminRole(originalRole) && acting.role === Role.MAIN_ADMIN && Boolean(acting.companyId);
}
