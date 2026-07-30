import { prisma } from "@/lib/prisma";
import { PayPeriodStatus } from "@/lib/enums";
import type { PayPeriodProvisionType } from "@/lib/company-timezones";
import { resolvePayPeriodWindow } from "@/lib/pay-period-window";

export async function createInitialPayPeriod(input: {
  type: PayPeriodProvisionType;
  customStart?: string;
  customEnd?: string;
}) {
  const window = resolvePayPeriodWindow(input.type, input.customStart, input.customEnd);
  if ("error" in window) {
    throw new Error(window.error);
  }

  const { start, end } = window;
  await prisma.payPeriod.updateMany({ data: { isCurrent: false } });

  return prisma.payPeriod.create({
    data: {
      name: `Period ending ${end.toISOString().slice(0, 10)}`,
      startDate: start,
      endDate: end,
      status: PayPeriodStatus.OPEN,
      isCurrent: true,
    },
  });
}
