import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getPublicEmployeeByCode } from "@/lib/public-employee";
import { ensureEmployeeCompanyId } from "@/lib/employee-company-scope";
import { PayPeriodStatus } from "@/lib/enums";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ employeeId: string }> }
) {
  try {
    const { employeeId } = await ctx.params;
    const emp = await getPublicEmployeeByCode(employeeId);
    if (!emp) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    const companyId = await ensureEmployeeCompanyId(emp, (await headers()).get("x-company-id"));
    if (!companyId) {
      return NextResponse.json({ current: null, openPayPeriods: [], payPeriods: [] });
    }

    const [current, openPayPeriods, payPeriods, timesheets] = await Promise.all([
      prisma.payPeriod.findFirst({
        where: {
          companyId,
          isCurrent: true,
          status: PayPeriodStatus.OPEN,
        },
        orderBy: { startDate: "desc" },
      }),
      prisma.payPeriod.findMany({
        where: { companyId, status: PayPeriodStatus.OPEN },
        orderBy: { startDate: "desc" },
      }),
      prisma.payPeriod.findMany({
        where: { companyId },
        orderBy: { startDate: "desc" },
        take: 24,
      }),
      prisma.timesheet.findMany({
        where: { employeeId: emp.id },
        select: {
          payPeriodId: true,
          status: true,
          totalHours: true,
          totalRegular: true,
          totalOvertime: true,
          totalLeave: true,
          submittedAt: true,
          updatedAt: true,
        },
      }),
    ]);

    const timesheetByPeriod = Object.fromEntries(timesheets.map((t) => [t.payPeriodId, t]));

    return NextResponse.json({ current, openPayPeriods, payPeriods, timesheetByPeriod });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
