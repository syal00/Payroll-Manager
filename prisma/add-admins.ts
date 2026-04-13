/**
 * Upserts the two primary admin accounts without resetting the rest of the database.
 * Run: npx tsx prisma/add-admins.ts
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const ADMINS = [
  {
    name: "Anmol Singh",
    email: "anmolchahal871@gmail.com",
    password: "Anmol0065",
  },
  {
    name: "Rakesh Syal",
    email: "syalrakesh00@gmail.com",
    password: "syal9878",
  },
];

async function main() {
  for (const a of ADMINS) {
    const passwordHash = await bcrypt.hash(a.password, 12);
    await prisma.user.upsert({
      where: { email: a.email },
      create: {
        email: a.email,
        name: a.name,
        passwordHash,
        role: "ADMIN",
      },
      update: {
        name: a.name,
        passwordHash,
        role: "ADMIN",
      },
    });
    console.log(`OK: ${a.name} <${a.email}>`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
