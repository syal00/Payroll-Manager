import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMainAdmin } from "@/lib/api-auth";
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
    const session = await requireMainAdmin();
    const { id } = await ctx.params;
    const body = bodySchema.parse(await req.json());

    const employee = await prisma.employee.findUnique({
      where: { id },
      select: { id: true, isApproved: true, name: true, email: true, employeeCode: true },
    });

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    if (body.action === "approve") {
      await prisma.employee.update({
        where: { id },
        data: { isApproved: true },
      });
      await writeAuditLog({
        actorId: session.id,
        action: "APPROVE_EMPLOYEE",
        entityType: "Employee",
        entityId: id,
        details: { name: employee.name, email: employee.email },
      });
      return NextResponse.json({ ok: true, isApproved: true });
    }

    if (body.action === "reject") {
      if (!employee.isApproved) {
        await prisma.employee.delete({ where: { id } });
        await writeAuditLog({
          actorId: session.id,
          action: "REJECT_EMPLOYEE_REGISTRATION",
          entityType: "Employee",
          entityId: id,
          details: { name: employee.name, email: employee.email },
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
    return NextResponse.json({ error: err.message }, { status: err.status ?? 500 });
  }
}
