import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";
import { writeAuditLog } from "@/lib/audit";
import { validateTimesheetWorkDatePolicy } from "@/lib/timesheet-work-date-policy";
import { sumEntries, validateDayEntry } from "@/lib/timesheet-math";
import { normalizeEntryLocation } from "@/lib/timesheet-entry-fields";
import { updateTimesheetEntryHours } from "@/lib/timesheet-entry-hours-update";
import { z } from "zod";

const entrySchema = z.object({
  id: z.string(),
  regularHours: z.number().min(0),
  overtimeHours: z.number().min(0),
  leaveHours: z.number().min(0),
  location: z.string().max(200).nullable().optional(),
  notes: z.string().nullable().optional(),
});

const patchSchema = z.object({
  notes: z.string().nullable().optional(),
  entries: z.array(entrySchema).optional(),
  hourlyRate: z.number().positive().optional(),
  overtimeRate: z.number().positive().optional(),
  editSummary: z.string().max(500).optional().nullable(),
});

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin();
    const { id } = await ctx.params;
    const body = patchSchema.parse(await req.json());

    const ts = await prisma.timesheet.findUnique({
      where: { id },
      include: {
        entries: true,
        payslip: true,
        employee: { include: { user: true } },
      },
    });

    if (!ts) {
      return NextResponse.json({ error: "Timesheet not found" }, { status: 404 });
    }

    if (ts.payslip) {
      return NextResponse.json(
        {
          error:
            "Cannot edit hours while a payslip exists. Remove the payslip record first if a correction is required.",
        },
        { status: 400 }
      );
    }

    if (body.entries) {
      const byId = new Map(ts.entries.map((e) => [e.id, e]));
      if (body.entries.length !== ts.entries.length) {
        return NextResponse.json(
          { error: "You must submit all day rows for this timesheet." },
          { status: 400 }
        );
      }
      for (const row of body.entries) {
        const existing = byId.get(row.id);
        if (!existing) {
          return NextResponse.json({ error: "Invalid entry id in payload." }, { status: 400 });
        }
        const dateErr = validateTimesheetWorkDatePolicy(existing.workDate);
        if (dateErr) return NextResponse.json({ error: dateErr }, { status: 400 });
        const v = validateDayEntry({
          regularHours: row.regularHours,
          overtimeHours: row.overtimeHours,
          leaveHours: row.leaveHours,
        });
        if (v) return NextResponse.json({ error: v }, { status: 400 });
      }
    }

    const totals = body.entries
      ? sumEntries(
          body.entries.map((e) => ({
            regularHours: e.regularHours,
            overtimeHours: e.overtimeHours,
            leaveHours: e.leaveHours,
          }))
        )
      : null;

    await prisma.$transaction(async (tx) => {
      if (body.entries && totals) {
        for (const row of body.entries) {
          await updateTimesheetEntryHours(tx, row.id, {
            regularHours: row.regularHours,
            overtimeHours: row.overtimeHours,
            leaveHours: row.leaveHours,
            location: normalizeEntryLocation(row.location),
            notes: row.notes ?? null,
          });
        }
        await tx.timesheet.update({
          where: { id },
          data: {
            totalRegular: totals.totalRegular,
            totalOvertime: totals.totalOvertime,
            totalLeave: totals.totalLeave,
            totalHours: totals.totalHours,
            ...(body.notes !== undefined ? { notes: body.notes } : {}),
          },
        });
      } else if (body.notes !== undefined) {
        await tx.timesheet.update({
          where: { id },
          data: { notes: body.notes },
        });
      }

      if (body.hourlyRate !== undefined || body.overtimeRate !== undefined) {
        await tx.employee.update({
          where: { id: ts.employeeId },
          data: {
            ...(body.hourlyRate !== undefined ? { hourlyRate: body.hourlyRate } : {}),
            ...(body.overtimeRate !== undefined ? { overtimeRate: body.overtimeRate } : {}),
          },
        });
      }
    });

    await writeAuditLog({
      actorId: session.id,
      action: "TIMESHEET_ADMIN_EDITED",
      entityType: "Timesheet",
      entityId: id,
      details: {
        entriesUpdated: Boolean(body.entries),
        notesUpdated: body.notes !== undefined,
        ratesUpdated: body.hourlyRate !== undefined || body.overtimeRate !== undefined,
        summary: body.editSummary ?? null,
        totals: totals ?? undefined,
      },
    });

    if (
      ts.employee.userId &&
      (body.entries ||
        body.notes !== undefined ||
        body.hourlyRate !== undefined ||
        body.overtimeRate !== undefined)
    ) {
      await prisma.notification.create({
        data: {
          userId: ts.employee.userId,
          type: "TIMESHEET_ADMIN_UPDATED",
          title: "Timesheet updated",
          body:
            body.editSummary?.trim() ||
            "An administrator adjusted your timesheet or pay settings. Review your hours in the employee portal.",
        },
      });
    }

    const fresh = await prisma.timesheet.findUnique({
      where: { id },
      include: {
        entries: { orderBy: { workDate: "asc" } },
        employee: { include: { user: true } },
        payPeriod: true,
        payslip: true,
        approvals: { orderBy: { createdAt: "desc" }, include: { admin: true } },
      },
    });

    return NextResponse.json({ timesheet: fresh });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", issues: e.issues }, { status: 400 });
    }
    const err = e as Error & { status?: number };
    return NextResponse.json({ error: err.message }, { status: err.status ?? 500 });
  }
}
