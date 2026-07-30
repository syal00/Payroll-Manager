/**
 * Idempotent: upserts demo admin users only (no wipe).
 * Run after `prisma migrate deploy` on fresh DBs (e.g. Vercel) so /login works.
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { DEMO_ADMIN_PASSWORD, DEMO_CREDENTIALS } from "../lib/demo-credentials";
import { generateUsername } from "../lib/username-generator";
import { splitDisplayName } from "../lib/email-deliverable";

const prisma = new PrismaClient();

async function backfillMissingUsernames() {
  const users = await prisma.$queryRaw<
    { id: string; name: string; contact_email: string; company_id: string | null }[]
  >`SELECT id, name, contact_email, company_id FROM "User" WHERE username IS NULL`;

  for (const user of users) {
    const { firstName, lastName } = splitDisplayName(user.name);
    let slug = "platform";
    if (user.company_id) {
      const company = await prisma.company.findUnique({
        where: { id: user.company_id },
        select: { slug: true },
      });
      slug = company?.slug ?? slug;
    }
    const username = await generateUsername(firstName, lastName, slug);
    await prisma.user.update({ where: { id: user.id }, data: { username } });
  }

  const employees = await prisma.$queryRaw<
    { id: string; name: string; contact_email: string; company_id: string | null }[]
  >`SELECT id, name, contact_email, company_id FROM "Employee" WHERE username IS NULL`;

  for (const employee of employees) {
    const { firstName, lastName } = splitDisplayName(employee.name);
    let slug = "company";
    if (employee.company_id) {
      const company = await prisma.company.findUnique({
        where: { id: employee.company_id },
        select: { slug: true },
      });
      slug = company?.slug ?? slug;
    }
    const username = await generateUsername(firstName, lastName, slug);
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
      username: DEMO_CREDENTIALS.admin.username,
      contactEmail: DEMO_CREDENTIALS.admin.contactEmail,
      role: "MAIN_ADMIN" as const,
    },
    {
      name: "Payroll Manager",
      username: DEMO_CREDENTIALS.manager.username,
      contactEmail: DEMO_CREDENTIALS.manager.contactEmail,
      role: "MANAGER" as const,
    },
  ] as const;

  const primary = await prisma.user.upsert({
    where: { username: admins[0]!.username },
    create: {
      username: admins[0]!.username,
      contactEmail: admins[0]!.contactEmail,
      passwordHash,
      name: admins[0]!.name,
      role: admins[0]!.role,
      companyId: syalOperations.id,
    },
    update: {
      passwordHash,
      contactEmail: admins[0]!.contactEmail,
      name: admins[0]!.name,
      role: admins[0]!.role,
      companyId: syalOperations.id,
    },
  });

  await prisma.user.upsert({
    where: { username: admins[1]!.username },
    create: {
      username: admins[1]!.username,
      contactEmail: admins[1]!.contactEmail,
      passwordHash,
      name: admins[1]!.name,
      role: admins[1]!.role,
      companyId: syalOperations.id,
      createdById: primary.id,
    },
    update: {
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
    admins.map((x) => `${x.username} (${x.contactEmail})`).join(", ")
  );
}

main()
  .catch((e) => {
    console.error("[ensure-demo-admins]", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
