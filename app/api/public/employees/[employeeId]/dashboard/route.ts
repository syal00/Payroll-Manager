import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPublicEmployeeByCode } from "@/lib/public-employee";
import { TimesheetStatus, PayPeriodStatus } from "@/lib/enums";

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

    const currentPeriod = await prisma.payPeriod.findFirst({
      where: { isCurrent: true, status: PayPeriodStatus.OPEN },
    });

    const notificationsPromise =
      emp.userId != null
        ? prisma.notification.findMany({
            where: { userId: emp.userId },
            orderBy: { createdAt: "desc" },
            take: 8,
          })
        : Promise.resolve([]);

    const [pending, approved, rejected, draft, recentTimesheets, recentPayslips, notifications] =
      await Promise.all([
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
        prisma.timesheet.findMany({
          where: { employeeId: emp.id },
          orderBy: { updatedAt: "desc" },
          take: 8,
          include: {
            payPeriod: true,
            payslip: true,
            approvals: { orderBy: { createdAt: "desc" }, take: 1 },
          },
        }),
        prisma.payslip.findMany({
          where: { employeeId: emp.id },
          orderBy: { createdAt: "desc" },
          take: 5,
          include: { payPeriod: true },
        }),
        notificationsPromise,
      ]);

    return NextResponse.json({
      employee: {
        id: emp.id,
        name: emp.name,
        email: emp.email,
        employeeCode: emp.employeeCode,
        hourlyRate: emp.hourlyRate,
        overtimeRate: emp.overtimeRate,
        department: emp.department,
        jobTitle: emp.jobTitle,
      },
      currentPeriod,
      counts: { pending, approved, rejected, draft },
      recentTimesheets,
      recentPayslips,
      notifications,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
