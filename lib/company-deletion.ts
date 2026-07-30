import { prisma } from "@/lib/prisma";

/**
 * Hard-deletes a tenant and all scoped staff/employee payroll data.
 * Required because User.companyId cannot be NULL unless role is SUPER_ADMIN.
 */
export async function deleteCompanyAndTenantData(companyId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const employees = await tx.employee.findMany({
      where: { companyId },
      select: { id: true },
    });
    const employeeIds = employees.map((e) => e.id);

    if (employeeIds.length > 0) {
      const payslips = await tx.payslip.findMany({
        where: { employeeId: { in: employeeIds } },
        select: { id: true },
      });
      const payslipIds = payslips.map((p) => p.id);

      if (payslipIds.length > 0) {
        await tx.payslipItem.deleteMany({ where: { payslipId: { in: payslipIds } } });
        await tx.payslip.deleteMany({ where: { id: { in: payslipIds } } });
      }

      await tx.timesheet.deleteMany({ where: { employeeId: { in: employeeIds } } });
      await tx.employee.deleteMany({ where: { companyId } });
    }

    const users = await tx.user.findMany({
      where: { companyId },
      select: { id: true },
    });
    const userIds = users.map((u) => u.id);

    if (userIds.length > 0) {
      await tx.notification.deleteMany({ where: { userId: { in: userIds } } });
      await tx.approval.deleteMany({ where: { adminId: { in: userIds } } });
      await tx.user.deleteMany({ where: { companyId } });
    }

    await tx.company.delete({ where: { id: companyId } });
  });
}
