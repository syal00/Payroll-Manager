import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/api-auth";
import { requireStaffCompanyId } from "@/lib/pay-period-company";
import { payslipWhereForStaff } from "@/lib/manager-scope";
import { formatPayPeriodLabel } from "@/lib/format";
import type { Prisma } from "@prisma/client";
import { z } from "zod";

const querySchema = z.object({
  payPeriodId: z.string().trim().min(1),
});

export async function GET(req: Request) {
  try {
    const session = await requireStaff();
    const companyId = requireStaffCompanyId(session);
    const url = new URL(req.url);
    const { payPeriodId } = querySchema.parse(Object.fromEntries(url.searchParams.entries()));

    const period = await prisma.payPeriod.findFirst({
      where: { id: payPeriodId, companyId },
      select: {
        id: true,
        name: true,
        startDate: true,
        endDate: true,
        status: true,
        isCurrent: true,
      },
    });
    if (!period) {
      return NextResponse.json({ error: "Pay period not found" }, { status: 404 });
    }

    const psScope = await payslipWhereForStaff(session);
    const psWhere: Prisma.PayslipWhereInput = {
      payPeriodId,
      ...(Object.keys(psScope).length > 0 ? psScope : {}),
    };

    const [payslips, totals] = await Promise.all([
      prisma.payslip.findMany({
        where: psWhere,
        orderBy: { employee: { name: "asc" } },
        select: {
          id: true,
          payslipNumber: true,
          grossPay: true,
          netPay: true,
          totalDeductions: true,
          regularHours: true,
          overtimeHours: true,
          employee: {
            select: { id: true, name: true, employeeCode: true },
          },
        },
      }),
      prisma.payslip.aggregate({
        where: psWhere,
        _count: { _all: true },
        _sum: { grossPay: true, netPay: true, totalDeductions: true },
      }),
    ]);

    return NextResponse.json({
      period: {
        id: period.id,
        name: period.name,
        startDate: period.startDate.toISOString(),
        endDate: period.endDate.toISOString(),
        status: period.status,
        isCurrent: period.isCurrent,
        label: formatPayPeriodLabel(period),
      },
      totals: {
        payslipCount: totals._count._all,
        gross: totals._sum.grossPay ?? 0,
        net: totals._sum.netPay ?? 0,
        deductions: totals._sum.totalDeductions ?? 0,
      },
      payouts: payslips.map((p) => ({
        payslipId: p.id,
        payslipNumber: p.payslipNumber,
        grossPay: p.grossPay,
        netPay: p.netPay,
        totalDeductions: p.totalDeductions,
        regularHours: p.regularHours,
        overtimeHours: p.overtimeHours,
        employee: p.employee,
      })),
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid query", issues: e.issues }, { status: 400 });
    }
    const err = e as Error & { status?: number };
    return NextResponse.json({ error: err.message }, { status: err.status ?? 500 });
  }
}
