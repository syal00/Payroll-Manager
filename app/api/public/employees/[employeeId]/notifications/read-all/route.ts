import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPublicEmployeeByCode } from "@/lib/public-employee";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ employeeId: string }> }
) {
  try {
    const { employeeId } = await ctx.params;
    const emp = await getPublicEmployeeByCode(employeeId);
    if (!emp) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }
    if (emp.userId) {
      await prisma.notification.updateMany({
        where: { userId: emp.userId, readAt: null },
        data: { readAt: new Date() },
      });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
