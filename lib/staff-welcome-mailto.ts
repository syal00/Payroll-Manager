import { APP_NAME } from "@/lib/brand";
import { staffWelcomeSignInUrl } from "@/lib/app-domain";
import { employeeSignInEmail, normalizeContactEmail } from "@/lib/display-name";
import { staffRoleDisplayLabel } from "@/lib/staff-roles";

/** Shown in welcome emails when no password was just set (e.g. Email on an existing row). */
export const DEFAULT_STAFF_WELCOME_PASSWORD = "Security123!";

export type StaffWelcomeMailtoInput = {
  to: string;
  staffDisplayName: string;
  role: string;
  loginEmail: string;
  companyName: string;
  companySlug: string;
  companyWebsiteUrl?: string | null;
  temporaryPassword?: string;
};

export function buildStaffWelcomeMailtoUrl(input: StaffWelcomeMailtoInput): string {
  const roleLabel = staffRoleDisplayLabel(input.role);
  const signInUrl = staffWelcomeSignInUrl();
  const contactEmail = normalizeContactEmail(input.to);
  const signInEmail = employeeSignInEmail(input.loginEmail, contactEmail);
  const companyName = input.companyName?.trim() || APP_NAME;
  const temporaryPassword = input.temporaryPassword?.trim() || DEFAULT_STAFF_WELCOME_PASSWORD;
  const subject = `Welcome to ${companyName} — Your ${APP_NAME} account is ready`;

  const lines = [
    `Hi ${input.staffDisplayName},`,
    "",
    `Welcome to ${companyName}! Your ${roleLabel} account is now ready on ${APP_NAME}, our payroll and timesheet platform.`,
    "",
    "Here's how to get started:",
    "",
    `  Contact email (used for this account): ${contactEmail}`,
    `  Sign-in email:                      ${signInEmail}`,
    `  Temporary password:                 ${temporaryPassword}`,
    "",
    `Sign in here: ${signInUrl}`,
    "",
    "For security, you'll be asked to set a new password the first time you log in — this only takes a minute.",
    "",
    `What you can do on ${APP_NAME}:`,
    "  • Submit and track your work hours",
    "  • View the status of your submitted timesheets (pending, approved, or rejected)",
    "  • Access your payslips once processed",
    "  • Update your profile details anytime",
    "",
    "A few tips before you log in:",
    "  • Keep your sign-in email handy — you'll use it every time you log in",
    "  • Choose a strong, unique password when prompted",
    "  • Bookmark the sign-in link above for quick access going forward",
    "",
    "If you weren't expecting this account, run into any issues signing in, or have questions about your role, just reach out to your admin — they're happy to help.",
    "",
    "Welcome aboard! We're glad to have you on the team.",
    "",
    `The ${companyName} Team`,
  ];

  const body = lines.join("\r\n");
  return `mailto:${encodeURIComponent(contactEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/** Opens the default mail app (Outlook, etc.) with a pre-filled welcome message. */
export function openStaffWelcomeMail(input: StaffWelcomeMailtoInput): void {
  const url = buildStaffWelcomeMailtoUrl(input);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.rel = "noopener noreferrer";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
}
