/**
 * Upsert a staff account for a company by slug.
 *
 * Usage: npx tsx scripts/create-company-staff.ts <companySlug> <contactEmail> <password> [role] [name]
 * Example: npx tsx scripts/create-company-staff.ts syal-operations syalrakesh00@gmail.com syal9878 MAIN_ADMIN "Rakesh Test"
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { loginUsernameFromContactEmail, normalizeContactEmail } from "../lib/display-name";

const prisma = new PrismaClient();

const STAFF_ROLES = new Set(["MAIN_ADMIN", "MANAGER", "SUPERVISOR"]);

async function main() {
  const [companySlug, contactEmailRaw, password, roleArg, nameArg] = process.argv.slice(2);
  if (!companySlug || !contactEmailRaw || !password) {
    console.error(
      "Usage: npx tsx scripts/create-company-staff.ts <companySlug> <contactEmail> <password> [role] [name]"
    );
    process.exit(1);
  }
  if (password.length < 8) {
    console.error("Password must be at least 8 characters.");
    process.exit(1);
  }

  const role = (roleArg?.trim().toUpperCase() || "MAIN_ADMIN") as string;
  if (!STAFF_ROLES.has(role)) {
    console.error(`Role must be one of: ${[...STAFF_ROLES].join(", ")}`);
    process.exit(1);
  }

  const company = await prisma.company.findUnique({ where: { slug: companySlug.trim().toLowerCase() } });
  if (!company) {
    console.error(`Company not found for slug: ${companySlug}`);
    process.exit(1);
  }

  const contactEmail = normalizeContactEmail(contactEmailRaw);
  const username = loginUsernameFromContactEmail(contactEmail);
  const name = nameArg?.trim() || contactEmail.split("@")[0] || "Staff User";
  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { contactEmail },
    create: {
      username,
      contactEmail,
      passwordHash,
      name,
      role,
      companyId: company.id,
      mustChangePassword: false,
      deletedAt: null,
    },
    update: {
      username,
      passwordHash,
      name,
      role,
      companyId: company.id,
      mustChangePassword: false,
      deletedAt: null,
      totpEnabled: false,
      totpSecretEnc: null,
    },
  });

  console.log(
    `[create-company-staff] OK: ${company.name} (${company.slug}) — login=${user.username} role=${user.role}`
  );
}

main()
  .catch((e) => {
    console.error("[create-company-staff]", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
