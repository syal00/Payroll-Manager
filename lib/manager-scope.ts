import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isMainAdminRole, isManagerRole } from "@/lib/roles";
import type { SessionUser } from "@/lib/session";

/**
 * Extra `where` for employees visible to the current staff user (undefined = all).
 * Managers see their direct reports plus employees with no assigned manager (so payroll still works
 * until a main admin assigns `managerUserId`).
 */
export function employeeWhereForStaff(session: SessionUser): Prisma.EmployeeWhereInput | undefined {
  if (isMainAdminRole(session.role)) return undefined;
  if (isManagerRole(session.role)) {
    return { OR: [{ managerUserId: session.id }, { managerUserId: null }] };
  }
  return { id: "__no_access__" };
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
  if (isMainAdminRole(session.role)) return true;
  if (!isManagerRole(session.role)) return false;
  const row = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: { managerUserId: true },
  });
  if (!row) return false;
  if (row.managerUserId === session.id) return true;
  if (row.managerUserId === null) return true;
  return false;
}
