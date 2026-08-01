import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMainAdmin } from "@/lib/api-auth";
import { assertStaffCanAccessEmployee } from "@/lib/manager-scope";
import { writeAuditLog } from "@/lib/audit";
import {
  getMirroredEmployeeIds,
  permanentlyDeleteEmployeeRecord,
} from "@/lib/employee-deletion";

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
        mirroredFromEmployeeId: true,
        _count: { select: { timesheets: true, payslips: true } },
      },
    });

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }
    if (!(await assertStaffCanAccessEmployee(session, employee.id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const mirrorIds = employee.mirroredFromEmployeeId ? [] : await getMirroredEmployeeIds(id);
    let userRemoved = false;

    await prisma.$transaction(async (tx) => {
      for (const mirrorId of mirrorIds) {
        await permanentlyDeleteEmployeeRecord(tx, mirrorId);
      }
      const result = await permanentlyDeleteEmployeeRecord(tx, id);
      userRemoved = result.userRemoved;
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
