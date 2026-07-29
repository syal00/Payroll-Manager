/**
 * Backfill login usernames for existing User/Employee rows after the username/contact_email migration.
 * Safe to run repeatedly — only fills rows where username IS NULL.
 *
 * Run: npx tsx scripts/backfill-usernames.ts
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { generateUsername } from "../lib/username-generator";
import { splitDisplayName } from "../lib/email-deliverable";

const prisma = new PrismaClient();

type BackfillRow = {
  id: string;
  name: string;
  contactEmail: string;
  companyId: string | null;
};

async function backfillUsers() {
  const users = await prisma.$queryRaw<BackfillRow[]>`
    SELECT id, name, contact_email AS "contactEmail", company_id AS "companyId"
    FROM "User"
    WHERE username IS NULL
  `;

  for (const user of users) {
    const { firstName, lastName } = splitDisplayName(user.name);
    let slug = "platform";
    if (user.companyId) {
      const company = await prisma.company.findUnique({
        where: { id: user.companyId },
        select: { slug: true },
      });
      slug = company?.slug ?? slug;
    }
    const username = await generateUsername(firstName, lastName, slug);
    await prisma.user.update({ where: { id: user.id }, data: { username } });
    console.log(`[backfill-usernames] User ${user.contactEmail} → ${username}`);
  }
}

async function backfillEmployees() {
  const employees = await prisma.$queryRaw<BackfillRow[]>`
    SELECT id, name, contact_email AS "contactEmail", company_id AS "companyId"
    FROM "Employee"
    WHERE username IS NULL
  `;

  for (const employee of employees) {
    const { firstName, lastName } = splitDisplayName(employee.name);
    let slug = "company";
    if (employee.companyId) {
      const company = await prisma.company.findUnique({
        where: { id: employee.companyId },
        select: { slug: true },
      });
      slug = company?.slug ?? slug;
    }
    const username = await generateUsername(firstName, lastName, slug);
    await prisma.employee.update({ where: { id: employee.id }, data: { username } });
    console.log(`[backfill-usernames] Employee ${employee.contactEmail} → ${username}`);
  }
}

async function main() {
  await backfillUsers();
  await backfillEmployees();
  console.log("[backfill-usernames] Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
