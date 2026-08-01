import { prisma } from "@/lib/prisma";
import { PayPeriodStatus } from "@/lib/enums";
import type { PayPeriodProvisionType } from "@/lib/company-timezones";
import { resolvePayPeriodWindow } from "@/lib/pay-period-window";
import { clearCurrentPayPeriods } from "@/lib/pay-period-company";

export async function createInitialPayPeriod(input: {
  companyId: string;
  type: PayPeriodProvisionType;
  customStart?: string;
  customEnd?: string;
}) {
  const window = resolvePayPeriodWindow(input.type, input.customStart, input.customEnd);
  if ("error" in window) {
    throw new Error(window.error);
  }

  const { start, end } = window;
  const existing = await prisma.payPeriod.findFirst({
    where: { companyId: input.companyId, startDate: start, endDate: end },
  });
  if (existing) {
    await clearCurrentPayPeriods(prisma, input.companyId);
    return prisma.payPeriod.update({
      where: { id: existing.id },
      data: { isCurrent: true, status: PayPeriodStatus.OPEN },
    });
  }

  await clearCurrentPayPeriods(prisma, input.companyId);

  return prisma.payPeriod.create({
    data: {
      companyId: input.companyId,
      name: `Period ending ${end.toISOString().slice(0, 10)}`,
      startDate: start,
      endDate: end,
      status: PayPeriodStatus.OPEN,
      isCurrent: true,
    },
  });
}
