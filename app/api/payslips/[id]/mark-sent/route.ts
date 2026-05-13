import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/api-auth";
import { assertStaffCanAccessEmployee } from "@/lib/manager-scope";
import { writeAuditLog } from "@/lib/audit";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireStaff();
    const { id } = await ctx.params;
    const existing = await prisma.payslip.findUnique({
      where: { id },
      select: { id: true, employeeId: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (!(await assertStaffCanAccessEmployee(session, existing.employeeId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const payslip = await prisma.payslip.update({
      where: { id },
      data: { markedSentAt: new Date() },
    });
    await writeAuditLog({
      actorId: session.id,
      action: "PAYSLIP_MARKED_SENT",
      entityType: "Payslip",
      entityId: id,
    });
    return NextResponse.json({ payslip });
  } catch {
    return NextResponse.json({ error: "Not found or update failed" }, { status: 400 });
  }
}
