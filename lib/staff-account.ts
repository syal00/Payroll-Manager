import { prisma } from "@/lib/prisma";
import {
  assertUsernameNotContactEmail,
  normalizeContactEmail,
  splitDisplayName,
  validateEmailDeliverableOrThrow,
} from "@/lib/email-deliverable";
import { generateUsername } from "@/lib/username-generator";

type CreateStaffUserInput = {
  firstName: string;
  lastName: string;
  contactEmail: string;
  passwordHash: string;
  role: string;
  companyId: string | null;
  name?: string;
  createdById?: string | null;
};

export async function createStaffUser(input: CreateStaffUserInput) {
  const contactEmail = await validateEmailDeliverableOrThrow(input.contactEmail);
  const name = input.name?.trim() || `${input.firstName.trim()} ${input.lastName.trim()}`.trim();

  let companySlug = "platform";
  if (input.companyId) {
    const company = await prisma.company.findUnique({
      where: { id: input.companyId },
      select: { slug: true },
    });
    if (!company) throw new Error("Company not found");
    companySlug = company.slug;
  }

  const username = await generateUsername(input.firstName, input.lastName, companySlug);
  assertUsernameNotContactEmail(username, contactEmail);

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
  hourlyRate?: number;
  overtimeRate?: number;
};

export async function createEmployeeProfile(input: CreateEmployeeProfileInput) {
  const contactEmail = await validateEmailDeliverableOrThrow(input.contactEmail);
  const name = input.name?.trim() || `${input.firstName.trim()} ${input.lastName.trim()}`.trim();

  let companySlug = "company";
  if (input.companyId) {
    const company = await prisma.company.findUnique({
      where: { id: input.companyId },
      select: { slug: true },
    });
    companySlug = company?.slug ?? companySlug;
  }

  const username = await generateUsername(input.firstName, input.lastName, companySlug);
  assertUsernameNotContactEmail(username, contactEmail);

  const existingContact = await prisma.employee.findUnique({
    where: { contactEmail },
    select: { id: true },
  });
  if (existingContact) {
    throw new Error("An employee profile with this contact email already exists.");
  }

  return prisma.employee.create({
    data: {
      employeeCode: input.employeeCode,
      username,
      contactEmail,
      name,
      companyId: input.companyId,
      hourlyRate: input.hourlyRate ?? 28,
      overtimeRate: input.overtimeRate ?? 42,
      isApproved: input.isApproved ?? false,
    },
  });
}

export async function resolveCompanySlug(companyId: string | null): Promise<string> {
  if (!companyId) return "platform";
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { slug: true },
  });
  return company?.slug ?? "company";
}

export { splitDisplayName, normalizeContactEmail };
