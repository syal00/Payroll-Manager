import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/api-auth";
import { assertStaffCanAccessEmployee } from "@/lib/manager-scope";
import { getMirroredEmployeeIds } from "@/lib/employee-deletion";
import { writeAuditLog } from "@/lib/audit";
import { payRateSchema } from "@/lib/pay-rates";
import { z } from "zod";

const patchSchema = z
  .object({
    hourlyRate: payRateSchema.optional(),
    overtimeRate: payRateSchema.optional(),
    jobTitle: z.string().trim().max(120).nullable().optional(),
    department: z.string().trim().max(120).nullable().optional(),
  })
  .refine(
    (d) =>
      d.hourlyRate !== undefined ||
      d.overtimeRate !== undefined ||
      d.jobTitle !== undefined ||
      d.department !== undefined,
    { message: "Provide at least one field to update" }
  );

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireStaff();
    const { id } = await ctx.params;

    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, username: true, contactEmail: true, name: true, role: true } },
        _count: { select: { timesheets: true, payslips: true } },
      },
    });

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }
    if (!(await assertStaffCanAccessEmployee(session, employee.id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({
      employee: {
        id: employee.id,
        name: employee.name,
        username: employee.username,
        contactEmail: employee.contactEmail,
        employeeCode: employee.employeeCode,
        deletedAt: employee.deletedAt?.toISOString() ?? null,
        isApproved: employee.isApproved,
        hourlyRate: employee.hourlyRate,
        overtimeRate: employee.overtimeRate,
        department: employee.department,
        jobTitle: employee.jobTitle,
        createdAt: employee.createdAt.toISOString(),
        timesheetCount: employee._count.timesheets,
        payslipCount: employee._count.payslips,
        linkedUser: employee.user,
      },
    });
  } catch (e) {
    const err = e as Error & { status?: number };
    return NextResponse.json({ error: err.message }, { status: err.status ?? 500 });
  }
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireStaff();
    const { id } = await ctx.params;
    const body = patchSchema.parse(await req.json());

    const existing = await prisma.employee.findUnique({
      where: { id },
      select: {
        id: true,
        deletedAt: true,
        name: true,
        contactEmail: true,
        username: true,
        employeeCode: true,
        hourlyRate: true,
        overtimeRate: true,
      },
    });
    if (!existing) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }
    if (!(await assertStaffCanAccessEmployee(session, existing.id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (existing.deletedAt) {
      return NextResponse.json(
        { error: "Cannot edit a deactivated employee. Restore the profile first." },
        { status: 400 }
      );
    }

    const employee = await prisma.employee.update({
      where: { id },
      data: {
        ...(body.hourlyRate !== undefined ? { hourlyRate: body.hourlyRate } : {}),
        ...(body.overtimeRate !== undefined ? { overtimeRate: body.overtimeRate } : {}),
        ...(body.jobTitle !== undefined ? { jobTitle: body.jobTitle || null } : {}),
        ...(body.department !== undefined ? { department: body.department || null } : {}),
      },
    });

    if (body.hourlyRate !== undefined || body.overtimeRate !== undefined) {
      await writeAuditLog({
        actorId: session.id,
        action: "EMPLOYEE_PAY_RATES_UPDATED",
        entityType: "Employee",
        entityId: id,
        details: {
          employeeCode: employee.employeeCode,
          previousHourly: existing.hourlyRate,
          previousOvertime: existing.overtimeRate,
          hourlyRate: employee.hourlyRate,
          overtimeRate: employee.overtimeRate,
        },
      });
    }

    if (body.jobTitle !== undefined || body.department !== undefined) {
      await writeAuditLog({
        actorId: session.id,
        action: "EMPLOYEE_PROFILE_UPDATED",
        entityType: "Employee",
        entityId: id,
        details: {
          employeeCode: employee.employeeCode,
          jobTitle: employee.jobTitle,
          department: employee.department,
        },
      });
    }

    return NextResponse.json({
      ok: true,
      employee: {
        id: employee.id,
        hourlyRate: employee.hourlyRate,
        overtimeRate: employee.overtimeRate,
        jobTitle: employee.jobTitle,
        department: employee.department,
      },
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", issues: e.issues }, { status: 400 });
    }
    const err = e as Error & { status?: number };
    return NextResponse.json({ error: err.message }, { status: err.status ?? 500 });
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireStaff();
    const { id } = await ctx.params;

    const employee = await prisma.employee.findUnique({
      where: { id },
      select: {
        id: true,
        deletedAt: true,
        name: true,
        username: true,
        contactEmail: true,
        employeeCode: true,
        mirroredFromEmployeeId: true,
      },
    });

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }
    if (!(await assertStaffCanAccessEmployee(session, employee.id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (employee.deletedAt) {
      return NextResponse.json({ error: "Employee is already deactivated." }, { status: 400 });
    }

    const now = new Date();
    const archiveIds = [id];
    if (!employee.mirroredFromEmployeeId) {
      archiveIds.push(...(await getMirroredEmployeeIds(id)));
    }

    await prisma.employee.updateMany({
      where: { id: { in: archiveIds }, deletedAt: null },
      data: { deletedAt: now },
    });

    await writeAuditLog({
      actorId: session.id,
      action: "ARCHIVE_EMPLOYEE",
      entityType: "Employee",
      entityId: id,
      details: {
        employeeCode: employee.employeeCode,
        username: employee.username,
        contactEmail: employee.contactEmail,
        name: employee.name,
        deletedAt: now.toISOString(),
        mirroredProfilesArchived: archiveIds.length - 1,
      },
    });

    return NextResponse.json({ ok: true, deletedAt: now.toISOString() });
  } catch (e) {
    const err = e as Error & { status?: number };
    return NextResponse.json({ error: err.message }, { status: err.status ?? 500 });
  }
}
