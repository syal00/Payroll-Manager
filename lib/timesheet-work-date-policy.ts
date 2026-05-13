import { utcDateKey } from "@/lib/timesheet-submit-validation";

/** Calendar day in UTC (YYYY-MM-DD) for a stored DB timestamp. */
export function workDateUtcKey(workDate: Date | string): string {
  return utcDateKey(new Date(workDate));
}

/**
 * Enforces no future dates and no entries older than 90 days (UTC calendar).
 */
export function validateTimesheetWorkDatePolicy(workDate: Date | string): string | null {
  const d = new Date(workDate);
  const todayEnd = new Date();
  todayEnd.setUTCHours(23, 59, 59, 999);
  if (d.getTime() > todayEnd.getTime()) {
    return "Cannot log hours for a future date.";
  }
  const ninetyDaysAgo = new Date(todayEnd);
  ninetyDaysAgo.setUTCDate(ninetyDaysAgo.getUTCDate() - 90);
  ninetyDaysAgo.setUTCHours(0, 0, 0, 0);
  if (d.getTime() < ninetyDaysAgo.getTime()) {
    return "Cannot log hours more than 90 days in the past.";
  }
  return null;
}
