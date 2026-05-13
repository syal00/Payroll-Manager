/**
 * Idempotent: upserts demo admin users only (no wipe).
 * Run after `prisma migrate deploy` on fresh DBs (e.g. Vercel) so /login works.
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { DEMO_ADMIN_PASSWORD, DEMO_CREDENTIALS } from "../lib/demo-credentials";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_ADMIN_PASSWORD, 12);
  const admins = [
    { name: "Operations Admin", email: DEMO_CREDENTIALS.admin.email, role: "MAIN_ADMIN" as const },
    { name: "Payroll Manager", email: DEMO_CREDENTIALS.manager.email, role: "MANAGER" as const },
  ] as const;

  const primary = await prisma.user.upsert({
    where: { email: admins[0]!.email },
    create: {
      email: admins[0]!.email,
      passwordHash,
      name: admins[0]!.name,
      role: admins[0]!.role,
    },
    update: {
      passwordHash,
      name: admins[0]!.name,
      role: admins[0]!.role,
    },
  });

  await prisma.user.upsert({
    where: { email: admins[1]!.email },
    create: {
      email: admins[1]!.email,
      passwordHash,
      name: admins[1]!.name,
      role: admins[1]!.role,
      createdById: primary.id,
    },
    update: {
      passwordHash,
      name: admins[1]!.name,
      role: admins[1]!.role,
      createdById: primary.id,
    },
  });

  console.log("[ensure-demo-admins] OK:", admins.map((x) => x.email).join(", "));
}

main()
  .catch((e) => {
    console.error("[ensure-demo-admins]", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
