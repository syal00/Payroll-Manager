import "server-only";

import { prisma } from "@/lib/prisma";
import { findPayPeriodByWindow } from "@/lib/pay-period-company";
import { nextEmployeeCode } from "@/lib/employee-code";
import type { Prisma } from "@prisma/client";

/** Source tenant — records are created here. */
export const COMPANY_MIRROR_SOURCE_SLUG =
  process.env.COMPANY_MIRROR_SOURCE_SLUG?.trim() || "syal-operations";

/** Target tenant — sees and receives mirrored payroll data from the source. */
export const COMPANY_MIRROR_TARGET_SLUG =
  process.env.COMPANY_MIRROR_TARGET_SLUG?.trim() || "unison-security";

type MirrorPair = {
  sourceId: string;
  targetId: string;
  sourceSlug: string;
  targetSlug: string;
};

let cachedPair: MirrorPair | null | undefined;

/** Set to `false` to stop Unison (target) from seeing Syal (source) data — useful while testing. */
function isCompanyMirrorEnabled(): boolean {
  const v = process.env.COMPANY_MIRROR_ENABLED?.trim().toLowerCase();
  return v !== "false" && v !== "0" && v !== "no";
}

async function loadMirrorPair(): Promise<MirrorPair | null> {
  if (cachedPair !== undefined) return cachedPair;

  if (!isCompanyMirrorEnabled()) {
    cachedPair = null;
    return null;
  }

  const [source, target] = await Promise.all([
    prisma.company.findUnique({
      where: { slug: COMPANY_MIRROR_SOURCE_SLUG },
      select: { id: true, slug: true, name: true },
    }),
    prisma.company.findUnique({
      where: { slug: COMPANY_MIRROR_TARGET_SLUG },
      select: { id: true, slug: true, name: true },
    }),
  ]);

  if (!source || !target || source.id === target.id) {
    cachedPair = null;
    return null;
  }

  cachedPair = {
    sourceId: source.id,
    targetId: target.id,
    sourceSlug: source.slug,
    targetSlug: target.slug,
  };
  return cachedPair;
}

export function invalidateCompanyMirrorCache(): void {
  cachedPair = undefined;
}

/** Company IDs whose employees are visible in this tenant's admin portal. */
export async function getEmployeeVisibilityCompanyIds(viewerCompanyId: string): Promise<string[]> {
  // Each company has its own employee rows (mirrored from source with separate employee codes).
  return [viewerCompanyId];
}

export async function getMirrorTargetCompanyId(sourceCompanyId: string): Promise<string | null> {
  const pair = await loadMirrorPair();
  if (!pair || pair.sourceId !== sourceCompanyId) return null;
  return pair.targetId;
}

export async function getCompanyMirrorStatus(): Promise<{
  active: boolean;
  source: { id: string; slug: string; name: string } | null;
  target: { id: string; slug: string; name: string } | null;
}> {
  const [pair, sourceRow, targetRow] = await Promise.all([
    loadMirrorPair(),
    prisma.company.findUnique({
      where: { slug: COMPANY_MIRROR_SOURCE_SLUG },
      select: { id: true, slug: true, name: true },
    }),
    prisma.company.findUnique({
      where: { slug: COMPANY_MIRROR_TARGET_SLUG },
      select: { id: true, slug: true, name: true },
    }),
  ]);

  return {
    active: pair != null,
    source: sourceRow,
    target: targetRow,
  };
}

export function companyIdFilter(companyIds: string[]): Prisma.EmployeeWhereInput {
  if (companyIds.length === 1) return { companyId: companyIds[0]! };
  return { companyId: { in: companyIds } };
}

export function payPeriodCompanyIdFilter(companyIds: string[]): Prisma.PayPeriodWhereInput {
  if (companyIds.length === 1) return { companyId: companyIds[0]! };
  return { companyId: { in: companyIds } };
}

