import type { PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const CODE_RE = /^EMP(\d+)$/i;

export function normalizeEmployeeCode(raw: string) {
  return raw.trim().toUpperCase();
}

export function isValidEmployeeCodeFormat(code: string) {
  return CODE_RE.test(code.trim());
}

/** Next sequential EMP001, EMP002, … with collision retry (safe under concurrency). */
export async function nextEmployeeCode(db: Pick<PrismaClient, "employee"> = prisma) {
  for (let attempt = 0; attempt < 10; attempt++) {
    const rows = await db.employee.findMany({ select: { employeeCode: true } });
    let max = 0;
    for (const r of rows) {
      const m = CODE_RE.exec(r.employeeCode);
      if (m) max = Math.max(max, parseInt(m[1]!, 10));
    }
    const candidate = `EMP${String(max + 1).padStart(3, "0")}`;
    const exists = await db.employee.findUnique({
      where: { employeeCode: candidate },
      select: { id: true },
    });
    if (!exists) return candidate;
  }
  throw new Error("Could not allocate a unique employee code.");
}

export function normalizeEmployeeEmail(raw: string) {
  return raw.trim().toLowerCase();
}
