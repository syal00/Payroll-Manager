import "server-only";

import { prisma } from "@/lib/prisma";
import { scopeForCompanyDrilldown } from "@/lib/manager-scope";
import type { SessionUser } from "@/lib/session";

export async function requireCompanyEmployee(
  session: SessionUser,
  companyId: string,
  employeeId: string
) {
  const drilldownScope = await scopeForCompanyDrilldown(session, companyId);
  const employee = await prisma.employee.findFirst({
    where: { id: employeeId, ...drilldownScope },
    select: {
      id: true,
      name: true,
      username: true,
      contactEmail: true,
      employeeCode: true,
      userId: true,
      mirroredFromEmployeeId: true,
      deletedAt: true,
      isApproved: true,
      _count: { select: { timesheets: true, payslips: true } },
    },
  });

  if (!employee) {
    const err = new Error("Employee not found");
    (err as Error & { status: number }).status = 404;
    throw err;
  }

  return employee;
}
