import { addDays, startOfDay } from "date-fns";
import { isValidFourteenDayWindow, PAY_PERIOD_DAYS } from "@/lib/pay-period-utils";
import type { PayPeriodProvisionType } from "@/lib/company-timezones";

export function defaultBiweeklyPayPeriodWindow(from = new Date()): { start: Date; end: Date } {
  const start = startOfDay(from);
  const end = addDays(start, PAY_PERIOD_DAYS - 1);
  return { start, end };
}

export function resolvePayPeriodWindow(
  type: PayPeriodProvisionType,
  customStart?: string,
  customEnd?: string
): { start: Date; end: Date } | { error: string } {
  if (type === "biweekly") {
    return defaultBiweeklyPayPeriodWindow();
  }
  if (!customStart?.trim() || !customEnd?.trim()) {
    return { error: "Custom pay period requires start and end dates." };
  }
  const start = startOfDay(new Date(customStart));
  const end = startOfDay(new Date(customEnd));
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return { error: "Invalid pay period dates." };
  }
  if (end < start) {
    return { error: "Pay period end date must be on or after the start date." };
  }
  if (!isValidFourteenDayWindow(start, end)) {
    return {
      error: `Custom pay period must span exactly ${PAY_PERIOD_DAYS} calendar days (inclusive).`,
    };
  }
  return { start, end };
}
