import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";
import { PayPeriodStatus, TimesheetStatus } from "@/lib/enums";

export async function GET() {
  try {
    await requireAdmin();
    const [
      totalEmployees,
      openPayPeriods,
      pendingSubmissions,
      approvedSubmissions,
      generatedPayslips,
    ] = await Promise.all([
      prisma.employee.count({ where: { deletedAt: null, isApproved: true } }),
      prisma.payPeriod.count({ where: { status: PayPeriodStatus.OPEN } }),
      prisma.timesheet.count({ where: { status: TimesheetStatus.PENDING } }),
      prisma.timesheet.count({ where: { status: TimesheetStatus.APPROVED } }),
      prisma.payslip.count(),
    ]);

    const recentSubmissions = await prisma.timesheet.findMany({
      where: { status: { in: [TimesheetStatus.PENDING, TimesheetStatus.VERIFIED] } },
      orderBy: { submittedAt: "desc" },
      take: 8,
      include: { employee: { include: { user: true } }, payPeriod: true },
    });

    const recentApprovals = await prisma.approval.findMany({
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
