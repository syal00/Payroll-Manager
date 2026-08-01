import "server-only";

import { prisma } from "@/lib/prisma";
import { Role } from "@/lib/enums";
import {
  COMPANY_STAFF_ROLES,
  type CompanyStaffRole,
  isCompanyStaffRole,
} from "@/lib/staff-roles";

import { normalizeContactEmail } from "@/lib/display-name";
import { staffRoleDisplayLabel } from "@/lib/staff-roles";

export { COMPANY_STAFF_ROLES, type CompanyStaffRole, isCompanyStaffRole };

export async function countActiveMainAdmins(companyId: string, excludeUserId?: string) {
  return prisma.user.count({
    where: {
      companyId,
      role: Role.MAIN_ADMIN,
      deletedAt: null,
      ...(excludeUserId ? { NOT: { id: excludeUserId } } : {}),
    },
  });
}

export async function requireCompanyStaffMember(companyId: string, userId: string) {
  const user = await prisma.user.findFirst({
    where: { id: userId, companyId },
    select: {
      id: true,
      role: true,
      companyId: true,
      username: true,
      contactEmail: true,
      name: true,
      createdAt: true,
      deletedAt: true,
      mustChangePassword: true,
      _count: { select: { assignedEmployees: true } },
    },
  });

  if (!user || !isCompanyStaffRole(user.role)) {
    const err = new Error("Staff account not found for this company.");
    (err as Error & { status: number }).status = 404;
    throw err;
  }

  return user;
}

export async function assertCanRemoveMainAdmin(companyId: string, userId: string) {
  const user = await requireCompanyStaffMember(companyId, userId);
  if (user.role !== Role.MAIN_ADMIN) return user;

  const others = await countActiveMainAdmins(companyId, userId);
  if (others === 0) {
    const err = new Error("Cannot remove or suspend the only main admin for this company.");
    (err as Error & { status: number }).status = 400;
    throw err;
  }
  return user;
}

export const staffListSelect = {
  id: true,
  username: true,
  contactEmail: true,
  name: true,
  role: true,
  createdAt: true,
  deletedAt: true,
  mustChangePassword: true,
  createdBy: { select: { username: true, name: true } },
  _count: { select: { assignedEmployees: true } },
} as const;

export function mapStaffRow(
  u: {
    id: string;
    username: string;
    contactEmail: string;
    name: string;
    role: string;
    createdAt: Date;
    deletedAt: Date | null;
    mustChangePassword: boolean;
    createdBy: { username: string; name: string } | null;
    _count: { assignedEmployees: number };
  }
) {
  return {
    id: u.id,
    username: u.username,
    contactEmail: u.contactEmail,
    name: u.name,
    role: u.role,
    createdAt: u.createdAt.toISOString(),
    deletedAt: u.deletedAt?.toISOString() ?? null,
    suspended: u.deletedAt != null,
    mustChangePassword: u.mustChangePassword,
    assignedEmployeeCount: u._count.assignedEmployees,
    createdByUsername: u.createdBy?.username ?? null,
  };
}

type StaffEmailConflictHint = "active_staff" | "suspended_staff" | "employee" | "other_company" | "other_account";

export type ProvisionCompanyStaffInput = {
  companyId: string;
  companyName: string;
  firstName: string;
  lastName: string;
  contactEmail: string;
  passwordHash: string;
  role: CompanyStaffRole;
  createdById: string;
};

export type ProvisionCompanyStaffResult =
  | {
      ok: true;
      user: {
        id: string;
        username: string;
        contactEmail: string;
        name: string;
        role: string;
        createdAt: Date;
      };
      reactivated: boolean;
    }
  | { ok: false; status: number; error: string; hint?: StaffEmailConflictHint };

export async function provisionCompanyStaffUser(
  input: ProvisionCompanyStaffInput
): Promise<ProvisionCompanyStaffResult> {
  const contactEmail = normalizeContactEmail(input.contactEmail);
  const name = `${input.firstName.trim()} ${input.lastName.trim()}`.trim();

  const employeeConflict = input.companyId
    ? await prisma.employee.findFirst({
        where: { companyId: input.companyId, contactEmail },
        select: { name: true, companyId: true, company: { select: { name: true } } },
      })
    : await prisma.employee.findFirst({
        where: { contactEmail },
        select: { name: true, companyId: true, company: { select: { name: true } } },
      });
  if (employeeConflict) {
    const where =
      employeeConflict.companyId === input.companyId
        ? "this company’s employee portal"
        : employeeConflict.company?.name ?? "another company";
    return {
      ok: false,
      status: 409,
      hint: "employee",
      error: `${contactEmail} is already registered as an employee (${employeeConflict.name}) at ${where}. Use a different email for staff, or remove the employee profile first.`,
    };
  }

  const existing = await prisma.user.findUnique({
    where: { contactEmail },
    select: {
      id: true,
      name: true,
      role: true,
      companyId: true,
      deletedAt: true,
      username: true,
      company: { select: { name: true } },
    },
  });

  if (existing) {
    if (existing.companyId === input.companyId && isCompanyStaffRole(existing.role)) {
      if (existing.deletedAt) {
        const user = await prisma.user.update({
          where: { id: existing.id },
          data: {
            name,
            role: input.role,
            passwordHash: input.passwordHash,
            mustChangePassword: true,
            deletedAt: null,
            tokenVersion: { increment: 1 },
            createdById: input.createdById,
          },
          select: {
            id: true,
            username: true,
            contactEmail: true,
            name: true,
            role: true,
            createdAt: true,
          },
        });
        return { ok: true, user, reactivated: true };
      }

      return {
        ok: false,
        status: 409,
        hint: "active_staff",
        error: `${existing.name} is already an active ${staffRoleDisplayLabel(existing.role)} with this email. Check the Active tab or edit that account.`,
      };
    }

    if (existing.companyId === input.companyId) {
      return {
        ok: false,
        status: 409,
        hint: "other_account",
        error: `${contactEmail} is used by ${existing.name} (${staffRoleDisplayLabel(existing.role)}) in this company. Use a different contact email.`,
      };
    }

    const companyLabel = existing.company?.name ?? "another company";
    return {
      ok: false,
      status: 409,
      hint: "other_company",
      error: `${contactEmail} is already used by ${existing.name} (${staffRoleDisplayLabel(existing.role)}) at ${companyLabel}. Each login email can only belong to one account.`,
    };
  }

  const { createStaffUser } = await import("@/lib/staff-account");
  try {
    const user = await createStaffUser({
      firstName: input.firstName,
      lastName: input.lastName,
      contactEmail,
      passwordHash: input.passwordHash,
      role: input.role,
      companyId: input.companyId,
      createdById: input.createdById,
      mustChangePassword: true,
    });
    return { ok: true, user, reactivated: false };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Could not create staff account.";
    return {
      ok: false,
      status: message.includes("already exists") ? 409 : 500,
      error: message,
    };
  }
}
