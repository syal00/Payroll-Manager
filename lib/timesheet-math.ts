/** Max hours per day (regular + overtime + leave) */
export const MAX_HOURS_PER_DAY = 16;

/** Max regular hours in one day */
export const MAX_REGULAR_PER_DAY = 12;

/** Max overtime hours in one day */
export const MAX_OVERTIME_PER_DAY = 8;

export type DayEntryInput = {
  regularHours: number;
  overtimeHours: number;
  leaveHours: number;
};

export function validateDayEntry(d: DayEntryInput): string | null {
  const r = Number(d.regularHours) || 0;
  const o = Number(d.overtimeHours) || 0;
  const l = Number(d.leaveHours) || 0;
  if (r < 0 || o < 0 || l < 0) return "Hours cannot be negative.";
  if (r > MAX_REGULAR_PER_DAY) return `Regular hours cannot exceed ${MAX_REGULAR_PER_DAY} per day.`;
  if (o > MAX_OVERTIME_PER_DAY) return `Overtime cannot exceed ${MAX_OVERTIME_PER_DAY} per day.`;
  const total = r + o + l;
  if (total > MAX_HOURS_PER_DAY)
    return `Total hours per day cannot exceed ${MAX_HOURS_PER_DAY} (regular + overtime + leave).`;
  if (total > 0 && total < 0.5) return "Hours must be between 0.5 and 16 per day when any time is logged.";
  return null;
}

export function sumEntries(
  entries: DayEntryInput[]
): { totalRegular: number; totalOvertime: number; totalLeave: number; totalHours: number } {
  let totalRegular = 0;
  let totalOvertime = 0;
  let totalLeave = 0;
  for (const e of entries) {
    totalRegular += Number(e.regularHours) || 0;
    totalOvertime += Number(e.overtimeHours) || 0;
    totalLeave += Number(e.leaveHours) || 0;
  }
  const totalHours = totalRegular + totalOvertime + totalLeave;
  return { totalRegular, totalOvertime, totalLeave, totalHours };
}
