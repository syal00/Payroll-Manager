import "server-only";

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type Tx = Prisma.TransactionClient;

/** Remove payslips, timesheets, and child rows for one employee profile. */
export async function deleteEmployeePayrollData(tx: Tx, employeeId: string) {
  const payslipIds = (
    await tx.payslip.findMany({ where: { employeeId }, select: { id: true } })
  ).map((p) => p.id);

  if (payslipIds.length > 0) {
    await tx.payslipItem.deleteMany({ where: { payslipId: { in: payslipIds } } });
    await tx.payslip.deleteMany({ where: { id: { in: payslipIds } } });
  }

  const timesheetIds = (
    await tx.timesheet.findMany({ where: { employeeId }, select: { id: true } })
  ).map((t) => t.id);

  if (timesheetIds.length > 0) {
    await tx.approval.deleteMany({ where: { timesheetId: { in: timesheetIds } } });
    await tx.timesheetEntry.deleteMany({ where: { timesheetId: { in: timesheetIds } } });
    await tx.timesheet.deleteMany({ where: { id: { in: timesheetIds } } });
  }
}

/** Delete portal user only when no employee profiles still reference it (shared mirror logins). */
export async function deleteEmployeeUserIfOrphaned(
  tx: Tx,
  userId: string | null | undefined
): Promise<boolean> {
  if (!userId) return false;

  const remaining = await tx.employee.count({ where: { userId } });
  if (remaining > 0) return false;

  await tx.notification.deleteMany({ where: { userId } });
  await tx.user.delete({ where: { id: userId } });
  return true;
}

export async function getMirroredEmployeeIds(sourceEmployeeId: string): Promise<string[]> {
  const mirrors = await prisma.employee.findMany({
    where: { mirroredFromEmployeeId: sourceEmployeeId },
    select: { id: true },
  });
  return mirrors.map((m) => m.id);
}

/** Hard-delete one employee row and payroll data; shared users are kept when still linked elsewhere. */
export async function permanentlyDeleteEmployeeRecord(
  tx: Tx,
  employeeId: string
): Promise<{ userId: string | null; userRemoved: boolean }> {
  const employee = await tx.employee.findUnique({
    where: { id: employeeId },
    select: { userId: true },
  });
  if (!employee) return { userId: null, userRemoved: false };

  const userId = employee.userId;
  await deleteEmployeePayrollData(tx, employeeId);
  await tx.employee.delete({ where: { id: employeeId } });
  const userRemoved = await deleteEmployeeUserIfOrphaned(tx, userId);
  return { userId, userRemoved };
}
