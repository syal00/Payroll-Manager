import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";
import { z } from "zod";
import type { Prisma } from "@prisma/client";

const querySchema = z.object({
  status: z.enum(["active", "deleted", "all"]).default("active"),
});

export async function GET(req: Request) {
  try {
    await requireAdmin();
    const url = new URL(req.url);
    const { status } = querySchema.parse(Object.fromEntries(url.searchParams.entries()));

    const where: Prisma.EmployeeWhereInput = {};
    if (status === "active") where.deletedAt = null;
    if (status === "deleted") where.deletedAt = { not: null };

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
