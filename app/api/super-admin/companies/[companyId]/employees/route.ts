// companyId MUST come from params, not session — this route is shared across all tenants.
// See lib/manager-scope.ts scopeForCompanyDrilldown for why session.companyId (null for
// SUPER_ADMIN) can never be used here.
//
// Mirrors app/api/admin/employees/route.ts. GET only: there is no admin-side POST-create-employee
// endpoint to mirror either (employees are created via public self-registration + admin approval),
// so none is added here.
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { scopeForCompanyDrilldown } from "@/lib/manager-scope";
import { requireSuperAdminCompanyDrilldown } from "@/lib/super-admin-drilldown";
import { z } from "zod";
import type { Prisma } from "@prisma/client";

const querySchema = z.object({
  status: z.enum(["active", "deleted", "all", "pending"]).default("active"),
});

export async function GET(req: Request, ctx: { params: Promise<{ companyId: string }> }) {
  try {
    const { session, companyId } = await requireSuperAdminCompanyDrilldown(ctx.params);
    const url = new URL(req.url);
    const { status } = querySchema.parse(Object.fromEntries(url.searchParams.entries()));

    const where: Prisma.EmployeeWhereInput = { ...scopeForCompanyDrilldown(session, companyId) };
    if (status === "active") {
      where.deletedAt = null;
      where.isApproved = true;
    }
    if (status === "pending") {
      where.deletedAt = null;
      where.isApproved = false;
    }
    if (status === "deleted") where.deletedAt = { not: null };

    const employees = await prisma.employee.findMany({
      where,
      orderBy: { name: "asc" },
      include: {
        user: { select: { id: true, username: true, contactEmail: true, name: true } },
        _count: { select: { timesheets: true, payslips: true } },
      },
    });

    return NextResponse.json({
      employees: employees.map((e) => ({
        id: e.id,
        name: e.name,
        username: e.username,
        contactEmail: e.contactEmail,
        employeeCode: e.employeeCode,
        deletedAt: e.deletedAt?.toISOString() ?? null,
        isApproved: e.isApproved,
        department: e.department,
        jobTitle: e.jobTitle,
        timesheetCount: e._count.timesheets,
        payslipCount: e._count.payslips,
        linkedUser: e.user,
      })),
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid query", issues: e.issues }, { status: 400 });
    }
    const err = e as Error & { status?: number };
    return NextResponse.json({ error: err.message }, { status: err.status ?? 500 });
  }
}
