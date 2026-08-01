import type { DayEntryInput } from "@/lib/timesheet-math";
import { utcDateKey } from "@/lib/pay-period-utils";

/** Calendar day in UTC (YYYY-MM-DD) for a stored DB timestamp. */
export function workDateUtcKey(workDate: Date | string): string {
  return utcDateKey(new Date(workDate));
}

export function entryHasLoggedHours(entry: DayEntryInput): boolean {
  const r = Number(entry.regularHours) || 0;
  const o = Number(entry.overtimeHours) || 0;
  const l = Number(entry.leaveHours) || 0;
  return r + o + l > 0;
}

/**
 * Enforces no future dates and no entries older than 90 days (UTC calendar).
 */
export function validateTimesheetWorkDatePolicy(workDate: Date | string): string | null {
  const workKey = workDateUtcKey(workDate);
  const todayKey = utcDateKey(new Date());
  if (workKey > todayKey) {
    return "Cannot log hours for a future date.";
  }
  const today = new Date();
  const cutoff = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - 90)
  );
  const cutoffKey = utcDateKey(cutoff);
  if (workKey < cutoffKey) {
    return "Cannot log hours more than 90 days in the past.";
  }
  return null;
}

/** Skips empty day rows so open pay periods with future dates can still be saved. */
export function validateTimesheetWorkDatePolicyForEntry(
  workDate: Date | string,
  entry: DayEntryInput
): string | null {
  if (!entryHasLoggedHours(entry)) return null;
  return validateTimesheetWorkDatePolicy(workDate);
}
