import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/api-auth";
import { getDatabaseSizeMB, getUsageRequestCounts } from "@/lib/usage-tracker";

export async function GET() {
  try {
    await requireSuperAdmin();

    const [companies, totalEmployees, totalTimesheets, totalPayslips, dbSizeMB, requestCounts] =
      await Promise.all([
        prisma.company.count(),
        prisma.employee.count({ where: { deletedAt: null } }),
        prisma.timesheet.count(),
        prisma.payslip.count(),
        getDatabaseSizeMB(),
        getUsageRequestCounts(),
      ]);

    return NextResponse.json({
      companies,
      totalEmployees,
      totalTimesheets,
      totalPayslips,
      dbSizeMB,
      requestsLast30Days: requestCounts.requestsLast30Days,
      requestsToday: requestCounts.requestsToday,
    });
  } catch (e) {
    const err = e as Error & { status?: number };
    return NextResponse.json({ error: err.message }, { status: err.status ?? 500 });
  }
}
