import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireEmployee } from "@/lib/api-auth";
import { getEmployeeRecord } from "@/lib/employee-scope";
import { z } from "zod";

const querySchema = z.object({
  payPeriodId: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(50).default(15),
});

export async function GET(req: Request) {
  try {
    const session = await requireEmployee();
    const emp = await getEmployeeRecord(session.id);
    if (!emp) return NextResponse.json({ timesheets: [], payslips: [] });

    const url = new URL(req.url);
    const q = querySchema.parse(Object.fromEntries(url.searchParams.entries()));
    const skip = (q.page - 1) * q.pageSize;

    const tsWhere = { employeeId: emp.id, ...(q.payPeriodId ? { payPeriodId: q.payPeriodId } : {}) };

    const [timesheets, payslips, periods] = await Promise.all([
      prisma.timesheet.findMany({
        where: tsWhere,
        orderBy: { updatedAt: "desc" },
        skip,
        take: q.pageSize,
        include: {
          payPeriod: true,
          payslip: true,
          approvals: { orderBy: { createdAt: "desc" }, include: { admin: true } },
        },
      }),
      prisma.payslip.findMany({
        where: { employeeId: emp.id, ...(q.payPeriodId ? { payPeriodId: q.payPeriodId } : {}) },
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { payPeriod: true },
      }),
      prisma.payPeriod.findMany({ orderBy: { startDate: "desc" }, take: 24 }),
    ]);

    return NextResponse.json({ timesheets, payslips, payPeriods: periods });
  } catch (e) {
    const err = e as Error & { status?: number };
    return NextResponse.json({ error: err.message }, { status: err.status ?? 500 });
  }
}
