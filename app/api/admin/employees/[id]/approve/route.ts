import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/api-auth";
import { assertStaffCanAccessEmployee } from "@/lib/manager-scope";
import {
  deleteMirroredEmployeesForSource,
  mirrorEmployeeToTargetCompany,
  syncMirroredEmployeeApproval,
} from "@/lib/company-mirror";
import { permanentlyDeleteEmployeeRecord } from "@/lib/employee-deletion";
import { writeAuditLog } from "@/lib/audit";
import { z } from "zod";

const bodySchema = z.object({
  action: z.enum(["approve", "reject"]),
});

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireStaff();
    const { id } = await ctx.params;
    const body = bodySchema.parse(await req.json());

    const canAccess = await assertStaffCanAccessEmployee(session, id);
    if (!canAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const employee = await prisma.employee.findUnique({
      where: { id },
      select: { id: true, isApproved: true, name: true, username: true, contactEmail: true, employeeCode: true, userId: true },
    });

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    if (body.action === "approve") {
      await prisma.employee.update({
        where: { id },
        data: { isApproved: true },
      });
      await mirrorEmployeeToTargetCompany(id);
      await syncMirroredEmployeeApproval(id, true);
      await writeAuditLog({
        actorId: session.id,
        action: "APPROVE_EMPLOYEE",
        entityType: "Employee",
        entityId: id,
        details: { name: employee.name, username: employee.username, contactEmail: employee.contactEmail },
      });
      return NextResponse.json({ ok: true, isApproved: true });
    }

    if (body.action === "reject") {
      if (!employee.isApproved) {
        await deleteMirroredEmployeesForSource(id);
        await prisma.$transaction(async (tx) => {
          await permanentlyDeleteEmployeeRecord(tx, id);
        });
        await writeAuditLog({
          actorId: session.id,
          action: "REJECT_EMPLOYEE_REGISTRATION",
          entityType: "Employee",
          entityId: id,
          details: { name: employee.name, username: employee.username, contactEmail: employee.contactEmail },
        });
        return NextResponse.json({ ok: true, removed: true });
      }
      return NextResponse.json(
        { error: "Only pending registrations can be rejected this way." },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", issues: e.issues }, { status: 400 });
    }
    const err = e as Error & { status?: number };
    console.error("[approve employee]", e);
    return NextResponse.json(
      { error: err.status ? err.message : "Could not complete this action. Restart the dev server and try again." },
      { status: err.status ?? 500 }
    );
  }
}
