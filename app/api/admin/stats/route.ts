import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/api-auth";
import { PayPeriodStatus, TimesheetStatus } from "@/lib/enums";
import { isMainAdminRole } from "@/lib/roles";
import { employeeWhereForStaff, payslipWhereForStaff, timesheetWhereForStaff } from "@/lib/manager-scope";
import type { Prisma } from "@prisma/client";

export async function GET() {
  try {
    const session = await requireStaff();
    const isMainAdmin = isMainAdminRole(session.role);
    const empExtra = employeeWhereForStaff(session);
    const tsExtra: Prisma.TimesheetWhereInput = timesheetWhereForStaff(session);
    const payslipExtra: Prisma.PayslipWhereInput = payslipWhereForStaff(session);

    const employeeBase: Prisma.EmployeeWhereInput = {
      deletedAt: null,
      isApproved: true,
      ...(empExtra ?? {}),
    };

    const pendingEmployeeWhere: Prisma.EmployeeWhereInput = {
      deletedAt: null,
      isApproved: false,
      ...(empExtra ?? {}),
    };

    const tsMerge = (w: Prisma.TimesheetWhereInput): Prisma.TimesheetWhereInput => ({ ...tsExtra, ...w });

    const [
      totalEmployees,
      openPayPeriods,
      pendingSubmissions,
      approvedSubmissions,
      generatedPayslips,
      underReviewSubmissions,
      pendingEmployeeApprovals,
      currentPayPeriod,
    ] = await Promise.all([
      prisma.employee.count({ where: employeeBase }),
      prisma.payPeriod.count({ where: { status: PayPeriodStatus.OPEN } }),
      prisma.timesheet.count({ where: tsMerge({ status: TimesheetStatus.PENDING }) }),
      prisma.timesheet.count({ where: tsMerge({ status: TimesheetStatus.APPROVED }) }),
      prisma.payslip.count({ where: payslipExtra }),
      prisma.timesheet.count({ where: tsMerge({ status: TimesheetStatus.UNDER_REVIEW }) }),
      prisma.employee.count({ where: pendingEmployeeWhere }),
      prisma.payPeriod.findFirst({
        where: { isCurrent: true },
        include: {
          _count: { select: { timesheets: true, payslips: true } },
        },
      }),
    ]);

    const timesheetsAwaitingAction = await prisma.timesheet.findMany({
      where: tsMerge({
        status: { in: [TimesheetStatus.PENDING, TimesheetStatus.UNDER_REVIEW] },
      }),
      orderBy: { submittedAt: "desc" },
      take: 6,
      include: { employee: { include: { user: true } }, payPeriod: true },
    });

    const recentSubmissions = await prisma.timesheet.findMany({
      where: tsMerge({
        status: {
          in: [TimesheetStatus.PENDING, TimesheetStatus.UNDER_REVIEW, TimesheetStatus.APPROVED],
        },
      }),
      orderBy: { submittedAt: "desc" },
      take: 8,
      include: { employee: { include: { user: true } }, payPeriod: true },
    });

    const recentApprovals = await prisma.approval.findMany({
      where: { timesheet: tsExtra },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        admin: true,
        timesheet: {
          include: { employee: { include: { user: true } }, payPeriod: true },
        },
      },
    });

    const recentPayslips = await prisma.payslip.findMany({
      where: payslipExtra,
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { employee: { include: { user: true } }, payPeriod: true },
    });

    const payslipsForSummary = await prisma.payslip.findMany({
      where: payslipExtra,
      include: { payPeriod: true },
      orderBy: { createdAt: "asc" },
      take: 120,
    });

    const payrollByPeriod = new Map<
      string,
      { label: string; gross: number; deductions: number; net: number; sortKey: number }
    >();

    for (const slip of payslipsForSummary) {
      const period = slip.payPeriod;
      const label =
        period.name ??
        `${period.startDate.toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${period.endDate.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
      const existing = payrollByPeriod.get(slip.payPeriodId);
      if (existing) {
        existing.gross += slip.grossPay;
        existing.deductions += slip.totalDeductions;
        existing.net += slip.netPay;
      } else {
        payrollByPeriod.set(slip.payPeriodId, {
          label,
          gross: slip.grossPay,
          deductions: slip.totalDeductions,
          net: slip.netPay,
          sortKey: period.startDate.getTime(),
        });
      }
    }

    const payrollSummary = [...payrollByPeriod.values()]
      .sort((a, b) => a.sortKey - b.sortKey)
      .slice(-8)
      .map(({ label, gross, deductions, net }) => ({ label, gross, deductions, net }));

    let recentDemoRequests: { id: string; name: string; email: string; company: string | null; createdAt: Date }[] =
      [];
    let demoRequestCount = 0;
    let recentAuditLogs: {
      id: string;
      action: string;
      entityType: string;
      createdAt: Date;
      actor: { name: string } | null;
    }[] = [];

    if (isMainAdmin) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const [demoCount, demoItems, auditItems] = await Promise.all([
        prisma.demoRequest.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
        prisma.demoRequest.findMany({ orderBy: { createdAt: "desc" }, take: 4 }),
        prisma.auditLog.findMany({
          orderBy: { createdAt: "desc" },
          take: 6,
          include: { actor: { select: { name: true } } },
        }),
      ]);

      demoRequestCount = demoCount;
      recentDemoRequests = demoItems;
      recentAuditLogs = auditItems;
    }

    let currentPeriodPending = 0;
    let currentPeriodApproved = 0;
    if (currentPayPeriod) {
      const periodTsWhere = tsMerge({ payPeriodId: currentPayPeriod.id });
      [currentPeriodPending, currentPeriodApproved] = await Promise.all([
        prisma.timesheet.count({
          where: { ...periodTsWhere, status: { in: [TimesheetStatus.PENDING, TimesheetStatus.UNDER_REVIEW] } },
        }),
        prisma.timesheet.count({
          where: { ...periodTsWhere, status: TimesheetStatus.APPROVED },
        }),
      ]);
    }

    return NextResponse.json({
      isMainAdmin,
      totalEmployees,
      openPayPeriods,
      pendingSubmissions,
      approvedSubmissions,
      generatedPayslips,
      underReviewSubmissions,
      pendingEmployeeApprovals,
      currentPayPeriod: currentPayPeriod
        ? {
            id: currentPayPeriod.id,
            name: currentPayPeriod.name,
            startDate: currentPayPeriod.startDate,
            endDate: currentPayPeriod.endDate,
            status: currentPayPeriod.status,
            timesheetCount: currentPayPeriod._count.timesheets,
            payslipCount: currentPayPeriod._count.payslips,
            pendingCount: currentPeriodPending,
            approvedCount: currentPeriodApproved,
          }
        : null,
      timesheetsAwaitingAction,
      recentSubmissions,
      recentApprovals,
      recentPayslips,
      payrollSummary,
      demoRequestCount,
      recentDemoRequests,
      recentAuditLogs,
    });
  } catch (e) {
    const err = e as Error & { status?: number };
    return NextResponse.json({ error: err.message }, { status: err.status ?? 500 });
  }
}
