import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getPublicEmployeeByCode } from "@/lib/public-employee";
import { ensureEmployeeCompanyId } from "@/lib/employee-company-scope";
import { PayPeriodStatus, TimesheetStatus } from "@/lib/enums";
import { sumEntries, validateDayEntry } from "@/lib/timesheet-math";
import { normalizeEntryLocation } from "@/lib/timesheet-entry-fields";
import { updateTimesheetEntryHours } from "@/lib/timesheet-entry-hours-update";
import { writeAuditLog } from "@/lib/audit";
import { validateTimesheetRowsAgainstPeriod } from "@/lib/timesheet-submit-validation";
import { ensureTimesheetForPayPeriod } from "@/lib/timesheet-period-entries";
import { validateTimesheetWorkDatePolicyForEntry } from "@/lib/timesheet-work-date-policy";
import { timesheetSaveRequestSchema } from "@/lib/timesheet-save-payload";
import {
  readTimesheetJsonBody,
  timesheetUnknownErrorResponse,
  timesheetZodErrorResponse,
} from "@/lib/timesheet-api-error";
import { z } from "zod";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ employeeId: string; payPeriodId: string }> }
) {
  try {
    const { employeeId, payPeriodId } = await ctx.params;
    const employee = await getPublicEmployeeByCode(employeeId);
    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    const companyId = await ensureEmployeeCompanyId(employee, (await headers()).get("x-company-id"));

    const period = await prisma.payPeriod.findUnique({ where: { id: payPeriodId } });
    if (!period) {
      return NextResponse.json({ error: "Pay period not found." }, { status: 404 });
    }
    if (companyId && period.companyId !== companyId) {
      return NextResponse.json({ error: "Pay period not available for your organization." }, { status: 403 });
    }

    const periodOpen = period.status === PayPeriodStatus.OPEN;

    let timesheet;
    try {
      timesheet = await ensureTimesheetForPayPeriod(prisma, {
        employeeId: employee.id,
        payPeriodId,
        periodStart: period.startDate,
        periodEnd: period.endDate,
        periodOpen,
        createAction: "TIMESHEET_DRAFT_CREATED_PUBLIC",
        createDetails: { payPeriodId, employeeId },
        writeAudit: async ({ action, entityId, details }) => {
          await writeAuditLog({
            actorId: null,
            action,
            entityType: "Timesheet",
            entityId,
            details,
          });
        },
      });
    } catch (e) {
      if (e instanceof Error && e.message === "TIMESHEET_NOT_FOUND_CLOSED") {
        return NextResponse.json(
          { error: "This pay period is closed and you have no submission on file." },
          { status: 404 }
        );
      }
      throw e;
    }

    const editable =
      periodOpen &&
      (timesheet.status === TimesheetStatus.DRAFT || timesheet.status === TimesheetStatus.REJECTED);

    return NextResponse.json({
      timesheet,
      payPeriod: period,
      editable,
      periodClosed: !periodOpen,
      readOnlyReason: !periodOpen
        ? period.status === PayPeriodStatus.CLOSED
          ? "This pay period has been closed by payroll. Your submitted hours are shown below (read-only)."
          : "This pay period is no longer open for edits."
        : null,
    });
  } catch (e) {
    console.error(e);
    return timesheetUnknownErrorResponse(e);
  }
}

export async function PUT(
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

    const companyId = await ensureEmployeeCompanyId(employee, (await headers()).get("x-company-id"));

    const period = await prisma.payPeriod.findUnique({ where: { id: payPeriodId } });
    if (!period || period.status !== PayPeriodStatus.OPEN) {
      return NextResponse.json({ error: "Pay period is not open." }, { status: 400 });
    }
    if (companyId && period.companyId !== companyId) {
      return NextResponse.json({ error: "Pay period not available for your organization." }, { status: 403 });
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
        const dateErr = validateTimesheetWorkDatePolicyForEntry(row.workDate, body.entries[i]!);
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
      actorId: null,
      action: "TIMESHEET_SAVED_DRAFT_PUBLIC",
      entityType: "Timesheet",
      entityId: timesheet.id,
      details: { totals, employeeId },
    });

    return NextResponse.json({ timesheet: fresh, editable: true });
  } catch (e) {
    if (e instanceof z.ZodError) return timesheetZodErrorResponse(e);
    console.error(e);
    return timesheetUnknownErrorResponse(e);
  }
}
