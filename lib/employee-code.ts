import type { PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const CODE_RE = /^EMP(\d+)$/i;

export function normalizeEmployeeCode(raw: string) {
  return raw.trim().toUpperCase();
}

export function isValidEmployeeCodeFormat(code: string) {
  return CODE_RE.test(code.trim());
}

/** Next sequential EMP001, EMP002, … */
export async function nextEmployeeCode(db: Pick<PrismaClient, "employee"> = prisma) {
  const rows = await db.employee.findMany({ select: { employeeCode: true } });
  let max = 0;
  for (const r of rows) {
    const m = CODE_RE.exec(r.employeeCode);
    if (m) max = Math.max(max, parseInt(m[1]!, 10));
  }
  return `EMP${String(max + 1).padStart(3, "0")}`;
}

export function normalizeEmployeeEmail(raw: string) {
  return raw.trim().toLowerCase();
}
