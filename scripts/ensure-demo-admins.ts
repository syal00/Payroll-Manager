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
    { name: "Operations Admin", email: DEMO_CREDENTIALS.admin.email },
    { name: "Payroll Manager", email: DEMO_CREDENTIALS.manager.email },
  ] as const;

  for (const a of admins) {
    await prisma.user.upsert({
      where: { email: a.email },
      create: {
        email: a.email,
        passwordHash,
        name: a.name,
        role: "ADMIN",
      },
      update: {
        passwordHash,
        name: a.name,
        role: "ADMIN",
      },
    });
  }

  console.log("[ensure-demo-admins] OK:", admins.map((x) => x.email).join(", "));
}

main()
  .catch((e) => {
    console.error("[ensure-demo-admins]", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
