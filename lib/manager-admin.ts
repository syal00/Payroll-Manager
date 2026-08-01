import { prisma } from "@/lib/prisma";
import { Role } from "@/lib/enums";
import type { SessionUser } from "@/lib/session";
import { resolveTenantCompanyId } from "@/lib/tenant-acting";

export async function requireManagerInCompany(session: SessionUser, managerId: string) {
  const companyId = await resolveTenantCompanyId(session);
  if (!companyId) {
    const err = new Error("Company context required");
    (err as Error & { status: number }).status = 403;
    throw err;
  }

  const manager = await prisma.user.findUnique({
    where: { id: managerId },
    select: {
      id: true,
      role: true,
      companyId: true,
      deletedAt: true,
      username: true,
      contactEmail: true,
      name: true,
      createdAt: true,
      _count: { select: { assignedEmployees: true } },
    },
  });

  if (!manager || manager.role !== Role.MANAGER) {
    const err = new Error("Manager not found");
    (err as Error & { status: number }).status = 404;
    throw err;
  }

  if (manager.deletedAt) {
    const err = new Error("Manager account is suspended");
    (err as Error & { status: number }).status = 404;
    throw err;
  }

  if (manager.companyId !== companyId) {
    const err = new Error("Forbidden");
    (err as Error & { status: number }).status = 403;
    throw err;
  }

  return { manager, companyId };
}
