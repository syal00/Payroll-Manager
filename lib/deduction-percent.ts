import { z } from "zod";

export const DEDUCTION_PERCENT_MIN = 0;
export const DEDUCTION_PERCENT_MAX = 100;

export const deductionPercentSchema = z
  .number()
  .min(DEDUCTION_PERCENT_MIN)
  .max(DEDUCTION_PERCENT_MAX);

export const DEDUCTION_PERCENT_VALIDATION_MESSAGE =
  "Enter a deduction rate from 0 to 100 (0 = no deductions).";

/** Parse admin deduction % input — allows 0–100, supports comma decimals. */
export function parseDeductionPercentInput(raw: string): number | undefined {
  const t = raw.trim().replace(/\s/g, "").replace(/%$/, "");
  if (!t) return undefined;
  let normalized: string;
  if (t.includes(",") && !t.includes(".")) {
    normalized = t.replace(",", ".");
  } else {
    normalized = t.replace(/,/g, "");
  }
  const n = parseFloat(normalized);
  if (!Number.isFinite(n) || n < DEDUCTION_PERCENT_MIN || n > DEDUCTION_PERCENT_MAX) {
    return undefined;
  }
  return Math.round(n * 100) / 100;
}

export function deductionAmountFromPercent(grossPay: number, percent: number): number {
  return Math.round(grossPay * (percent / 100) * 100) / 100;
}
