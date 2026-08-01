/**
 * Copy existing Syal Operations employees into Unison Security with new employee codes
 * but the same login (shared User). Safe to run multiple times.
 *
 * Usage: npx tsx scripts/backfill-mirror-employees.ts
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const SOURCE_SLUG = process.env.COMPANY_MIRROR_SOURCE_SLUG?.trim() || "syal-operations";
const TARGET_SLUG = process.env.COMPANY_MIRROR_TARGET_SLUG?.trim() || "unison-security";
const CODE_RE = /^EMP(\d+)$/i;

const prisma = new PrismaClient();

async function nextEmployeeCode() {
  for (let attempt = 0; attempt < 10; attempt++) {
    const rows = await prisma.employee.findMany({ select: { employeeCode: true } });
    let max = 0;
    for (const r of rows) {
      const m = CODE_RE.exec(r.employeeCode);
      if (m) max = Math.max(max, parseInt(m[1]!, 10));
    }
    const candidate = `EMP${String(max + 1).padStart(3, "0")}`;
    const exists = await prisma.employee.findUnique({
      where: { employeeCode: candidate },
      select: { id: true },
    });
    if (!exists) return candidate;
  }
  throw new Error("Could not allocate a unique employee code.");
}

async function mirrorOne(sourceId: string, sourceCompanyId: string, targetCompanyId: string) {
  const source = await prisma.employee.findUnique({
    where: { id: sourceId },
    select: {
      id: true,
      username: true,
      contactEmail: true,
      name: true,
      userId: true,
      isApproved: true,
      emailVerified: true,
      hourlyRate: true,
      overtimeRate: true,
      department: true,
      jobTitle: true,
      deletedAt: true,
      companyId: true,
    },
  });
  if (!source?.companyId || source.companyId !== sourceCompanyId || source.deletedAt) {
    return { mirrored: false as const };
  }

  const existingMirror = await prisma.employee.findFirst({
    where: {
      companyId: targetCompanyId,
      OR: [{ mirroredFromEmployeeId: source.id }, { contactEmail: source.contactEmail }],
    },
    select: { employeeCode: true },
  });
  if (existingMirror) {
    return { mirrored: false as const, employeeCode: existingMirror.employeeCode };
  }

  const employeeCode = await nextEmployeeCode();
  await prisma.employee.create({
    data: {
      employeeCode,
      username: source.username,
      contactEmail: source.contactEmail,
      name: source.name,
      companyId: targetCompanyId,
      userId: source.userId,
      isApproved: source.isApproved,
      emailVerified: source.emailVerified,
      hourlyRate: source.hourlyRate,
      overtimeRate: source.overtimeRate,
      department: source.department,
      jobTitle: source.jobTitle,
      mirroredFromEmployeeId: source.id,
    },
  });
  return { mirrored: true as const, employeeCode };
}

async function main() {
  const [source, target] = await Promise.all([
    prisma.company.findUnique({ where: { slug: SOURCE_SLUG }, select: { id: true, name: true } }),
    prisma.company.findUnique({ where: { slug: TARGET_SLUG }, select: { id: true, name: true } }),
  ]);

  if (!source || !target) {
    console.log(`[backfill-mirror] Need both "${SOURCE_SLUG}" and "${TARGET_SLUG}" companies.`);
    return;
  }

  const employees = await prisma.employee.findMany({
    where: { companyId: source.id, deletedAt: null },
    select: { id: true, employeeCode: true, name: true },
    orderBy: { employeeCode: "asc" },
  });

  let mirrored = 0;
  let skipped = 0;

  for (const emp of employees) {
    const result = await mirrorOne(emp.id, source.id, target.id);
    if (result.mirrored) {
      mirrored++;
      console.log(`[backfill-mirror] ${emp.employeeCode} ${emp.name} → ${result.employeeCode}`);
    } else {
      skipped++;
    }
  }

  console.log(`[backfill-mirror] Done. Mirrored ${mirrored}, skipped ${skipped}.`);
}

main()
  .catch((e) => {
    console.error("[backfill-mirror]", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
