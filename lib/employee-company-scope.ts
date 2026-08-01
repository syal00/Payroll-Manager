import "server-only";

import { prisma } from "@/lib/prisma";
import { getPlatformWorkingCompanyId } from "@/lib/platform-working-company";

/** Demo / bootstrap org used when self-registration has no tenant subdomain. */
export const DEFAULT_EMPLOYEE_COMPANY_SLUG = "syal-operations";

let cachedDefaultCompanyId: string | null | undefined;

export async function getDefaultEmployeeCompanyId(): Promise<string | null> {
  if (cachedDefaultCompanyId !== undefined) return cachedDefaultCompanyId;
  const row = await prisma.company.findUnique({
    where: { slug: DEFAULT_EMPLOYEE_COMPANY_SLUG },
    select: { id: true },
  });
  cachedDefaultCompanyId = row?.id ?? null;
  return cachedDefaultCompanyId;
}

/**
 * Which company employee hours / pay periods belong to.
 * Platform "current working" company overrides everything when set.
 */
export async function resolveEmployeeTargetCompanyId(
  employee: { id: string; companyId: string | null },
  headerCompanyId?: string | null
): Promise<string | null> {
  const platformWorking = await getPlatformWorkingCompanyId();
  if (platformWorking) return platformWorking;

  if (employee.companyId) return employee.companyId;

  return headerCompanyId?.trim() || (await getDefaultEmployeeCompanyId());
}

/** Registration / open pay-period lists — no employee row yet or header-only context. */
export async function resolveRegistrationCompanyId(headerCompanyId?: string | null): Promise<string | null> {
  const platformWorking = await getPlatformWorkingCompanyId();
  if (platformWorking) return platformWorking;
  return headerCompanyId?.trim() || (await getDefaultEmployeeCompanyId());
}

/** Company used for pay periods — assigns default tenant when missing. */
export async function ensureEmployeeCompanyId(
  employee: { id: string; companyId: string | null },
  headerCompanyId?: string | null
): Promise<string | null> {
  const resolved = await resolveEmployeeTargetCompanyId(employee, headerCompanyId);
  if (!resolved) return null;

  if (!employee.companyId) {
    await prisma.employee.update({
      where: { id: employee.id },
      data: { companyId: resolved },
    });
  }

  return resolved;
}
