import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, requireStaff } from "@/lib/api-auth";
import { Role } from "@/lib/enums";
import { getEmployeeRecord } from "@/lib/employee-scope";
import { isStaffRole, isSupervisorRole } from "@/lib/roles";
import { assertStaffCanAccessEmployee } from "@/lib/manager-scope";
import { writeAuditLog } from "@/lib/audit";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession();
    const { id } = await ctx.params;
    const payslip = await prisma.payslip.findUnique({
      where: { id },
      include: {
        items: true,
        payPeriod: true,
        timesheet: { include: { entries: { orderBy: { workDate: "asc" } } } },
        employee: { include: { user: true } },
      },
    });
    if (!payslip) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (session.role === Role.EMPLOYEE) {
      const emp = await getEmployeeRecord(session.id);
      if (!emp || payslip.employeeId !== emp.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else if (isStaffRole(session.role) || isSupervisorRole(session.role)) {
      if (!(await assertStaffCanAccessEmployee(session, payslip.employeeId))) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ payslip });
  } catch (e) {
    const err = e as Error & { status?: number };
    return NextResponse.json({ error: err.message }, { status: err.status ?? 500 });
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireStaff();
    const { id } = await ctx.params;

    const payslip = await prisma.payslip.findUnique({
      where: { id },
      include: {
        employee: { select: { id: true, name: true, employeeCode: true, userId: true } },
        timesheet: { select: { id: true } },
      },
    });

    if (!payslip) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (!(await assertStaffCanAccessEmployee(session, payslip.employeeId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.payslip.delete({ where: { id } });

    if (payslip.employee.userId) {
      await prisma.notification.create({
        data: {
          userId: payslip.employee.userId,
          type: "PAYSLIP_REMOVED",
          title: "Payslip removed",
          body: `Payslip ${payslip.payslipNumber} was removed from your records by an administrator.`,
        },
      });
    }

    await writeAuditLog({
      actorId: session.id,
      action: "DELETE_PAYSLIP",
      entityType: "Payslip",
      entityId: id,
      details: {
        payslipNumber: payslip.payslipNumber,
        employeeId: payslip.employeeId,
        employeeCode: payslip.employee.employeeCode,
        timesheetId: payslip.timesheetId,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    const err = e as Error & { status?: number };
    return NextResponse.json({ error: err.message }, { status: err.status ?? 500 });
  }
}
