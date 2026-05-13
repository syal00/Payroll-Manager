import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/api-auth";
import { employeeWhereForStaff } from "@/lib/manager-scope";
import { z } from "zod";
import type { Prisma } from "@prisma/client";

const querySchema = z.object({
  status: z.enum(["active", "deleted", "all", "pending"]).default("active"),
});

export async function GET(req: Request) {
  try {
    const session = await requireStaff();
    const url = new URL(req.url);
    const { status } = querySchema.parse(Object.fromEntries(url.searchParams.entries()));

    const where: Prisma.EmployeeWhereInput = {};
    if (status === "active") {
      where.deletedAt = null;
      where.isApproved = true;
    }
    if (status === "pending") {
      where.deletedAt = null;
      where.isApproved = false;
    }
    if (status === "deleted") where.deletedAt = { not: null };

    const scope = employeeWhereForStaff(session);
    if (scope) {
      Object.assign(where, scope);
    }

    const employees = await prisma.employee.findMany({
      where,
      orderBy: { name: "asc" },
      include: {
        user: { select: { id: true, email: true, name: true } },
        _count: { select: { timesheets: true, payslips: true } },
      },
    });

    return NextResponse.json({
      employees: employees.map((e) => ({
        id: e.id,
        name: e.name,
        email: e.email,
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
