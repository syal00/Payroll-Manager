import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getPublicEmployeeByCode } from "@/lib/public-employee";
import { ensureEmployeeCompanyId } from "@/lib/employee-company-scope";
import { z } from "zod";

const querySchema = z.object({
  payPeriodId: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(50).default(15),
});

export async function GET(
  req: Request,
  ctx: { params: Promise<{ employeeId: string }> }
) {
  try {
    const { employeeId } = await ctx.params;
    const emp = await getPublicEmployeeByCode(employeeId);
    if (!emp) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    const url = new URL(req.url);
    const q = querySchema.parse(Object.fromEntries(url.searchParams.entries()));
    const skip = (q.page - 1) * q.pageSize;
    const tsWhere = { employeeId: emp.id, ...(q.payPeriodId ? { payPeriodId: q.payPeriodId } : {}) };

    const companyId = await ensureEmployeeCompanyId(emp, (await headers()).get("x-company-id"));

    const [timesheets, payslips, payPeriods] = await Promise.all([
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
      companyId != null
        ? prisma.payPeriod.findMany({
            where: { companyId },
            orderBy: { startDate: "desc" },
            take: 24,
          })
        : Promise.resolve([]),
    ]);

    return NextResponse.json({ timesheets, payslips, payPeriods });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Bad query", issues: e.issues }, { status: 400 });
    }
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
