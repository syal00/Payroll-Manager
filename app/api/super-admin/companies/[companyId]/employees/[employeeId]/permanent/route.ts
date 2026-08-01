import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdminCompanyDrilldown } from "@/lib/super-admin-drilldown";
import { requireCompanyEmployee } from "@/lib/super-admin-employee";
import { writeAuditLog } from "@/lib/audit";
import {
  getMirroredEmployeeIds,
  permanentlyDeleteEmployeeRecord,
} from "@/lib/employee-deletion";

/** Permanently remove employee, payroll records, and linked portal user. */
export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ companyId: string; employeeId: string }> }
) {
  try {
    const { session, companyId } = await requireSuperAdminCompanyDrilldown(ctx.params);
    const { employeeId } = await ctx.params;
    const employee = await requireCompanyEmployee(session, companyId, employeeId);

    const mirrorIds = employee.mirroredFromEmployeeId ? [] : await getMirroredEmployeeIds(employeeId);
    let userRemoved = false;

    await prisma.$transaction(async (tx) => {
      for (const mirrorId of mirrorIds) {
        await permanentlyDeleteEmployeeRecord(tx, mirrorId);
      }
      const result = await permanentlyDeleteEmployeeRecord(tx, employeeId);
      userRemoved = result.userRemoved;
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
        mirrorsRemoved: mirrorIds.length,
        userRemoved,
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
