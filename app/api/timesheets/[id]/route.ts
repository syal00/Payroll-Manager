import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/api-auth";
import { assertStaffCanAccessEmployee } from "@/lib/manager-scope";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireStaff();
    const { id } = await ctx.params;
    const timesheet = await prisma.timesheet.findUnique({
      where: { id },
      include: {
        entries: { orderBy: { workDate: "asc" } },
        employee: { include: { user: true } },
        payPeriod: true,
        payslip: { include: { items: true } },
        approvals: { orderBy: { createdAt: "desc" }, include: { admin: true } },
      },
    });
    if (!timesheet) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!(await assertStaffCanAccessEmployee(session, timesheet.employeeId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ timesheet });
  } catch (e) {
    const err = e as Error & { status?: number };
    return NextResponse.json({ error: err.message }, { status: err.status ?? 500 });
  }
}
