/** Common IANA timezones for company provisioning (pay-period boundaries). */
export const COMPANY_TIMEZONE_OPTIONS = [
  { value: "America/St_Johns", label: "Newfoundland (America/St_Johns)" },
  { value: "America/Halifax", label: "Atlantic (America/Halifax)" },
  { value: "America/Toronto", label: "Eastern (America/Toronto)" },
  { value: "America/Winnipeg", label: "Central (America/Winnipeg)" },
  { value: "America/Edmonton", label: "Mountain (America/Edmonton)" },
  { value: "America/Vancouver", label: "Pacific (America/Vancouver)" },
  { value: "America/Chicago", label: "US Central (America/Chicago)" },
  { value: "America/Denver", label: "US Mountain (America/Denver)" },
  { value: "America/Los_Angeles", label: "US Pacific (America/Los_Angeles)" },
  { value: "America/New_York", label: "US Eastern (America/New_York)" },
  { value: "Europe/London", label: "UK (Europe/London)" },
  { value: "UTC", label: "UTC" },
] as const;

export const DEFAULT_COMPANY_TIMEZONE = "America/Toronto";

export type PayPeriodProvisionType = "biweekly" | "custom";
