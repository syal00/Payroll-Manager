import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";
import { writeAuditLog } from "@/lib/audit";
import { z } from "zod";

const patchSchema = z
  .object({
    hourlyRate: z.number().positive().max(999_999).optional(),
    overtimeRate: z.number().positive().max(999_999).optional(),
  })
  .refine((d) => d.hourlyRate !== undefined || d.overtimeRate !== undefined, {
    message: "Provide hourlyRate and/or overtimeRate",
  });

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await ctx.params;

    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, name: true, role: true } },
        _count: { select: { timesheets: true, payslips: true } },
      },
    });

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    return NextResponse.json({
      employee: {
        id: employee.id,
        name: employee.name,
        email: employee.email,
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
    const session = await requireAdmin();
    const { id } = await ctx.params;
    const body = patchSchema.parse(await req.json());

    const existing = await prisma.employee.findUnique({
      where: { id },
      select: {
        id: true,
        deletedAt: true,
        name: true,
        email: true,
        employeeCode: true,
        hourlyRate: true,
        overtimeRate: true,
      },
    });
    if (!existing) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }
    if (existing.deletedAt) {
      return NextResponse.json(
        { error: "Cannot edit pay rates for a deactivated employee. Restore the profile first." },
        { status: 400 }
      );
    }

    const employee = await prisma.employee.update({
      where: { id },
      data: {
        ...(body.hourlyRate !== undefined ? { hourlyRate: body.hourlyRate } : {}),
        ...(body.overtimeRate !== undefined ? { overtimeRate: body.overtimeRate } : {}),
      },
    });

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

    return NextResponse.json({
      ok: true,
      employee: {
        id: employee.id,
        hourlyRate: employee.hourlyRate,
        overtimeRate: employee.overtimeRate,
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
    const session = await requireAdmin();
    const { id } = await ctx.params;

    const employee = await prisma.employee.findUnique({
      where: { id },
      select: { id: true, deletedAt: true, name: true, email: true, employeeCode: true },
    });

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }
    if (employee.deletedAt) {
      return NextResponse.json({ error: "Employee is already deactivated." }, { status: 400 });
    }

    const now = new Date();
    await prisma.employee.update({
      where: { id },
      data: { deletedAt: now },
    });

    await writeAuditLog({
      actorId: session.id,
      action: "ARCHIVE_EMPLOYEE",
      entityType: "Employee",
      entityId: id,
      details: {
        employeeCode: employee.employeeCode,
        email: employee.email,
        name: employee.name,
        deletedAt: now.toISOString(),
      },
    });

    return NextResponse.json({ ok: true, deletedAt: now.toISOString() });
  } catch (e) {
    const err = e as Error & { status?: number };
    return NextResponse.json({ error: err.message }, { status: err.status ?? 500 });
  }
}
