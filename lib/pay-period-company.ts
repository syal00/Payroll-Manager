import type { Prisma, PrismaClient } from "@prisma/client";
import type { SessionUser } from "@/lib/session";

type DbClient = PrismaClient | Prisma.TransactionClient;

export function requireStaffCompanyId(session: SessionUser): string {
  if (!session.companyId) {
    const err = new Error("Company context required");
    (err as Error & { status: number }).status = 403;
    throw err;
  }
  return session.companyId;
}

export async function clearCurrentPayPeriods(db: DbClient, companyId: string) {
  await db.payPeriod.updateMany({
    where: { companyId, isCurrent: true },
    data: { isCurrent: false },
  });
}

export async function findPayPeriodByWindow(
  db: DbClient,
  companyId: string,
  startDate: Date,
  endDate: Date
) {
  return db.payPeriod.findFirst({
    where: { companyId, startDate, endDate },
  });
}

/** Keep a single current flag per company (newest start date wins). */
export async function normalizeCurrentPayPeriod(db: DbClient, companyId: string) {
  const currentRows = await db.payPeriod.findMany({
    where: { companyId, isCurrent: true },
    orderBy: { startDate: "desc" },
    select: { id: true },
  });
  if (currentRows.length <= 1) return;
  const [keep, ...rest] = currentRows;
  if (!keep) return;
  await db.payPeriod.updateMany({
    where: { id: { in: rest.map((r) => r.id) } },
    data: { isCurrent: false },
  });
}

/** Remove payslips, timesheets, and related rows before deleting the pay period. */
export async function deletePayPeriodWithData(db: DbClient, payPeriodId: string) {
  const payslipIds = (
    await db.payslip.findMany({
      where: { payPeriodId },
      select: { id: true },
    })
  ).map((p) => p.id);

  if (payslipIds.length > 0) {
    await db.payslipItem.deleteMany({ where: { payslipId: { in: payslipIds } } });
    await db.payslip.deleteMany({ where: { id: { in: payslipIds } } });
  }

  const timesheetIds = (
    await db.timesheet.findMany({
      where: { payPeriodId },
      select: { id: true },
    })
  ).map((t) => t.id);

  if (timesheetIds.length > 0) {
    await db.approval.deleteMany({ where: { timesheetId: { in: timesheetIds } } });
    await db.timesheetEntry.deleteMany({ where: { timesheetId: { in: timesheetIds } } });
    await db.timesheet.deleteMany({ where: { id: { in: timesheetIds } } });
  }

  await db.payPeriod.delete({ where: { id: payPeriodId } });
}
