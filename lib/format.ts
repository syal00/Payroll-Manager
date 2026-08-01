export function money(n: number) {
  return n.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

export function shortDate(d: string | Date) {
  const x = typeof d === "string" ? new Date(d) : d;
  return x.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Date-only fields (pay periods, timesheet rows) — avoids timezone shifting the displayed day. */
export function shortCalendarDate(d: string | Date) {
  const key =
    typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d.trim())
      ? d.trim()
      : (() => {
          const x = typeof d === "string" ? new Date(d) : d;
          const y = x.getUTCFullYear();
          const m = x.getUTCMonth() + 1;
          const day = x.getUTCDate();
          return `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        })();
  const [y, m, day] = key.split("-").map(Number);
  const x = new Date(Date.UTC(y!, m! - 1, day!));
  return x.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Consistent pay-period label for tables and lists (ignores ad-hoc placeholder names). */
export function formatPayPeriodLabel(period: {
  name?: string | null;
  startDate: string | Date;
  endDate: string | Date;
}): string {
  const range = `${shortCalendarDate(period.startDate)} – ${shortCalendarDate(period.endDate)}`;
  const name = period.name?.trim();
  if (!name) return range;
  if (/^Period ending /i.test(name)) return name;
  return range;
}

export function formatDateTime(d: string | Date) {
  const x = typeof d === "string" ? new Date(d) : d;
  return x.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Human-readable audit / action code for charts and tables. */
export function formatAuditAction(action: string): string {
  return action
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

import { parsePayRateInput } from "@/lib/pay-rates";

/**
 * @deprecated Use {@link parsePayRateInput} from `@/lib/pay-rates`.
 */
export function parsePositiveRateInput(raw: string): number | undefined {
  return parsePayRateInput(raw);
}
