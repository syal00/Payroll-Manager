import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";
import { writeAuditLog } from "@/lib/audit";

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
