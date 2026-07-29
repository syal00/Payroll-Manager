// companyId MUST come from params, not session — this route is shared across all tenants.
// See lib/manager-scope.ts scopeForCompanyDrilldown for why session.companyId (null for
// SUPER_ADMIN) can never be used here.
//
// Mirrors the staff branch of app/api/payslips/route.ts. GET only — payslip generation is a
// timesheet-specific action (app/api/admin/timesheets/[id]/payslip), not a collection POST, so no
// POST is mirrored here.
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { payslipWhereForCompanyDrilldown } from "@/lib/manager-scope";
import { requireSuperAdminCompanyDrilldown } from "@/lib/super-admin-drilldown";
import { z } from "zod";
import type { Prisma } from "@prisma/client";

const querySchema = z.object({
  q: z.string().optional(),
  payPeriodId: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
});

export async function GET(req: Request, ctx: { params: Promise<{ companyId: string }> }) {
  try {
    const { session, companyId } = await requireSuperAdminCompanyDrilldown(ctx.params);
    const url = new URL(req.url);
    const q = querySchema.parse(Object.fromEntries(url.searchParams.entries()));
    const skip = (q.page - 1) * q.pageSize;

    const parts: Prisma.PayslipWhereInput[] = [payslipWhereForCompanyDrilldown(session, companyId)];
    if (q.payPeriodId) parts.push({ payPeriodId: q.payPeriodId });
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
    const where: Prisma.PayslipWhereInput = parts.length === 1 ? parts[0]! : { AND: parts };

    const [items, total] = await Promise.all([
      prisma.payslip.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: q.pageSize,
        include: {
          employee: { include: { user: true } },
          payPeriod: true,
          timesheet: true,
        },
      }),
      prisma.payslip.count({ where }),
    ]);
    return NextResponse.json({ items, total, page: q.page, pageSize: q.pageSize });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid query", issues: e.issues }, { status: 400 });
    }
    const err = e as Error & { status?: number };
    return NextResponse.json({ error: err.message }, { status: err.status ?? 500 });
  }
}
