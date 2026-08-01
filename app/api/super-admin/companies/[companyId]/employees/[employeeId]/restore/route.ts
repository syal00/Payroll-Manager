import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdminCompanyDrilldown } from "@/lib/super-admin-drilldown";
import { requireCompanyEmployee } from "@/lib/super-admin-employee";
import { writeAuditLog } from "@/lib/audit";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ companyId: string; employeeId: string }> }
) {
  try {
    const { session, companyId } = await requireSuperAdminCompanyDrilldown(ctx.params);
    const { employeeId } = await ctx.params;
    const employee = await requireCompanyEmployee(session, companyId, employeeId);

    if (!employee.deletedAt) {
      return NextResponse.json({ error: "Employee is already active." }, { status: 400 });
    }

    await prisma.employee.update({
      where: { id: employeeId },
      data: { deletedAt: null },
    });

    await writeAuditLog({
      actorId: session.id,
      action: "SUPER_ADMIN_RESTORE_EMPLOYEE",
      entityType: "Employee",
      entityId: employeeId,
      details: {
        companyId,
        employeeCode: employee.employeeCode,
        username: employee.username,
        contactEmail: employee.contactEmail,
        name: employee.name,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    const err = e as Error & { status?: number };
    return NextResponse.json({ error: err.message }, { status: err.status ?? 500 });
  }
}
