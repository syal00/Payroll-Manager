import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireEmployee } from "@/lib/api-auth";
import { getEmployeeRecord } from "@/lib/employee-scope";
import { TimesheetStatus, PayPeriodStatus } from "@/lib/enums";

export async function GET() {
  try {
    const session = await requireEmployee();
    const emp = await getEmployeeRecord(session.id);
    if (!emp) {
      return NextResponse.json({
        currentPeriod: null,
        counts: { pending: 0, approved: 0, rejected: 0, draft: 0 },
        recentPayslips: [],
      });
    }

    const currentPeriod = await prisma.payPeriod.findFirst({
      where: { isCurrent: true, status: PayPeriodStatus.OPEN },
    });

    const [pending, approved, rejected, draft, recentPayslips, notifications] = await Promise.all([
      prisma.timesheet.count({
        where: { employeeId: emp.id, status: TimesheetStatus.PENDING },
      }),
      prisma.timesheet.count({
        where: { employeeId: emp.id, status: TimesheetStatus.APPROVED },
      }),
      prisma.timesheet.count({
        where: { employeeId: emp.id, status: TimesheetStatus.REJECTED },
      }),
      prisma.timesheet.count({
        where: { employeeId: emp.id, status: TimesheetStatus.DRAFT },
      }),
      prisma.payslip.findMany({
        where: { employeeId: emp.id },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { payPeriod: true },
      }),
      prisma.notification.findMany({
        where: { userId: session.id },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
    ]);

    return NextResponse.json({
      currentPeriod,
      counts: { pending, approved, rejected, draft },
      recentPayslips,
      notifications,
    });
  } catch (e) {
    const err = e as Error & { status?: number };
    return NextResponse.json({ error: err.message }, { status: err.status ?? 500 });
  }
}
