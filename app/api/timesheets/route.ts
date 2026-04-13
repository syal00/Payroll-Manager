import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";
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

export async function GET(req: Request) {
  try {
    await requireAdmin();
    const url = new URL(req.url);
    const q = querySchema.parse(Object.fromEntries(url.searchParams.entries()));
    const where: Prisma.TimesheetWhereInput = {};
    if (q.payPeriodId) where.payPeriodId = q.payPeriodId;
    if (q.status) where.status = q.status;
    if (q.q?.trim()) {
      const term = q.q.trim();
      where.employee = {
        OR: [
          { name: { contains: term } },
          { email: { contains: term } },
          { employeeCode: { contains: term } },
          { user: { name: { contains: term } } },
        ],
      };
    }
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
    const err = e as Error & { status?: number };
    return NextResponse.json({ error: err.message }, { status: err.status ?? 500 });
  }
}
