/**
 * Point tenant logos at committed files under public/logos/ so Vercel serves them.
 * Uploaded paths (/uploads/logos/*) are local-only and 404 in production.
 *
 * Usage: npx tsx scripts/ensure-company-logos.ts
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/** slug → path under public/ (must be committed to git). */
const COMMITTED_LOGOS: Record<string, string> = {
  "unison-security": "/logos/unison-security.png",
  "syal-operations": "/logo.png",
};

async function main() {
  for (const [slug, logoUrl] of Object.entries(COMMITTED_LOGOS)) {
    const company = await prisma.company.findUnique({ where: { slug }, select: { id: true, name: true, logoUrl: true } });
    if (!company) {
      console.log(`[ensure-company-logos] skip — no company for slug "${slug}"`);
      continue;
    }
    if (company.logoUrl === logoUrl) {
      console.log(`[ensure-company-logos] OK (unchanged): ${company.name} → ${logoUrl}`);
      continue;
    }
    await prisma.company.update({ where: { id: company.id }, data: { logoUrl } });
    console.log(`[ensure-company-logos] updated: ${company.name} ${company.logoUrl ?? "(none)"} → ${logoUrl}`);
  }
}

main()
  .catch((e) => {
    console.error("[ensure-company-logos]", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
