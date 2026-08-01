import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdminCompanyDrilldown } from "@/lib/super-admin-drilldown";
import { requireCompanyEmployee } from "@/lib/super-admin-employee";
import { writeAuditLog } from "@/lib/audit";

/** Permanently remove employee, payroll records, and linked portal user. */
export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ companyId: string; employeeId: string }> }
) {
  try {
    const { session, companyId } = await requireSuperAdminCompanyDrilldown(ctx.params);
    const { employeeId } = await ctx.params;
    const employee = await requireCompanyEmployee(session, companyId, employeeId);

    await prisma.$transaction(async (tx) => {
      await tx.payslip.deleteMany({ where: { employeeId } });
      await tx.timesheet.deleteMany({ where: { employeeId } });
      await tx.employee.delete({ where: { id: employeeId } });
      if (employee.userId) {
        await tx.notification.deleteMany({ where: { userId: employee.userId } });
        await tx.user.delete({ where: { id: employee.userId } });
      }
    });

    await writeAuditLog({
      actorId: session.id,
      action: "SUPER_ADMIN_DELETE_EMPLOYEE_PERMANENT",
      entityType: "Employee",
      entityId: employeeId,
      details: {
        companyId,
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
