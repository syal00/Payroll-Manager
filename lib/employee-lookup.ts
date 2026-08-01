import "server-only";

import { prisma } from "@/lib/prisma";
import { normalizeUsername } from "@/lib/username-generator";

/** Employee login/profile scoped to one company (same email may exist in Syal + Unison). */
export async function findEmployeeByLoginIdentity(login: string, companyId?: string | null) {
  const identity = normalizeUsername(login);
  const baseWhere = {
    deletedAt: null as null,
    OR: [{ username: identity }, { contactEmail: identity }],
  };

  if (companyId) {
    return prisma.employee.findFirst({
      where: { ...baseWhere, companyId },
    });
  }

  return prisma.employee.findFirst({ where: baseWhere });
}

export async function findEmployeeByContactEmailInCompany(
  contactEmail: string,
  companyId: string | null | undefined
) {
  if (!companyId) return null;
  return prisma.employee.findFirst({
    where: {
      companyId,
      contactEmail: contactEmail.trim().toLowerCase(),
      deletedAt: null,
    },
  });
}
