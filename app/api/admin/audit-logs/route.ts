import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";
import { z } from "zod";
import type { Prisma } from "@prisma/client";

const querySchema = z.object({
  q: z.string().optional(),
  action: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(25),
});

export async function GET(req: Request) {
  try {
    await requireAdmin();
    const url = new URL(req.url);
    const q = querySchema.parse(Object.fromEntries(url.searchParams.entries()));
    const skip = (q.page - 1) * q.pageSize;

    const where: Prisma.AuditLogWhereInput = {};
    if (q.q?.trim()) {
      where.OR = [
        { action: { contains: q.q.trim() } },
        { entityType: { contains: q.q.trim() } },
      ];
    }
    if (q.action?.trim()) {
      where.action = { equals: q.action.trim() };
    }
    if (q.from || q.to) {
      const createdAt: Prisma.DateTimeFilter = {};
      if (q.from) {
        const t = Date.parse(q.from);
        if (!Number.isNaN(t)) createdAt.gte = new Date(t);
      }
      if (q.to) {
        const t = Date.parse(q.to);
        if (!Number.isNaN(t)) createdAt.lte = new Date(t);
      }
      if (Object.keys(createdAt).length > 0) where.createdAt = createdAt;
    }

    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: q.pageSize,
        include: { actor: true },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return NextResponse.json({ items, total, page: q.page, pageSize: q.pageSize });
  } catch (e) {
    const err = e as Error & { status?: number };
    return NextResponse.json({ error: err.message }, { status: err.status ?? 500 });
  }
}
