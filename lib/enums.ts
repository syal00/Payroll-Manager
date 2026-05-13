/** Staff: MAIN_ADMIN (full), MANAGER (assigned employees & review). EMPLOYEE = portal user account. */
export const Role = {
  MAIN_ADMIN: "MAIN_ADMIN",
  MANAGER: "MANAGER",
  EMPLOYEE: "EMPLOYEE",
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const PayPeriodStatus = {
  OPEN: "OPEN",
  CLOSED: "CLOSED",
  PROCESSING: "PROCESSING",
} as const;
export type PayPeriodStatus = (typeof PayPeriodStatus)[keyof typeof PayPeriodStatus];

export const TimesheetStatus = {
  DRAFT: "DRAFT",
  PENDING: "PENDING",
  /** Manager / admin is actively reviewing (diagram: UNDER REVIEW). */
  UNDER_REVIEW: "UNDER_REVIEW",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;
export type TimesheetStatus = (typeof TimesheetStatus)[keyof typeof TimesheetStatus];

/** Normalize status from API/DB for comparisons (trim/casing; legacy VERIFIED → UNDER_REVIEW). */
export function canonicalTimesheetStatus(status: string | null | undefined): string {
  const s = String(status ?? "").trim().toUpperCase();
  return s === "VERIFIED" ? TimesheetStatus.UNDER_REVIEW : s;
}

export const PayslipItemType = {
  EARNING: "EARNING",
  DEDUCTION: "DEDUCTION",
} as const;
export type PayslipItemType = (typeof PayslipItemType)[keyof typeof PayslipItemType];
