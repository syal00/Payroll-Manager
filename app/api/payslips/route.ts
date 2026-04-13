import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { Role } from "@/lib/enums";
import { getEmployeeRecord } from "@/lib/employee-scope";
import { z } from "zod";
import type { Prisma } from "@prisma/client";

const querySchema = z.object({
  q: z.string().optional(),
  payPeriodId: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
});

export async function GET(req: Request) {
  try {
    const session = await requireSession();
    const url = new URL(req.url);
    const q = querySchema.parse(Object.fromEntries(url.searchParams.entries()));
    const skip = (q.page - 1) * q.pageSize;

    if (session.role === Role.ADMIN) {
      const where: Prisma.PayslipWhereInput = {};
      if (q.payPeriodId) where.payPeriodId = q.payPeriodId;
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
    }

    const emp = await getEmployeeRecord(session.id);
    if (!emp) return NextResponse.json({ items: [], total: 0 });
    const where = { employeeId: emp.id };
    const [items, total] = await Promise.all([
      prisma.payslip.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: q.pageSize,
        include: { payPeriod: true, timesheet: true, items: true },
      }),
      prisma.payslip.count({ where }),
    ]);
    return NextResponse.json({ items, total, page: q.page, pageSize: q.pageSize });
  } catch (e) {
    const err = e as Error & { status?: number };
    return NextResponse.json({ error: err.message }, { status: err.status ?? 500 });
  }
}
