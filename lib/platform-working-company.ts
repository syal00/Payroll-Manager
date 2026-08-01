import "server-only";

import { prisma } from "@/lib/prisma";

const SETTING_KEY = "employee_working_company_id";

let cachedWorkingCompanyId: string | null | undefined;

export function invalidatePlatformWorkingCompanyCache(): void {
  cachedWorkingCompanyId = undefined;
}

export async function getPlatformWorkingCompanyId(): Promise<string | null> {
  if (cachedWorkingCompanyId !== undefined) return cachedWorkingCompanyId;
  const row = await prisma.setting.findUnique({ where: { key: SETTING_KEY } });
  const value = row?.value?.trim();
  cachedWorkingCompanyId = value || null;
  return cachedWorkingCompanyId;
}

export async function setPlatformWorkingCompanyId(companyId: string | null): Promise<void> {
  if (companyId) {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true },
    });
    if (!company) {
      throw new Error("Company not found.");
    }
    await prisma.setting.upsert({
      where: { key: SETTING_KEY },
      create: { key: SETTING_KEY, value: companyId },
      update: { value: companyId },
    });
  } else {
    await prisma.setting.deleteMany({ where: { key: SETTING_KEY } });
  }
  invalidatePlatformWorkingCompanyCache();
}

export async function getPlatformWorkingCompany(): Promise<{
  id: string;
  name: string;
  slug: string;
} | null> {
  const id = await getPlatformWorkingCompanyId();
  if (!id) return null;
  const company = await prisma.company.findUnique({
    where: { id },
    select: { id: true, name: true, slug: true },
  });
  if (!company) {
    await setPlatformWorkingCompanyId(null);
    return null;
  }
  return company;
}
