import "server-only";

import { prisma } from "@/lib/prisma";
import { mirrorEmployeeToTargetCompany, syncEmployeeLoginAcrossMirror } from "@/lib/company-mirror";
import { findEmployeeByContactEmailInCompany } from "@/lib/employee-lookup";
import {
  loginUsernameFromContactEmail,
  normalizeContactEmail,
  splitDisplayName,
} from "@/lib/display-name";
import { validateEmailDeliverableOrThrow } from "@/lib/email-deliverable";

type CreateStaffUserInput = {
  firstName: string;
  lastName: string;
  contactEmail: string;
  passwordHash: string;
  role: string;
  companyId: string | null;
  name?: string;
  createdById?: string | null;
  mustChangePassword?: boolean;
  username?: string;
};

export async function createStaffUser(input: CreateStaffUserInput) {
  const contactEmail = await validateEmailDeliverableOrThrow(input.contactEmail);
  const name = input.name?.trim() || `${input.firstName.trim()} ${input.lastName.trim()}`.trim();
  const username =
    input.username?.trim().toLowerCase() ?? loginUsernameFromContactEmail(contactEmail);

  const existingUsername = await prisma.user.findUnique({
    where: { username },
    select: { id: true },
  });
  if (existingUsername) {
    throw new Error("An account with this email already exists.");
  }

  const existingContact = await prisma.user.findUnique({
    where: { contactEmail },
    select: { id: true },
  });
  if (existingContact) {
    throw new Error("An account with this contact email already exists.");
  }

  return prisma.user.create({
    data: {
      username,
      contactEmail,
      passwordHash: input.passwordHash,
      name,
      role: input.role,
      companyId: input.companyId,
      createdById: input.createdById ?? null,
      mustChangePassword: input.mustChangePassword ?? false,
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
}

type CreateEmployeeProfileInput = {
  firstName: string;
  lastName: string;
  contactEmail: string;
  name?: string;
  companyId: string | null;
  employeeCode: string;
  isApproved?: boolean;
  emailVerified?: boolean;
  hourlyRate?: number;
  overtimeRate?: number;
};

type CreateSelfRegisteredEmployeeInput = {
  firstName: string;
  lastName: string;
  contactEmail: string;
  passwordHash: string;
  companyId: string | null;
  employeeCode: string;
};

const employeeResultSelect = {
  id: true,
  employeeCode: true,
  username: true,
  contactEmail: true,
  name: true,
  isApproved: true,
} as const;

/** Self-service registration: linked User (password) + pending Employee profile in one company. */
export async function createSelfRegisteredEmployee(input: CreateSelfRegisteredEmployeeInput) {
  const contactEmail = await validateEmailDeliverableOrThrow(input.contactEmail);
  const name = `${input.firstName.trim()} ${input.lastName.trim()}`.trim();
  const username = loginUsernameFromContactEmail(contactEmail);
  const companyId = input.companyId;

  if (!companyId) {
    throw new Error("Company is required for employee registration.");
  }

  const existingEmployee = await findEmployeeByContactEmailInCompany(contactEmail, companyId);

  if (existingEmployee?.deletedAt) {
    throw new Error("DEACTIVATED");
  }

  if (existingEmployee?.isApproved && existingEmployee.userId) {
    throw new Error("ALREADY_REGISTERED");
  }

  if (existingEmployee?.isApproved && !existingEmployee.userId) {
    const existingUser = await prisma.user.findUnique({
      where: { contactEmail },
      select: { id: true, role: true },
    });
    if (existingUser && existingUser.role !== "EMPLOYEE") {
      throw new Error("ADMIN_EMAIL_IN_USE");
    }

    if (existingUser) {
      await prisma.$transaction([
        prisma.user.update({
          where: { id: existingUser.id },
          data: { passwordHash: input.passwordHash, name },
        }),
        prisma.employee.update({
          where: { id: existingEmployee.id },
          data: { userId: existingUser.id, name, emailVerified: true },
        }),
      ]);
      await syncEmployeeLoginAcrossMirror(existingEmployee.id, existingUser.id);
    } else {
      const user = await prisma.$transaction(async (tx) => {
        const createdUser = await tx.user.create({
          data: {
            username,
            contactEmail,
            passwordHash: input.passwordHash,
            name,
            role: "EMPLOYEE",
            companyId,
          },
          select: { id: true },
        });
        await tx.employee.update({
          where: { id: existingEmployee.id },
          data: { userId: createdUser.id, name, emailVerified: true },
        });
        return createdUser;
      });
      await syncEmployeeLoginAcrossMirror(existingEmployee.id, user.id);
    }

    await mirrorEmployeeToTargetCompany(existingEmployee.id);
    return {
      id: existingEmployee.id,
      employeeCode: existingEmployee.employeeCode,
      username: existingEmployee.username,
      contactEmail,
      name,
      isApproved: true,
    };
  }

  if (existingEmployee && !existingEmployee.isApproved) {
    if (existingEmployee.userId) {
      await prisma.$transaction([
        prisma.user.update({
          where: { id: existingEmployee.userId },
          data: { passwordHash: input.passwordHash, name },
        }),
        prisma.employee.update({
          where: { id: existingEmployee.id },
          data: { name, emailVerified: true },
        }),
      ]);
    } else {
      const existingUser = await prisma.user.findUnique({
        where: { contactEmail },
        select: { id: true, role: true },
      });

      if (existingUser) {
        if (existingUser.role !== "EMPLOYEE") {
          throw new Error("ADMIN_EMAIL_IN_USE");
        }
        await prisma.$transaction([
          prisma.user.update({
            where: { id: existingUser.id },
            data: { passwordHash: input.passwordHash, name },
          }),
          prisma.employee.update({
            where: { id: existingEmployee.id },
            data: { userId: existingUser.id, name, emailVerified: true },
          }),
        ]);
      } else {
        await prisma.$transaction(async (tx) => {
          const user = await tx.user.create({
            data: {
              username,
              contactEmail,
              passwordHash: input.passwordHash,
              name,
              role: "EMPLOYEE",
              companyId,
            },
            select: { id: true },
          });
          await tx.employee.update({
            where: { id: existingEmployee.id },
            data: { userId: user.id, name, emailVerified: true },
          });
        });
      }
    }

    await mirrorEmployeeToTargetCompany(existingEmployee.id);
    return {
      id: existingEmployee.id,
      employeeCode: existingEmployee.employeeCode,
      username: existingEmployee.username,
      contactEmail,
      name,
      isApproved: false,
    };
  }

  const existingUser = await prisma.user.findUnique({
    where: { contactEmail },
    select: { id: true, role: true },
  });

  if (existingUser && existingUser.role !== "EMPLOYEE") {
    throw new Error("ADMIN_EMAIL_IN_USE");
  }

  let employee;
  if (existingUser) {
    employee = await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: existingUser.id },
        data: { passwordHash: input.passwordHash, name },
      });
      return tx.employee.create({
        data: {
          employeeCode: input.employeeCode,
          username,
          contactEmail,
          name,
          companyId,
          userId: existingUser.id,
          isApproved: false,
          emailVerified: true,
        },
        select: employeeResultSelect,
      });
    });
  } else {
    employee = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          username,
          contactEmail,
          passwordHash: input.passwordHash,
          name,
          role: "EMPLOYEE",
          companyId,
        },
        select: { id: true },
      });

      return tx.employee.create({
        data: {
          employeeCode: input.employeeCode,
          username,
          contactEmail,
          name,
          companyId,
          userId: user.id,
          isApproved: false,
          emailVerified: true,
        },
        select: employeeResultSelect,
      });
    });
  }

  await mirrorEmployeeToTargetCompany(employee.id);
  return employee;
}

