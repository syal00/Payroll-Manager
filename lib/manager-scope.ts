import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isMainAdminRole, isManagerRole, isSuperAdminRole, isSupervisorRole } from "@/lib/roles";
import type { SessionUser } from "@/lib/session";

/**
 * Company + role scoping for staff sessions. Company scoping always applies first (SUPER_ADMIN is
 * the sole exception — cross-company by design), then the existing role-specific fallback logic is
 * AND-ed on top of it: managers keep seeing their reports plus unassigned employees, supervisors see
 * only their exact direct reports.
 */
export function scopeFor(session: SessionUser): Prisma.EmployeeWhereInput {
  if (isSuperAdminRole(session.role)) return {};

  const companyFilter: Prisma.EmployeeWhereInput = { companyId: session.companyId };

  if (isMainAdminRole(session.role)) return companyFilter;

  if (isManagerRole(session.role)) {
    return { AND: [companyFilter, { OR: [{ managerUserId: session.id }, { managerUserId: null }] }] };
  }

  if (isSupervisorRole(session.role)) {
    return { AND: [companyFilter, { supervisorId: session.id }] };
  }

  return { id: "__no_access__" };
}

/** Extra `where` for employees visible to the current staff user (undefined = no filter, SUPER_ADMIN only). */
export function employeeWhereForStaff(session: SessionUser): Prisma.EmployeeWhereInput | undefined {
  if (isSuperAdminRole(session.role)) return undefined;
  return scopeFor(session);
}

export function timesheetWhereForStaff(session: SessionUser): Prisma.TimesheetWhereInput {
  const ew = employeeWhereForStaff(session);
  if (!ew) return {};
  return { employee: ew };
}

export function payslipWhereForStaff(session: SessionUser): Prisma.PayslipWhereInput {
  const ew = employeeWhereForStaff(session);
  if (!ew) return {};
  return { employee: ew };
}

export async function assertStaffCanAccessEmployee(session: SessionUser, employeeId: string): Promise<boolean> {
  if (isSuperAdminRole(session.role)) return false;

  const row = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: { companyId: true, managerUserId: true, supervisorId: true },
  });
  if (!row) return false;
  if (row.companyId !== session.companyId) return false;

  if (isMainAdminRole(session.role)) return true;
  if (isManagerRole(session.role)) {
    return row.managerUserId === session.id || row.managerUserId === null;
  }
  if (isSupervisorRole(session.role)) {
    return row.supervisorId === session.id;
  }
  return false;
}

/** Super-admin company drill-down — employee must belong to the URL's targetCompanyId. */
export async function assertStaffCanAccessEmployeeInCompanyDrilldown(
  employeeId: string,
  targetCompanyId: string
): Promise<boolean> {
  const row = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: { companyId: true },
  });
  return row?.companyId === targetCompanyId;
}

/**
 * Company drill-down scope for `app/api/super-admin/companies/[companyId]/*` routes. `targetCompanyId`
 * ALWAYS comes from the URL param — a super admin's session.companyId is null, so `scopeFor` would
 * return `{}` (no filter) and mix every tenant's rows together, which is the bug this function exists
 * to prevent. Never falls back to "no filter": every branch, including the default, includes the
 * companyId filter.
 */
export function scopeForCompanyDrilldown(
  session: SessionUser,
  targetCompanyId: string
): Prisma.EmployeeWhereInput {
  const companyFilter: Prisma.EmployeeWhereInput = { companyId: targetCompanyId };

  // These routes are requireSuperAdmin()-gated today, so this is full access within the target
  // company. Kept role-aware (rather than always returning companyFilter) so a future narrower
  // "impersonate as manager/supervisor" view can reuse this same helper without weakening it.
  if (isManagerRole(session.role)) {
    return { AND: [companyFilter, { OR: [{ managerUserId: session.id }, { managerUserId: null }] }] };
  }
  if (isSupervisorRole(session.role)) {
    return { AND: [companyFilter, { supervisorId: session.id }] };
  }
  return companyFilter;
}

export function timesheetWhereForCompanyDrilldown(
  session: SessionUser,
  targetCompanyId: string
): Prisma.TimesheetWhereInput {
  return { employee: scopeForCompanyDrilldown(session, targetCompanyId) };
}

export function payslipWhereForCompanyDrilldown(
  session: SessionUser,
  targetCompanyId: string
): Prisma.PayslipWhereInput {
  return { employee: scopeForCompanyDrilldown(session, targetCompanyId) };
}
