import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/api-auth";
import { requireStaffCompanyId } from "@/lib/pay-period-company";
import { payslipWhereForStaff, timesheetWhereForStaff } from "@/lib/manager-scope";
import type { Prisma } from "@prisma/client";

export async function GET() {
  try {
    const session = await requireStaff();
    const companyId = requireStaffCompanyId(session);
    const tsScope = await timesheetWhereForStaff(session);
    const psScope = await payslipWhereForStaff(session);

    const periods = await prisma.payPeriod.findMany({
      where: { companyId },
      orderBy: { startDate: "desc" },
      select: {
        id: true,
        name: true,
        startDate: true,
        endDate: true,
        status: true,
        isCurrent: true,
      },
    });

    const tsBase: Prisma.TimesheetWhereInput =
      Object.keys(tsScope).length > 0 ? { AND: [tsScope, { payPeriod: { companyId } }] } : { payPeriod: { companyId } };

    const psBase: Prisma.PayslipWhereInput =
      Object.keys(psScope).length > 0 ? { AND: [psScope, { payPeriod: { companyId } }] } : { payPeriod: { companyId } };

    const [tsByPeriod, tsByStatus, psAgg] = await Promise.all([
      prisma.timesheet.groupBy({
        by: ["payPeriodId"],
        where: tsBase,
        _count: { _all: true },
      }),
      prisma.timesheet.groupBy({
        by: ["payPeriodId", "status"],
        where: tsBase,
        _count: { _all: true },
      }),
      prisma.payslip.groupBy({
        by: ["payPeriodId"],
        where: psBase,
        _count: { _all: true },
        _sum: { grossPay: true, netPay: true },
      }),
    ]);

    const tsCountMap = new Map(tsByPeriod.map((r) => [r.payPeriodId, r._count._all]));
    const statusMap = new Map<string, Record<string, number>>();
    for (const row of tsByStatus) {
      const bucket = statusMap.get(row.payPeriodId) ?? {};
      bucket[row.status] = row._count._all;
      statusMap.set(row.payPeriodId, bucket);
    }
    const psMap = new Map(
      psAgg.map((r) => [
        r.payPeriodId,
        {
          count: r._count._all,
          totalGross: r._sum.grossPay ?? 0,
          totalNet: r._sum.netPay ?? 0,
        },
      ])
    );

    return NextResponse.json({
      periods: periods.map((p) => {
        const ps = psMap.get(p.id);
        return {
          ...p,
          startDate: p.startDate.toISOString(),
          endDate: p.endDate.toISOString(),
          timesheetCount: tsCountMap.get(p.id) ?? 0,
          payslipCount: ps?.count ?? 0,
          totalGross: ps?.totalGross ?? 0,
          totalNet: ps?.totalNet ?? 0,
          timesheetsByStatus: statusMap.get(p.id) ?? {},
        };
      }),
    });
  } catch (e) {
    const err = e as Error & { status?: number };
    return NextResponse.json({ error: err.message }, { status: err.status ?? 500 });
  }
}