export async function createEmployeeProfile(input: CreateEmployeeProfileInput) {
  const contactEmail = await validateEmailDeliverableOrThrow(input.contactEmail);
  const name = input.name?.trim() || `${input.firstName.trim()} ${input.lastName.trim()}`.trim();
  const username = loginUsernameFromContactEmail(contactEmail);

  if (!input.companyId) {
    throw new Error("Company is required.");
  }

  const existingContact = await findEmployeeByContactEmailInCompany(contactEmail, input.companyId);
  if (existingContact) {
    throw new Error("An employee profile with this contact email already exists in this company.");
  }

  const employee = await prisma.employee.create({
    data: {
      employeeCode: input.employeeCode,
      username,
      contactEmail,
      name,
      companyId: input.companyId,
      hourlyRate: input.hourlyRate ?? 28,
      overtimeRate: input.overtimeRate ?? 42,
      isApproved: input.isApproved ?? false,
      emailVerified: input.emailVerified ?? (input.isApproved ?? false),
    },
  });

  await mirrorEmployeeToTargetCompany(employee.id);
  return employee;
}

export async function resolveCompanySlug(companyId: string | null): Promise<string> {
  if (!companyId) return "platform";
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { slug: true },
  });
  return company?.slug ?? "company";
}

export { splitDisplayName, normalizeContactEmail } from "@/lib/display-name";
