import "server-only";
import { prisma } from "@/lib/prisma";
import { normalizeUsername } from "@/lib/username-generator";
import { findEmployeeByLoginIdentity as findEmployeeScoped } from "@/lib/employee-lookup";

/** Resolves a staff user by login field (username or contact email). */
export async function findUserByLoginIdentity(login: string) {
  const identity = normalizeUsername(login);
  return (
    (await prisma.user.findUnique({ where: { username: identity } })) ??
    (await prisma.user.findUnique({ where: { contactEmail: identity } }))
  );
}

/** Resolves an employee by login field, optionally scoped to the tenant company. */
export async function findEmployeeByLoginIdentity(login: string, companyId?: string | null) {
  return findEmployeeScoped(login, companyId);
}
