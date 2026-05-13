import { prisma } from "@/lib/prisma";
import { normalizeEmployeeCode } from "@/lib/employee-code";

/** Lookup by public employee code, including deactivated (for layout / messaging). */
export async function findEmployeeByCodeAnyStatus(employeeCode: string) {
  const code = normalizeEmployeeCode(employeeCode);
  return prisma.employee.findUnique({
    where: { employeeCode: code },
    include: { user: true },
  });
}

/** Active employees only — public APIs and portal access. */
export async function getPublicEmployeeByCode(employeeCode: string) {
  const code = normalizeEmployeeCode(employeeCode);
  return prisma.employee.findFirst({
    where: { employeeCode: code, deletedAt: null, isApproved: true },
    include: { user: true },
  });
}
