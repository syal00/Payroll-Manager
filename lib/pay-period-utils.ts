import { differenceInCalendarDays } from "date-fns";

export const PAY_PERIOD_DAYS = 14;

export function isValidFourteenDayWindow(start: Date, end: Date): boolean {
  const inclusiveDays = differenceInCalendarDays(end, start) + 1;
  return inclusiveDays === PAY_PERIOD_DAYS;
}
