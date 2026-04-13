const YMD = /^\d{4}-\d{2}-\d{2}$/;

/** UTC calendar date string YYYY-MM-DD (stable vs server local timezone). */
export function utcDateKey(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Normalize client payload: plain YYYY-MM-DD or ISO timestamp → UTC YYYY-MM-DD. */
export function normalizeClientWorkDate(raw: string): string | null {
  const s = raw.trim();
  if (YMD.test(s)) return s;
  const t = Date.parse(s);
  if (Number.isNaN(t)) return null;
  return utcDateKey(new Date(t));
}

type EntryPayload = { workDate: string; regularHours: number; overtimeHours: number; leaveHours: number };

/**
 * Validates submitted rows against the timesheet rows already in the DB (order: workDate asc).
 * Avoids eachDayOfInterval + UTC mismatches on non-UTC servers.
 */
export function validateTimesheetRowsAgainstPeriod(
  entries: EntryPayload[],
  sortedExisting: { workDate: Date | string }[]
): { ok: true; dayCount: number } | { ok: false; status: number; error: string } {
  const n = sortedExisting.length;
  if (n === 0) {
    return { ok: false, status: 400, error: "Timesheet has no day rows. Reload the page." };
  }
  if (entries.length !== n) {
    return {
      ok: false,
      status: 400,
      error: `This timesheet has ${n} day row(s); your form has ${entries.length}. Reload the page and try again.`,
    };
  }
  for (let i = 0; i < n; i++) {
    const expectedKey = utcDateKey(new Date(sortedExisting[i]!.workDate));
    const rowKey = normalizeClientWorkDate(entries[i]!.workDate);
    if (!rowKey || rowKey !== expectedKey) {
      return {
        ok: false,
        status: 400,
        error: "Entries must align with pay period dates. Reload the page and try again.",
      };
    }
  }
  return { ok: true, dayCount: n };
}
