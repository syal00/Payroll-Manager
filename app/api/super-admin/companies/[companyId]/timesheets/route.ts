// companyId MUST come from params, not session — this route is shared across all tenants.
// See lib/manager-scope.ts scopeForCompanyDrilldown for why session.companyId (null for
// SUPER_ADMIN) can never be used here.
//
// Mirrors app/api/timesheets/route.ts's staff listing. GET only — no admin-side POST-create
// endpoint exists to mirror (timesheets are created by employee submission).
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { timesheetWhereForCompanyDrilldown } from "@/lib/manager-scope";
import { requireSuperAdminCompanyDrilldown } from "@/lib/super-admin-drilldown";
import { z } from "zod";
import type { Prisma } from "@prisma/client";

const querySchema = z.object({
  payPeriodId: z.string().optional(),
  q: z.string().optional(),
  status: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
  sort: z.enum(["submittedAt", "updatedAt", "status"]).default("submittedAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

export async function GET(req: Request, ctx: { params: Promise<{ companyId: string }> }) {
  try {
    const { session, companyId } = await requireSuperAdminCompanyDrilldown(ctx.params);
    const url = new URL(req.url);
    const q = querySchema.parse(Object.fromEntries(url.searchParams.entries()));

    const parts: Prisma.TimesheetWhereInput[] = [await timesheetWhereForCompanyDrilldown(session, companyId)];
    if (q.payPeriodId) parts.push({ payPeriodId: q.payPeriodId });
    if (q.status) parts.push({ status: q.status });
    if (q.q?.trim()) {
      const term = q.q.trim();
      parts.push({
        employee: {
          OR: [
            { name: { contains: term } },
            { username: { contains: term } },
            { contactEmail: { contains: term } },
            { employeeCode: { contains: term } },
            { user: { name: { contains: term } } },
          ],
        },
      });
    }
    const where: Prisma.TimesheetWhereInput = parts.length === 1 ? parts[0]! : { AND: parts };
    const skip = (q.page - 1) * q.pageSize;
    const [items, total] = await Promise.all([
      prisma.timesheet.findMany({
        where,
        orderBy: { [q.sort]: q.order },
        skip,
        take: q.pageSize,
        include: {
          employee: { include: { user: true } },
          payPeriod: true,
          entries: true,
          payslip: true,
          approvals: { orderBy: { createdAt: "desc" }, take: 3, include: { admin: true } },
        },
      }),
      prisma.timesheet.count({ where }),
    ]);
    return NextResponse.json({
      items,
      total,
      page: q.page,
      pageSize: q.pageSize,
      totalPages: Math.ceil(total / q.pageSize),
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid query", issues: e.issues }, { status: 400 });
    }
    const err = e as Error & { status?: number };
    return NextResponse.json({ error: err.message }, { status: err.status ?? 500 });
  }
}
