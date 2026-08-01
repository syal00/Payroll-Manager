import { addDays, startOfDay } from "date-fns";
import { PAY_PERIOD_DAYS, parseCalendarDateInput, normalizePayPeriodDate } from "@/lib/pay-period-utils";
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
  const startParsed = parseCalendarDateInput(customStart.trim());
  const endParsed = parseCalendarDateInput(customEnd.trim());
  if (!startParsed || !endParsed) {
    return { error: "Invalid pay period dates." };
  }
  const start = normalizePayPeriodDate(startParsed);
  const end = normalizePayPeriodDate(endParsed);
  if (end < start) {
    return { error: "Pay period end date must be on or after the start date." };
  }
  return { start, end };
}
