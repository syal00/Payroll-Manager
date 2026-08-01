import type { Prisma, PrismaClient } from "@prisma/client";
import { TimesheetStatus } from "@/lib/enums";
import {
  calendarDaysInPayPeriod,
  timesheetEntriesMatchPayPeriod,
  utcDateKey,
} from "@/lib/pay-period-utils";

type Db = PrismaClient | Prisma.TransactionClient;

const timesheetInclude = {
  entries: { orderBy: { workDate: "asc" as const } },
  approvals: { orderBy: { createdAt: "desc" as const }, take: 10 },
};

export type TimesheetWithEntries = Prisma.TimesheetGetPayload<{ include: typeof timesheetInclude }>;

export async function ensureTimesheetForPayPeriod(
  db: Db,
  params: {
    employeeId: string;
    payPeriodId: string;
    periodStart: Date;
    periodEnd: Date;
    periodOpen: boolean;
    createAction: string;
    createDetails?: Record<string, unknown>;
    writeAudit?: (payload: {
      action: string;
      entityId: string;
      details?: Record<string, unknown>;
    }) => Promise<void>;
  }
): Promise<TimesheetWithEntries> {
  const days = calendarDaysInPayPeriod(params.periodStart, params.periodEnd);

  let timesheet = await db.timesheet.findUnique({
    where: {
      employeeId_payPeriodId: { employeeId: params.employeeId, payPeriodId: params.payPeriodId },
    },
    include: timesheetInclude,
  });

  if (!timesheet) {
    if (!params.periodOpen) {
      throw new Error("TIMESHEET_NOT_FOUND_CLOSED");
    }
    timesheet = await db.timesheet.create({
      data: {
        employeeId: params.employeeId,
        payPeriodId: params.payPeriodId,
        status: TimesheetStatus.DRAFT,
        entries: {
          create: days.map((workDate) => ({
            workDate,
            regularHours: 0,
            overtimeHours: 0,
            leaveHours: 0,
          })),
        },
      },
      include: timesheetInclude,
    });
    if (params.writeAudit) {
      await params.writeAudit({
        action: params.createAction,
        entityId: timesheet.id,
        details: params.createDetails,
      });
    }
    return timesheet;
  }

  const editable =
    timesheet.status === TimesheetStatus.DRAFT || timesheet.status === TimesheetStatus.REJECTED;
  const mismatch = !timesheetEntriesMatchPayPeriod(
    timesheet.entries,
    params.periodStart,
    params.periodEnd
  );

  if (mismatch && params.periodOpen && editable) {
    const sheetId = timesheet.id;
    await db.timesheetEntry.deleteMany({ where: { timesheetId: sheetId } });
    await db.timesheetEntry.createMany({
      data: days.map((workDate) => ({
        timesheetId: sheetId,
        workDate,
        regularHours: 0,
        overtimeHours: 0,
        leaveHours: 0,
      })),
    });
    await db.timesheet.update({
      where: { id: sheetId },
      data: {
        totalRegular: 0,
        totalOvertime: 0,
        totalLeave: 0,
        totalHours: 0,
      },
    });
    timesheet = (await db.timesheet.findUnique({
      where: { id: timesheet.id },
      include: timesheetInclude,
    }))!;
  }

  return timesheet;
}

/** Stable YYYY-MM-DD for API responses and forms. */
export function workDateToInputValue(workDate: Date | string): string {
  return utcDateKey(new Date(workDate));
}
