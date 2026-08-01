import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

const PLATFORM_ONLY_ACTIONS = ["SEED_DATABASE"] as const;

/** Tenant-scoped audit log filter — hides other companies' platform provisioning noise. */
export async function auditLogWhereForCompany(companyId: string): Promise<Prisma.AuditLogWhereInput> {
  const [employees, users, payPeriods, timesheets, payslips] = await Promise.all([
    prisma.employee.findMany({ where: { companyId }, select: { id: true } }),
    prisma.user.findMany({ where: { companyId }, select: { id: true } }),
    prisma.payPeriod.findMany({ where: { companyId }, select: { id: true } }),
    prisma.timesheet.findMany({
      where: { employee: { companyId } },
      select: { id: true },
    }),
    prisma.payslip.findMany({
      where: { employee: { companyId } },
      select: { id: true },
    }),
  ]);

  const employeeIds = employees.map((e) => e.id);
  const userIds = users.map((u) => u.id);
  const payPeriodIds = payPeriods.map((p) => p.id);
  const timesheetIds = timesheets.map((t) => t.id);
  const payslipIds = payslips.map((p) => p.id);

  const entityClauses: Prisma.AuditLogWhereInput[] = [
    { actor: { companyId } },
    { entityType: "Company", entityId: companyId },
  ];

  if (employeeIds.length > 0) {
    entityClauses.push({ entityType: "Employee", entityId: { in: employeeIds } });
  }
  if (userIds.length > 0) {
    entityClauses.push({ entityType: "User", entityId: { in: userIds } });
  }
  if (payPeriodIds.length > 0) {
    entityClauses.push({ entityType: "PayPeriod", entityId: { in: payPeriodIds } });
  }
  if (timesheetIds.length > 0) {
    entityClauses.push({ entityType: "Timesheet", entityId: { in: timesheetIds } });
  }
  if (payslipIds.length > 0) {
    entityClauses.push({ entityType: "Payslip", entityId: { in: payslipIds } });
  }

  return {
    AND: [
      { action: { notIn: [...PLATFORM_ONLY_ACTIONS] } },
      { OR: entityClauses },
      {
        NOT: {
          AND: [{ entityType: "Company" }, { entityId: { not: companyId } }],
        },
      },
      {
        NOT: {
          AND: [
            { action: { in: ["COMPANY_CREATED", "COMPANY_DELETED", "COMPANY_UPDATED"] } },
            { entityType: "Company" },
            { entityId: { not: companyId } },
          ],
        },
      },
      ...(userIds.length > 0
        ? [
            {
              NOT: {
                AND: [
                  {
                    action: { in: ["MAIN_ADMIN_ACCOUNT_CREATED", "MANAGER_ACCOUNT_CREATED"] },
                  },
                  { entityType: "User" },
                  { entityId: { notIn: userIds } },
                ],
              },
            } satisfies Prisma.AuditLogWhereInput,
          ]
        : []),
    ],
  };
}

export function formatAuditDetails(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null;
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const cleaned = { ...parsed };
    delete cleaned.companyId;
    return JSON.stringify(cleaned, null, 2);
  } catch {
    return raw.trim();
  }
}

export function shortenEntityId(id: string | null | undefined): string | null {
  if (!id) return null;
  if (id.length <= 18) return id;
  return `${id.slice(0, 10)}…${id.slice(-6)}`;
}

export function formatAuditAction(action: string): string {
  return action
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function formatAuditActorName(
  actor: { name: string } | null | undefined,
  action: string
): string {
  if (actor?.name) return actor.name;
  if (action.includes("EMPLOYEE_SELF") || action.includes("PUBLIC") || action.includes("OTP")) {
    return "System (employee)";
  }
  return "System";
}
