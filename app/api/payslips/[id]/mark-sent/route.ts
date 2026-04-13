import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";
import { writeAuditLog } from "@/lib/audit";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin();
    const { id } = await ctx.params;
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