/** After creating a pay period in the source company, mirror it to the linked target. */
export async function mirrorPayPeriodToTargetCompany(input: {
  sourceCompanyId: string;
  name: string | null;
  startDate: Date;
  endDate: Date;
  status: string;
  isCurrent: boolean;
}): Promise<{ mirrored: boolean; payPeriodId?: string }> {
  const targetCompanyId = await getMirrorTargetCompanyId(input.sourceCompanyId);
  if (!targetCompanyId) return { mirrored: false };

  const existing = await findPayPeriodByWindow(
    prisma,
    targetCompanyId,
    input.startDate,
    input.endDate
  );
  if (existing) return { mirrored: false };

  const created = await prisma.$transaction(async (tx) => {
    if (input.isCurrent) {
      await tx.payPeriod.updateMany({
        where: { companyId: targetCompanyId, isCurrent: true },
        data: { isCurrent: false },
      });
    }
    return tx.payPeriod.create({
      data: {
        companyId: targetCompanyId,
        name: input.name,
        startDate: input.startDate,
        endDate: input.endDate,
        status: input.status,
        isCurrent: input.isCurrent,
      },
    });
  });

  return { mirrored: true, payPeriodId: created.id };
}

const mirrorEmployeeSelect = {
  id: true,
  companyId: true,
  employeeCode: true,
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
} as const;

/** Create a separate employee profile in the target company (new employee code, same login user). */
export async function mirrorEmployeeToTargetCompany(
  sourceEmployeeId: string
): Promise<{ mirrored: boolean; employeeId?: string; employeeCode?: string }> {
  const pair = await loadMirrorPair();
  if (!pair) return { mirrored: false };

  const source = await prisma.employee.findUnique({
    where: { id: sourceEmployeeId },
    select: mirrorEmployeeSelect,
  });
  if (!source?.companyId || source.companyId !== pair.sourceId || source.deletedAt) {
    return { mirrored: false };
  }

  const existingMirror = await prisma.employee.findFirst({
    where: {
      companyId: pair.targetId,
      OR: [{ mirroredFromEmployeeId: source.id }, { contactEmail: source.contactEmail }],
    },
    select: { id: true, employeeCode: true },
  });
  if (existingMirror) {
    return { mirrored: false, employeeId: existingMirror.id, employeeCode: existingMirror.employeeCode };
  }

  const employeeCode = await nextEmployeeCode();
  const created = await prisma.employee.create({
    data: {
      employeeCode,
      username: source.username,
      contactEmail: source.contactEmail,
      name: source.name,
      companyId: pair.targetId,
      userId: source.userId,
      isApproved: source.isApproved,
      emailVerified: source.emailVerified,
      hourlyRate: source.hourlyRate,
      overtimeRate: source.overtimeRate,
      department: source.department,
      jobTitle: source.jobTitle,
      mirroredFromEmployeeId: source.id,
    },
    select: { id: true, employeeCode: true },
  });

  return { mirrored: true, employeeId: created.id, employeeCode: created.employeeCode };
}

/** Link the same login user on source + all mirrored employee profiles. */
export async function syncEmployeeLoginAcrossMirror(employeeId: string, userId: string): Promise<void> {
  const pair = await loadMirrorPair();
  if (!pair) return;

  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: { id: true, mirroredFromEmployeeId: true },
  });
  if (!employee) return;

  const sourceId = employee.mirroredFromEmployeeId ?? employee.id;
  await prisma.employee.updateMany({
    where: {
      OR: [{ id: sourceId }, { mirroredFromEmployeeId: sourceId }],
    },
    data: { userId },
  });
}

/** Keep target copy in sync when source approval status changes. */
export async function syncMirroredEmployeeApproval(
  sourceEmployeeId: string,
  isApproved: boolean
): Promise<void> {
  const pair = await loadMirrorPair();
  if (!pair) return;

  await prisma.employee.updateMany({
    where: { mirroredFromEmployeeId: sourceEmployeeId },
    data: { isApproved },
  });
}

/** Remove mirrored copies when a pending source registration is rejected. */
export async function deleteMirroredEmployeesForSource(sourceEmployeeId: string): Promise<string[]> {
  const pair = await loadMirrorPair();
  if (!pair) return [];

  const mirrors = await prisma.employee.findMany({
    where: { mirroredFromEmployeeId: sourceEmployeeId },
    select: { id: true },
  });
  if (mirrors.length === 0) return [];

  await prisma.employee.deleteMany({
    where: { mirroredFromEmployeeId: sourceEmployeeId },
  });
  return mirrors.map((m) => m.id);
}
