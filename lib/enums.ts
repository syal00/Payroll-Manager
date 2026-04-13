export const Role = {
  ADMIN: "ADMIN",
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
  VERIFIED: "VERIFIED",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;
export type TimesheetStatus = (typeof TimesheetStatus)[keyof typeof TimesheetStatus];

export const PayslipItemType = {
  EARNING: "EARNING",
  DEDUCTION: "DEDUCTION",
} as const;
export type PayslipItemType = (typeof PayslipItemType)[keyof typeof PayslipItemType];
