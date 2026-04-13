import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPublicEmployeeByCode } from "@/lib/public-employee";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ employeeId: string; payslipId: string }> }
) {
  try {
    const { employeeId, payslipId } = await ctx.params;
    const emp = await getPublicEmployeeByCode(employeeId);
    if (!emp) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }
    const payslip = await prisma.payslip.findFirst({
      where: { id: payslipId, employeeId: emp.id },
      include: {
        items: true,
        payPeriod: true,
        timesheet: { include: { entries: { orderBy: { workDate: "asc" } } } },
        employee: { include: { user: true } },
      },
    });
    if (!payslip) {
      return NextResponse.json({ error: "Payslip not found" }, { status: 404 });
    }
    return NextResponse.json({ payslip });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
