/**
 * Idempotent: upserts demo admin users only (no wipe).
 * Run after `prisma migrate deploy` on fresh DBs (e.g. Vercel) so /login works.
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { DEMO_ADMIN_PASSWORD, DEMO_CREDENTIALS } from "../lib/demo-credentials";
import { loginUsernameFromContactEmail, normalizeContactEmail } from "../lib/display-name";

const prisma = new PrismaClient();

async function backfillMissingUsernames() {
  const users = await prisma.$queryRaw<
    { id: string; contact_email: string }[]
  >`SELECT id, contact_email FROM "User" WHERE username IS NULL`;

  for (const user of users) {
    const username = loginUsernameFromContactEmail(user.contact_email);
    await prisma.user.update({ where: { id: user.id }, data: { username } });
  }

  const employees = await prisma.$queryRaw<
    { id: string; contact_email: string }[]
  >`SELECT id, contact_email FROM "Employee" WHERE username IS NULL`;

  for (const employee of employees) {
    const username = loginUsernameFromContactEmail(employee.contact_email);
    await prisma.employee.update({ where: { id: employee.id }, data: { username } });
  }
}

async function main() {
  await backfillMissingUsernames();

  const syalOperations = await prisma.company.upsert({
    where: { slug: "syal-operations" },
    create: { name: "PayRun Demo", slug: "syal-operations", logoUrl: "/logo.png" },
    update: {},
  });

  const passwordHash = await bcrypt.hash(DEMO_ADMIN_PASSWORD, 12);
  const admins = [
    {
      name: "Operations Admin",
      contactEmail: DEMO_CREDENTIALS.admin.contactEmail,
      role: "MAIN_ADMIN" as const,
    },
    {
      name: "Payroll Manager",
      contactEmail: DEMO_CREDENTIALS.manager.contactEmail,
      role: "MANAGER" as const,
    },
  ] as const;

  const primary = await prisma.user.upsert({
    where: { contactEmail: admins[0]!.contactEmail },
    create: {
      username: normalizeContactEmail(admins[0]!.contactEmail),
      contactEmail: admins[0]!.contactEmail,
      passwordHash,
      name: admins[0]!.name,
      role: admins[0]!.role,
      companyId: syalOperations.id,
    },
    update: {
      username: normalizeContactEmail(admins[0]!.contactEmail),
      passwordHash,
      contactEmail: admins[0]!.contactEmail,
      name: admins[0]!.name,
      role: admins[0]!.role,
      companyId: syalOperations.id,
    },
  });

  await prisma.user.upsert({
    where: { contactEmail: admins[1]!.contactEmail },
    create: {
      username: normalizeContactEmail(admins[1]!.contactEmail),
      contactEmail: admins[1]!.contactEmail,
      passwordHash,
      name: admins[1]!.name,
      role: admins[1]!.role,
      companyId: syalOperations.id,
      createdById: primary.id,
    },
    update: {
      username: normalizeContactEmail(admins[1]!.contactEmail),
      passwordHash,
      contactEmail: admins[1]!.contactEmail,
      name: admins[1]!.name,
      role: admins[1]!.role,
      companyId: syalOperations.id,
      createdById: primary.id,
    },
  });

  console.log(
    "[ensure-demo-admins] OK:",
    admins.map((x) => x.contactEmail).join(", ")
  );
}

main()
  .catch((e) => {
    console.error("[ensure-demo-admins]", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
