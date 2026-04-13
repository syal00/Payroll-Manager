import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPublicEmployeeByCode } from "@/lib/public-employee";
import { PayPeriodStatus, TimesheetStatus } from "@/lib/enums";
import { sumEntries, validateDayEntry } from "@/lib/timesheet-math";
import { normalizeEntryLocation } from "@/lib/timesheet-entry-fields";
import { updateTimesheetEntryHours } from "@/lib/timesheet-entry-hours-update";
import { writeAuditLog } from "@/lib/audit";
import { validateTimesheetRowsAgainstPeriod } from "@/lib/timesheet-submit-validation";
import { timesheetSaveRequestSchema } from "@/lib/timesheet-save-payload";
import {
  readTimesheetJsonBody,
  timesheetUnknownErrorResponse,
  timesheetZodErrorResponse,
} from "@/lib/timesheet-api-error";
import { z } from "zod";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ employeeId: string; payPeriodId: string }> }
) {
  try {
    const { employeeId, payPeriodId } = await ctx.params;
    const raw = await readTimesheetJsonBody(req);
    if (raw instanceof NextResponse) return raw;
    const body = timesheetSaveRequestSchema.parse(raw);
    const employee = await getPublicEmployeeByCode(employeeId);
    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    const period = await prisma.payPeriod.findUnique({ where: { id: payPeriodId } });
    if (!period || period.status !== PayPeriodStatus.OPEN) {
      return NextResponse.json({ error: "Pay period is not open." }, { status: 400 });
    }

    const timesheet = await prisma.timesheet.findUnique({
      where: {
        employeeId_payPeriodId: { employeeId: employee.id, payPeriodId },
      },
      include: { entries: true },
    });
    if (!timesheet) {
      return NextResponse.json({ error: "Timesheet not found." }, { status: 404 });
    }
    if (timesheet.status !== TimesheetStatus.DRAFT && timesheet.status !== TimesheetStatus.REJECTED) {
      return NextResponse.json({ error: "Already submitted or finalized." }, { status: 400 });
    }

    const sortedExisting = [...timesheet.entries].sort(
      (a, b) => new Date(a.workDate).getTime() - new Date(b.workDate).getTime()
    );
    const rowCheck = validateTimesheetRowsAgainstPeriod(body.entries, sortedExisting);
    if (!rowCheck.ok) {
      return NextResponse.json({ error: rowCheck.error }, { status: rowCheck.status });
    }
    const n = rowCheck.dayCount;
    for (let i = 0; i < n; i++) {
      const v = validateDayEntry(body.entries[i]!);
      if (v) return NextResponse.json({ error: v }, { status: 400 });
    }

    const totals = sumEntries(body.entries);
    if (totals.totalHours <= 0) {
      return NextResponse.json({ error: "Submit at least some hours or use leave." }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      for (let i = 0; i < n; i++) {
        const row = sortedExisting[i];
        const ent = body.entries[i]!;
        if (!row) continue;
        await updateTimesheetEntryHours(tx, row.id, {
          regularHours: ent.regularHours,
          overtimeHours: ent.overtimeHours,
          leaveHours: ent.leaveHours,
          location: normalizeEntryLocation(ent.location),
          notes: ent.notes ?? null,
        });
      }
      await tx.timesheet.update({
        where: { id: timesheet.id },
        data: {
          status: TimesheetStatus.PENDING,
          notes: body.notes ?? null,
          totalRegular: totals.totalRegular,
          totalOvertime: totals.totalOvertime,
          totalLeave: totals.totalLeave,
          totalHours: totals.totalHours,
          submittedAt: new Date(),
        },
      });
    });

    if (employee.userId) {
      await prisma.notification.create({
        data: {
          userId: employee.userId,
          type: "TIMESHEET_SUBMITTED",
          title: "Timesheet submitted",
          body: `Your hours for ${period.name ?? "the pay period"} were submitted for review.`,
        },
      });
    }

    await writeAuditLog({
      actorId: null,
      action: "TIMESHEET_SUBMITTED_PUBLIC",
      entityType: "Timesheet",
      entityId: timesheet.id,
      details: { totals, payPeriodId, employeeId },
    });

    const fresh = await prisma.timesheet.findUnique({
      where: { id: timesheet.id },
      include: { entries: { orderBy: { workDate: "asc" } } },
    });

    return NextResponse.json({ timesheet: fresh, editable: false });
  } catch (e) {
    if (e instanceof z.ZodError) return timesheetZodErrorResponse(e);
    console.error(e);
    return timesheetUnknownErrorResponse(e);
  }
}
