/**
 * Backfill login usernames for existing User/Employee rows after the username/contact_email migration.
 * Safe to run repeatedly — only fills rows where username IS NULL.
 *
 * Run: npx tsx scripts/backfill-usernames.ts
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { loginUsernameFromContactEmail } from "../lib/display-name";

const prisma = new PrismaClient();

type BackfillRow = {
  id: string;
  contactEmail: string;
};

async function backfillUsers() {
  const users = await prisma.$queryRaw<BackfillRow[]>`
    SELECT id, contact_email AS "contactEmail"
    FROM "User"
    WHERE username IS NULL
  `;

  for (const user of users) {
    const username = loginUsernameFromContactEmail(user.contactEmail);
    await prisma.user.update({ where: { id: user.id }, data: { username } });
    console.log(`[backfill-usernames] User ${user.contactEmail} → ${username}`);
  }
}

async function backfillEmployees() {
  const employees = await prisma.$queryRaw<BackfillRow[]>`
    SELECT id, contact_email AS "contactEmail"
    FROM "Employee"
    WHERE username IS NULL
  `;

  for (const employee of employees) {
    const username = loginUsernameFromContactEmail(employee.contactEmail);
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
