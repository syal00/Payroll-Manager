/**
 * One-off bootstrap for SUPER_ADMIN (cross-tenant, companyId: null).
 *
 * Usage: npx tsx scripts/create-super-admin.ts <contactEmail> <password> [name]
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { normalizeContactEmail, loginUsernameFromContactEmail } from "../lib/display-name";

const prisma = new PrismaClient();

async function main() {
  const [contactEmailRaw, password, nameArg] = process.argv.slice(2);
  if (!contactEmailRaw || !password) {
    console.error("Usage: npx tsx scripts/create-super-admin.ts <contactEmail> <password> [name]");
    process.exit(1);
  }
  if (password.length < 8) {
    console.error("Password must be at least 8 characters.");
    process.exit(1);
  }

  const contactEmail = normalizeContactEmail(contactEmailRaw);
  const name = nameArg?.trim() || "Super Admin";
  const username = loginUsernameFromContactEmail(contactEmail);

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.upsert({
    where: { contactEmail },
    create: {
      username,
      contactEmail,
      passwordHash,
      name,
      role: "SUPER_ADMIN",
      companyId: null,
    },
    update: {
      username,
      passwordHash,
      role: "SUPER_ADMIN",
      companyId: null,
    },
  });

  console.log(
    `[create-super-admin] OK: login=${user.username} contact=${user.contactEmail} (role=${user.role})`
  );
}

main()
  .catch((e) => {
    console.error("[create-super-admin]", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
