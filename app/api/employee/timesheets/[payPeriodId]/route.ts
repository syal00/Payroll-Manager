import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireEmployee } from "@/lib/api-auth";
import { getEmployeeRecord } from "@/lib/employee-scope";
import { PayPeriodStatus, TimesheetStatus } from "@/lib/enums";
import { sumEntries, validateDayEntry } from "@/lib/timesheet-math";
import { normalizeEntryLocation } from "@/lib/timesheet-entry-fields";
import { updateTimesheetEntryHours } from "@/lib/timesheet-entry-hours-update";
import { writeAuditLog } from "@/lib/audit";
import { eachDayOfInterval } from "date-fns";
import { validateTimesheetRowsAgainstPeriod } from "@/lib/timesheet-submit-validation";
import { validateTimesheetWorkDatePolicy } from "@/lib/timesheet-work-date-policy";
import { timesheetSaveRequestSchema } from "@/lib/timesheet-save-payload";
import {
  readTimesheetJsonBody,
  timesheetUnknownErrorResponse,
  timesheetZodErrorResponse,
} from "@/lib/timesheet-api-error";
import { z } from "zod";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ payPeriodId: string }> }
) {
  try {
    const session = await requireEmployee();
    const { payPeriodId } = await ctx.params;
    const employee = await getEmployeeRecord(session.id);
    if (!employee) {
      return NextResponse.json({ error: "Employee profile missing" }, { status: 400 });
    }
    const period = await prisma.payPeriod.findUnique({ where: { id: payPeriodId } });
    if (!period || period.status !== PayPeriodStatus.OPEN) {
      return NextResponse.json({ error: "Pay period not available for submission." }, { status: 400 });
    }

    let timesheet = await prisma.timesheet.findUnique({
      where: {
        employeeId_payPeriodId: { employeeId: employee.id, payPeriodId },
      },
      include: {
        entries: { orderBy: { workDate: "asc" } },
        approvals: { orderBy: { createdAt: "desc" }, take: 10 },
      },
    });

    if (!timesheet) {
      const days = eachDayOfInterval({ start: period.startDate, end: period.endDate });
      timesheet = await prisma.timesheet.create({
        data: {
          employeeId: employee.id,
          payPeriodId,
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
        include: {
          entries: { orderBy: { workDate: "asc" } },
          approvals: { orderBy: { createdAt: "desc" }, take: 10 },
        },
      });
      await writeAuditLog({
        actorId: session.id,
        action: "TIMESHEET_DRAFT_CREATED",
        entityType: "Timesheet",
        entityId: timesheet.id,
        details: { payPeriodId },
      });
    }

    const editable =
      timesheet.status === TimesheetStatus.DRAFT || timesheet.status === TimesheetStatus.REJECTED;

    return NextResponse.json({ timesheet, payPeriod: period, editable });
  } catch (e) {
    console.error(e);
    return timesheetUnknownErrorResponse(e);
  }
}

export async function PUT(
  req: Request,
  ctx: { params: Promise<{ payPeriodId: string }> }
) {
  try {
    const session = await requireEmployee();
    const { payPeriodId } = await ctx.params;
    const raw = await readTimesheetJsonBody(req);
    if (raw instanceof NextResponse) return raw;
    const body = timesheetSaveRequestSchema.parse(raw);
    const employee = await getEmployeeRecord(session.id);
    if (!employee) {
      return NextResponse.json({ error: "Employee profile missing" }, { status: 400 });
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
      return NextResponse.json({ error: "Timesheet not found; open it first." }, { status: 404 });
    }
    if (timesheet.status !== TimesheetStatus.DRAFT && timesheet.status !== TimesheetStatus.REJECTED) {
      return NextResponse.json({ error: "This timesheet can no longer be edited." }, { status: 400 });
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
      const row = sortedExisting[i];
      if (row) {
        const dateErr = validateTimesheetWorkDatePolicy(row.workDate);
        if (dateErr) return NextResponse.json({ error: dateErr }, { status: 400 });
      }
    }

    const totals = sumEntries(body.entries);

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
          notes: body.notes ?? null,
          totalRegular: totals.totalRegular,
          totalOvertime: totals.totalOvertime,
          totalLeave: totals.totalLeave,
          totalHours: totals.totalHours,
        },
      });
    });

    const fresh = await prisma.timesheet.findUnique({
      where: { id: timesheet.id },
      include: {
        entries: { orderBy: { workDate: "asc" } },
        approvals: { orderBy: { createdAt: "desc" }, take: 10 },
      },
    });

    await writeAuditLog({
      actorId: session.id,
      action: "TIMESHEET_SAVED_DRAFT",
      entityType: "Timesheet",
      entityId: timesheet.id,
      details: { totals },
    });

    return NextResponse.json({ timesheet: fresh, editable: true });
  } catch (e) {
    if (e instanceof z.ZodError) return timesheetZodErrorResponse(e);
    console.error(e);
    return timesheetUnknownErrorResponse(e);
  }
}
