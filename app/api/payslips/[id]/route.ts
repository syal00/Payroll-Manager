import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { Role } from "@/lib/enums";
import { getEmployeeRecord } from "@/lib/employee-scope";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession();
    const { id } = await ctx.params;
    const payslip = await prisma.payslip.findUnique({
      where: { id },
      include: {
        items: true,
        payPeriod: true,
        timesheet: { include: { entries: { orderBy: { workDate: "asc" } } } },
        employee: { include: { user: true } },
      },
    });
    if (!payslip) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (session.role === Role.EMPLOYEE) {
      const emp = await getEmployeeRecord(session.id);
      if (!emp || payslip.employeeId !== emp.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    return NextResponse.json({ payslip });
  } catch (e) {
    const err = e as Error & { status?: number };
    return NextResponse.json({ error: err.message }, { status: err.status ?? 500 });
  }
}
