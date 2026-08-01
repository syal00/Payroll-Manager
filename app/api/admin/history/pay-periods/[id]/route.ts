import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/api-auth";
import { auditLogWhereForCompany } from "@/lib/audit-log-scope";
import { requireStaffCompanyId } from "@/lib/pay-period-company";
import { payslipWhereForStaff, timesheetWhereForStaff } from "@/lib/manager-scope";
import type { Prisma } from "@prisma/client";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireStaff();
    const companyId = requireStaffCompanyId(session);
    const { id } = await ctx.params;

    const period = await prisma.payPeriod.findFirst({
      where: { id, companyId },
      select: {
        id: true,
        name: true,
        startDate: true,
        endDate: true,
        status: true,
        isCurrent: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!period) {
      return NextResponse.json({ error: "Pay period not found" }, { status: 404 });
    }

    const tsScope = timesheetWhereForStaff(session);
    const psScope = payslipWhereForStaff(session);

    const tsWhere: Prisma.TimesheetWhereInput = {
      payPeriodId: id,
      ...(Object.keys(tsScope).length > 0 ? tsScope : {}),
    };
    const psWhere: Prisma.PayslipWhereInput = {
      payPeriodId: id,
      ...(Object.keys(psScope).length > 0 ? psScope : {}),
    };

    const [timesheets, payslips, tsAgg, psAgg] = await Promise.all([
      prisma.timesheet.findMany({
        where: tsWhere,
        orderBy: [{ status: "asc" }, { submittedAt: "desc" }],
        select: {
          id: true,
          status: true,
          totalRegular: true,
          totalOvertime: true,
          totalLeave: true,
          totalHours: true,
          submittedAt: true,
          updatedAt: true,
          employee: {
            select: { id: true, name: true, employeeCode: true },
          },
          payslip: {
            select: { id: true, payslipNumber: true, netPay: true },
          },
        },
      }),
      prisma.payslip.findMany({
        where: psWhere,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          payslipNumber: true,
          grossPay: true,
          netPay: true,
          totalDeductions: true,
          regularHours: true,
          overtimeHours: true,
          markedSentAt: true,
          emailSentAt: true,
          createdAt: true,
          employee: {
            select: { id: true, name: true, employeeCode: true },
          },
        },
      }),
      prisma.timesheet.aggregate({
        where: tsWhere,
        _count: { _all: true },
        _sum: { totalHours: true, totalRegular: true, totalOvertime: true },
      }),
      prisma.payslip.aggregate({
        where: psWhere,
        _count: { _all: true },
        _sum: { grossPay: true, netPay: true, totalDeductions: true },
      }),
    ]);

    const tsIds = timesheets.map((t) => t.id);
    const psIds = payslips.map((p) => p.id);
    const auditClauses: Prisma.AuditLogWhereInput[] = [
      { entityType: "PayPeriod", entityId: id },
    ];
    if (tsIds.length > 0) auditClauses.push({ entityType: "Timesheet", entityId: { in: tsIds } });
    if (psIds.length > 0) auditClauses.push({ entityType: "Payslip", entityId: { in: psIds } });

    const auditScope = await auditLogWhereForCompany(companyId);
    const auditLogs = await prisma.auditLog.findMany({
      where: { AND: [auditScope, { OR: auditClauses }] },
      orderBy: { createdAt: "desc" },
      take: 40,
      select: {
        id: true,
        action: true,
        entityType: true,
        entityId: true,
        details: true,
        createdAt: true,
        actor: { select: { name: true, contactEmail: true } },
      },
    });

    const timesheetsByStatus: Record<string, number> = {};
    for (const t of timesheets) {
      timesheetsByStatus[t.status] = (timesheetsByStatus[t.status] ?? 0) + 1;
    }

    return NextResponse.json({
      period: {
        ...period,
        startDate: period.startDate.toISOString(),
        endDate: period.endDate.toISOString(),
        createdAt: period.createdAt.toISOString(),
        updatedAt: period.updatedAt.toISOString(),
      },
      summary: {
        timesheetCount: tsAgg._count._all,
        payslipCount: psAgg._count._all,
        totalHours: tsAgg._sum.totalHours ?? 0,
        totalRegularHours: tsAgg._sum.totalRegular ?? 0,
        totalOvertimeHours: tsAgg._sum.totalOvertime ?? 0,
        totalGross: psAgg._sum.grossPay ?? 0,
        totalNet: psAgg._sum.netPay ?? 0,
        totalDeductions: psAgg._sum.totalDeductions ?? 0,
        timesheetsByStatus,
      },
      timesheets: timesheets.map((t) => ({
        ...t,
        submittedAt: t.submittedAt?.toISOString() ?? null,
        updatedAt: t.updatedAt.toISOString(),
      })),
      payslips: payslips.map((p) => ({
        ...p,
        markedSentAt: p.markedSentAt?.toISOString() ?? null,
        emailSentAt: p.emailSentAt?.toISOString() ?? null,
        createdAt: p.createdAt.toISOString(),
      })),
      auditLogs: auditLogs.map((l) => ({
        ...l,
        createdAt: l.createdAt.toISOString(),
      })),
    });
  } catch (e) {
    const err = e as Error & { status?: number };
    return NextResponse.json({ error: err.message }, { status: err.status ?? 500 });
  }
}
