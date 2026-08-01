/**
 * Removes all employees (and related payroll data) from the target company (Unison Security).
 * Syal Operations is untouched. Shared User logins are kept if Syal employees still use them.
 *
 * Usage: npx tsx scripts/clear-unison-mirror-data.ts
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const TARGET_SLUG = process.env.COMPANY_MIRROR_TARGET_SLUG?.trim() || "unison-security";

const prisma = new PrismaClient();

async function deleteEmployeePayrollData(employeeId: string) {
  const payslipIds = (
    await prisma.payslip.findMany({ where: { employeeId }, select: { id: true } })
  ).map((p) => p.id);
  if (payslipIds.length > 0) {
    await prisma.payslipItem.deleteMany({ where: { payslipId: { in: payslipIds } } });
    await prisma.payslip.deleteMany({ where: { id: { in: payslipIds } } });
  }

  const timesheetIds = (
    await prisma.timesheet.findMany({ where: { employeeId }, select: { id: true } })
  ).map((t) => t.id);
  if (timesheetIds.length > 0) {
    await prisma.approval.deleteMany({ where: { timesheetId: { in: timesheetIds } } });
    await prisma.timesheetEntry.deleteMany({ where: { timesheetId: { in: timesheetIds } } });
    await prisma.timesheet.deleteMany({ where: { id: { in: timesheetIds } } });
  }
}

async function main() {
  const target = await prisma.company.findUnique({
    where: { slug: TARGET_SLUG },
    select: { id: true, name: true, slug: true },
  });

  if (!target) {
    console.log(`[clear-unison-mirror] No company with slug "${TARGET_SLUG}". Nothing to do.`);
    return;
  }

  const payPeriods = await prisma.payPeriod.findMany({
    where: { companyId: target.id },
    select: { id: true, name: true },
  });

  const employeeRows = await prisma.employee.findMany({
    where: { companyId: target.id },
    select: { id: true, userId: true, name: true, employeeCode: true },
  });

  if (payPeriods.length === 0 && employeeRows.length === 0) {
    console.log(`[clear-unison-mirror] ${target.name} already has no employees or pay periods.`);
    return;
  }

  for (const pp of payPeriods) {
    const payslipIds = (
      await prisma.payslip.findMany({ where: { payPeriodId: pp.id }, select: { id: true } })
    ).map((p) => p.id);
    if (payslipIds.length > 0) {
      await prisma.payslipItem.deleteMany({ where: { payslipId: { in: payslipIds } } });
      await prisma.payslip.deleteMany({ where: { id: { in: payslipIds } } });
    }
    await prisma.payPeriod.delete({ where: { id: pp.id } });
    console.log(`[clear-unison-mirror] Deleted pay period: ${pp.name ?? pp.id}`);
  }

  for (const emp of employeeRows) {
    await deleteEmployeePayrollData(emp.id);
    await prisma.employee.delete({ where: { id: emp.id } });
    console.log(`[clear-unison-mirror] Deleted ${emp.employeeCode} ${emp.name}`);
  }

  console.log(
    `[clear-unison-mirror] Removed ${employeeRows.length} employee(s) from ${target.name}. Syal Operations unchanged.`
  );
}

main()
  .catch((e) => {
    console.error("[clear-unison-mirror]", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
