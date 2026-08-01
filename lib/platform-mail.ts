/** Default platform sender for super-admin provisioning emails. Override with PLATFORM_MAIL_FROM in .env */
export const DEFAULT_PLATFORM_MAIL_FROM = "PayRun Platform <syal0005@algonquinlive.com>";

export function platformMailFrom(): string {
  const configured = process.env.PLATFORM_MAIL_FROM?.trim();
  return configured || DEFAULT_PLATFORM_MAIL_FROM;
}
