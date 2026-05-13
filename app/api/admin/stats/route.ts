import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/api-auth";
import { PayPeriodStatus, TimesheetStatus } from "@/lib/enums";
import { employeeWhereForStaff, payslipWhereForStaff, timesheetWhereForStaff } from "@/lib/manager-scope";
import type { Prisma } from "@prisma/client";

export async function GET() {
  try {
    const session = await requireStaff();
    const empExtra = employeeWhereForStaff(session);
    const tsExtra: Prisma.TimesheetWhereInput = timesheetWhereForStaff(session);
    const payslipExtra: Prisma.PayslipWhereInput = payslipWhereForStaff(session);

    const employeeBase: Prisma.EmployeeWhereInput = {
      deletedAt: null,
      isApproved: true,
      ...(empExtra ?? {}),
    };

    const tsMerge = (w: Prisma.TimesheetWhereInput): Prisma.TimesheetWhereInput => ({ ...tsExtra, ...w });

    const [
      totalEmployees,
      openPayPeriods,
      pendingSubmissions,
      approvedSubmissions,
      generatedPayslips,
    ] = await Promise.all([
      prisma.employee.count({ where: employeeBase }),
      prisma.payPeriod.count({ where: { status: PayPeriodStatus.OPEN } }),
      prisma.timesheet.count({ where: tsMerge({ status: TimesheetStatus.PENDING }) }),
      prisma.timesheet.count({ where: tsMerge({ status: TimesheetStatus.APPROVED }) }),
      prisma.payslip.count({ where: payslipExtra }),
    ]);

    const recentSubmissions = await prisma.timesheet.findMany({
      where: tsMerge({
        status: { in: [TimesheetStatus.PENDING, TimesheetStatus.UNDER_REVIEW] },
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

    return NextResponse.json({
      totalEmployees,
      openPayPeriods,
      pendingSubmissions,
      approvedSubmissions,
      generatedPayslips,
      recentSubmissions,
      recentApprovals,
      recentPayslips,
    });
  } catch (e) {
    const err = e as Error & { status?: number };
    return NextResponse.json({ error: err.message }, { status: err.status ?? 500 });
  }
}
