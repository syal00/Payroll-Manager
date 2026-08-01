import { z } from "zod";

export const PAY_RATE_MIN = 0;
export const PAY_RATE_MAX = 100;

export const payRateSchema = z.number().min(PAY_RATE_MIN).max(PAY_RATE_MAX);

export const PAY_RATE_VALIDATION_MESSAGE =
  "Enter a rate from 0 to 100 (e.g. 25.50, 0, or 37,5).";

/** Parse admin pay-rate input — allows 0–100, supports comma decimals. */
export function parsePayRateInput(raw: string): number | undefined {
  const t = raw.trim().replace(/\s/g, "");
  if (!t) return undefined;
  let normalized: string;
  if (t.includes(",") && !t.includes(".")) {
    normalized = t.replace(",", ".");
  } else {
    normalized = t.replace(/,/g, "");
  }
  const n = parseFloat(normalized);
  if (!Number.isFinite(n) || n < PAY_RATE_MIN || n > PAY_RATE_MAX) return undefined;
  return Math.round(n * 10000) / 10000;
}
