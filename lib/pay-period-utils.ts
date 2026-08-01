/** UTC calendar date string YYYY-MM-DD (stable vs server local timezone). */
export function utcDateKey(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function utcMidnight(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day));
}

/** Normalize a stored pay-period boundary to UTC midnight for that calendar day. */
export function normalizePayPeriodDate(d: Date): Date {
  return utcMidnight(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
}

/** Parse `<input type="date">` value (YYYY-MM-DD) as a UTC calendar date. */
export function parseCalendarDateInput(ymd: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd.trim())) return null;
  const [y, m, d] = ymd.trim().split("-").map(Number);
  if (!y || !m || !d) return null;
  const date = utcMidnight(y, m, d);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Default length when suggesting an end date or provisioning bi-weekly periods. */
export const PAY_PERIOD_DAYS = 14;

/** End date must be on or after the start date (inclusive window). */
export function isValidPayPeriodWindow(start: Date, end: Date): boolean {
  const s = normalizePayPeriodDate(start);
  const e = normalizePayPeriodDate(end);
  return e.getTime() >= s.getTime();
}

/** Inclusive list of UTC calendar days from start through end. */
export function calendarDaysInPayPeriod(start: Date, end: Date): Date[] {
  const startNorm = normalizePayPeriodDate(start);
  const endNorm = normalizePayPeriodDate(end);
  const days: Date[] = [];
  let cursor = startNorm;
  while (cursor.getTime() <= endNorm.getTime()) {
    days.push(new Date(cursor));
    cursor = utcMidnight(
      cursor.getUTCFullYear(),
      cursor.getUTCMonth() + 1,
      cursor.getUTCDate() + 1
    );
  }
  return days;
}

export function expectedPayPeriodDateKeys(start: Date, end: Date): string[] {
  return calendarDaysInPayPeriod(start, end).map(utcDateKey);
}

export function timesheetEntriesMatchPayPeriod(
  entries: { workDate: Date | string }[],
  start: Date,
  end: Date
): boolean {
  const expected = expectedPayPeriodDateKeys(start, end);
  if (entries.length !== expected.length) return false;
  const sorted = [...entries].sort(
    (a, b) => new Date(a.workDate).getTime() - new Date(b.workDate).getTime()
  );
  return sorted.every((entry, index) => utcDateKey(new Date(entry.workDate)) === expected[index]);
}

/** Local `YYYY-MM-DD` end date for a default bi-weekly window starting on `startDate`. */
export function suggestedPayPeriodEndDate(startDate: string): string {
  const start = parseCalendarDateInput(startDate);
  if (!start) return "";
  const end = utcMidnight(
    start.getUTCFullYear(),
    start.getUTCMonth() + 1,
    start.getUTCDate() + PAY_PERIOD_DAYS - 1
  );
  return utcDateKey(end);
}
