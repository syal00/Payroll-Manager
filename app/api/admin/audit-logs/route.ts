import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMainAdmin } from "@/lib/api-auth";
import { auditLogWhereForCompany } from "@/lib/audit-log-scope";
import { resolveTenantCompanyId } from "@/lib/tenant-acting";
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

function buildFilters(q: z.infer<typeof querySchema>): Prisma.AuditLogWhereInput {
  const where: Prisma.AuditLogWhereInput = {};
  if (q.q?.trim()) {
    where.OR = [
      { action: { contains: q.q.trim() } },
      { entityType: { contains: q.q.trim() } },
      { entityId: { contains: q.q.trim() } },
      { details: { contains: q.q.trim() } },
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
      if (!Number.isNaN(t)) {
        const end = new Date(t);
        end.setHours(23, 59, 59, 999);
        createdAt.lte = end;
      }
    }
    if (Object.keys(createdAt).length > 0) where.createdAt = createdAt;
  }
  return where;
}

export async function GET(req: Request) {
  try {
    const session = await requireMainAdmin();
    const companyId = await resolveTenantCompanyId(session);
    if (!companyId) {
      return NextResponse.json({
        items: [],
        total: 0,
        page: 1,
        pageSize: 25,
        error: "Company context required for audit logs.",
      });
    }

    const url = new URL(req.url);
    const q = querySchema.parse(Object.fromEntries(url.searchParams.entries()));
    const skip = (q.page - 1) * q.pageSize;

    const filters = buildFilters(q);
    const clauses: Prisma.AuditLogWhereInput[] = [await auditLogWhereForCompany(companyId)];
    if (Object.keys(filters).length > 0) clauses.unshift(filters);

    const where: Prisma.AuditLogWhereInput = { AND: clauses };

    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: q.pageSize,
        include: { actor: { select: { name: true, contactEmail: true, username: true } } },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return NextResponse.json({ items, total, page: q.page, pageSize: q.pageSize });
  } catch (e) {
    const err = e as Error & { status?: number };
    return NextResponse.json({ error: err.message }, { status: err.status ?? 500 });
  }
}
