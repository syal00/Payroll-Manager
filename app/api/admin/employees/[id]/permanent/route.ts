import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMainAdmin } from "@/lib/api-auth";
import { assertStaffCanAccessEmployee } from "@/lib/manager-scope";
import { writeAuditLog } from "@/lib/audit";

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireMainAdmin();
    const { id } = await ctx.params;

    const employee = await prisma.employee.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        username: true,
        contactEmail: true,
        employeeCode: true,
        userId: true,
        _count: { select: { timesheets: true, payslips: true } },
      },
    });

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }
    if (!(await assertStaffCanAccessEmployee(session, employee.id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.payslip.deleteMany({ where: { employeeId: id } });
      await tx.timesheet.deleteMany({ where: { employeeId: id } });
      await tx.employee.delete({ where: { id } });
      if (employee.userId) {
        await tx.notification.deleteMany({ where: { userId: employee.userId } });
        await tx.user.delete({ where: { id: employee.userId } });
      }
    });

    await writeAuditLog({
      actorId: session.id,
      action: "DELETE_EMPLOYEE_PERMANENT",
      entityType: "Employee",
      entityId: id,
      details: {
        employeeCode: employee.employeeCode,
        username: employee.username,
        contactEmail: employee.contactEmail,
        name: employee.name,
        timesheetsRemoved: employee._count.timesheets,
        payslipsRemoved: employee._count.payslips,
        userRemoved: Boolean(employee.userId),
      },
    });

    return NextResponse.json({ ok: true, removed: true });
  } catch (e) {
    const err = e as Error & { status?: number };
    const message = err.message?.includes("Foreign key constraint")
      ? "Could not delete employee — related records still exist."
      : err.message;
    return NextResponse.json({ error: message }, { status: err.status ?? 500 });
  }
}
