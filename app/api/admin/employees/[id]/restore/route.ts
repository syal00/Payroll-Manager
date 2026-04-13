import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";
import { writeAuditLog } from "@/lib/audit";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
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
    if (!employee.deletedAt) {
      return NextResponse.json({ error: "Employee is already active." }, { status: 400 });
    }

    await prisma.employee.update({
      where: { id },
      data: { deletedAt: null },
    });

    await writeAuditLog({
      actorId: session.id,
      action: "EMPLOYEE_RESTORED",
      entityType: "Employee",
      entityId: id,
      details: {
        employeeCode: employee.employeeCode,
        email: employee.email,
        name: employee.name,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    const err = e as Error & { status?: number };
    return NextResponse.json({ error: err.message }, { status: err.status ?? 500 });
  }
}
