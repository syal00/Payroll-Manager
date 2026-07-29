import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/api-auth";
import type { SessionUser } from "@/lib/session";

/**
 * Guard + tenant target resolution for `app/api/super-admin/companies/[companyId]/*`.
 * companyId ALWAYS comes from the URL param — never session.companyId (null for SUPER_ADMIN).
 */
export async function requireSuperAdminCompanyDrilldown(
  params: Promise<{ companyId: string }>
): Promise<{ session: SessionUser; companyId: string; company: { id: string; name: string } }> {
  const session = await requireSuperAdmin();
  const { companyId } = await params;

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { id: true, name: true },
  });

  if (!company) {
    const err = new Error("Company not found");
    (err as Error & { status: number }).status = 404;
    throw err;
  }

  return { session, companyId, company };
}

/** PayPeriod has no companyId column — derive relevant period ids from this tenant's rows only. */
export async function payPeriodIdsForCompany(companyId: string): Promise<string[]> {
  const [fromTimesheets, fromPayslips] = await Promise.all([
    prisma.timesheet.findMany({
      where: { employee: { companyId } },
      select: { payPeriodId: true },
      distinct: ["payPeriodId"],
    }),
    prisma.payslip.findMany({
      where: { employee: { companyId } },
      select: { payPeriodId: true },
      distinct: ["payPeriodId"],
    }),
  ]);
  return [...new Set([...fromTimesheets.map((r) => r.payPeriodId), ...fromPayslips.map((r) => r.payPeriodId)])];
}
