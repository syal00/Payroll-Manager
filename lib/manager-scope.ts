import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { companyIdFilter, getEmployeeVisibilityCompanyIds, payPeriodCompanyIdFilter } from "@/lib/company-mirror";
import { isMainAdminRole, isManagerRole, isSuperAdminRole, isSupervisorRole } from "@/lib/roles";
import type { SessionUser } from "@/lib/session";

function scopeForWithCompanies(session: SessionUser, companyIds: string[]): Prisma.EmployeeWhereInput {
  if (isSuperAdminRole(session.role)) return {};

  const companyFilter = companyIdFilter(companyIds);

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
export async function employeeWhereForStaff(session: SessionUser): Promise<Prisma.EmployeeWhereInput | undefined> {
  if (isSuperAdminRole(session.role)) return undefined;
  if (!session.companyId) return { id: "__no_access__" };
  const companyIds = await getEmployeeVisibilityCompanyIds(session.companyId);
  return scopeForWithCompanies(session, companyIds);
}

export async function timesheetWhereForStaff(session: SessionUser): Promise<Prisma.TimesheetWhereInput> {
  if (isSuperAdminRole(session.role)) return {};
  const companyId = session.companyId;
  if (!companyId) return { id: "__no_access__" };

  const companyIds = await getEmployeeVisibilityCompanyIds(companyId);
  const employeeScope = scopeForWithCompanies(session, companyIds);
  return {
    OR: [{ employee: employeeScope }, { payPeriod: payPeriodCompanyIdFilter(companyIds) }],
  };
}

export async function payslipWhereForStaff(session: SessionUser): Promise<Prisma.PayslipWhereInput> {
  const ew = await employeeWhereForStaff(session);
  if (!ew) return {};
  return { employee: ew };
}

export async function assertStaffCanAccessEmployee(session: SessionUser, employeeId: string): Promise<boolean> {
  if (isSuperAdminRole(session.role)) return false;

  const row = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: { companyId: true, managerUserId: true, supervisorId: true },
  });
  if (!row?.companyId || !session.companyId) return false;

  const visibleCompanyIds = await getEmployeeVisibilityCompanyIds(session.companyId);
  if (!visibleCompanyIds.includes(row.companyId)) return false;

  if (isMainAdminRole(session.role)) return true;
  if (isManagerRole(session.role)) {
    return row.managerUserId === session.id || row.managerUserId === null;
  }
  if (isSupervisorRole(session.role)) {
    return row.supervisorId === session.id;
  }
  return false;
}

/** Super-admin company drill-down — employees visible for the URL tenant (includes mirror source when viewing target). */
export async function scopeForCompanyDrilldown(
  session: SessionUser,
  targetCompanyId: string
): Promise<Prisma.EmployeeWhereInput> {
  const companyIds = await getEmployeeVisibilityCompanyIds(targetCompanyId);
  return scopeForWithCompanies(session, companyIds);
}

export async function timesheetWhereForCompanyDrilldown(
  session: SessionUser,
  targetCompanyId: string
): Promise<Prisma.TimesheetWhereInput> {
  const companyIds = await getEmployeeVisibilityCompanyIds(targetCompanyId);
  return {
    OR: [
      { employee: scopeForWithCompanies(session, companyIds) },
      { payPeriod: payPeriodCompanyIdFilter(companyIds) },
    ],
  };
}

export async function payslipWhereForCompanyDrilldown(
  session: SessionUser,
  targetCompanyId: string
): Promise<Prisma.PayslipWhereInput> {
  return { employee: await scopeForCompanyDrilldown(session, targetCompanyId) };
}

/** @deprecated Use scopeForCompanyDrilldown — kept for type compatibility in comments only. */
export function assertStaffCanAccessEmployeeInCompanyDrilldown(
  employeeId: string,
  targetCompanyId: string
): Promise<boolean> {
  return prisma.employee
    .findFirst({
      where: { id: employeeId },
      select: { companyId: true },
    })
    .then(async (row) => {
      if (!row?.companyId) return false;
      const visible = await getEmployeeVisibilityCompanyIds(targetCompanyId);
      return visible.includes(row.companyId);
    });
}
