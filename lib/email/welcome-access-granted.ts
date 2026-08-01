import { APP_NAME } from "@/lib/brand";
import { formatTenantLoginUrl } from "@/lib/app-domain";
import { appendEmailFooter } from "@/lib/email/footer";
import { staffRoleLabel } from "@/lib/email/role-labels";
import { escapeHtml } from "@/lib/email/utils";
import { sendEmail, type SendEmailResult } from "@/lib/mailer";

export type WelcomeAccessGrantedInput = {
  personalEmail: string;
  staffDisplayName: string;
  companyName: string;
  companySlug: string;
  companyWebsiteUrl?: string | null;
  role: string;
  loginEmail: string;
  temporaryPassword: string;
  /** e.g. PayRun Platform &lt;syal0005@algonquinlive.com&gt; */
  from?: string;
};

export function buildCompanySignInUrl(companySlug: string, websiteUrl?: string | null): string {
  return formatTenantLoginUrl(companySlug, websiteUrl);
}

export function buildWelcomeAccessGrantedEmail(input: WelcomeAccessGrantedInput): {
  subject: string;
  text: string;
  html: string;
} {
  const roleLabel = staffRoleLabel(input.role);
  const signInUrl = buildCompanySignInUrl(input.companySlug, input.companyWebsiteUrl);

  const subject = `Your ${APP_NAME} access for ${input.companyName}`;

  const textBody = [
    `Hi ${input.staffDisplayName},`,
    "",
    `A ${roleLabel} account has been created for you on ${APP_NAME} (${input.companyName}).`,
    "",
    "Sign-in details:",
    `  Sign-in email: ${input.loginEmail}`,
    `  Temporary password: ${input.temporaryPassword}`,
    `  Sign in at: ${signInUrl}`,
    "",
    "You will be asked to set a new password on your first sign-in.",
    "",
    "Your personal email on file is used for notifications like this one. You can update it later in your profile if needed.",
  ].join("\n");

  const htmlBody = `
<div style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.6;color:#212529;max-width:560px;">
  <p style="margin:0 0 16px;">Hi ${escapeHtml(input.staffDisplayName)},</p>
  <p style="margin:0 0 16px;">A <strong>${escapeHtml(roleLabel)}</strong> account has been created for you on
    <strong>${escapeHtml(APP_NAME)}</strong> (${escapeHtml(input.companyName)}).</p>
  <p style="margin:0 0 8px;font-weight:600;color:#050a14;">Sign-in details</p>
  <table cellpadding="0" cellspacing="0" style="margin:0 0 16px;font-size:14px;">
    <tr>
      <td style="padding:6px 16px 6px 0;color:#6c757d;vertical-align:top;">Sign-in email</td>
      <td style="padding:6px 0;"><code style="background:#f8f9fa;padding:2px 6px;border-radius:4px;font-size:13px;">${escapeHtml(input.loginEmail)}</code></td>
    </tr>
    <tr>
      <td style="padding:6px 16px 6px 0;color:#6c757d;vertical-align:top;">Temporary password</td>
      <td style="padding:6px 0;"><code style="background:#f8f9fa;padding:2px 6px;border-radius:4px;font-size:13px;">${escapeHtml(input.temporaryPassword)}</code></td>
    </tr>
    <tr>
      <td style="padding:6px 16px 6px 0;color:#6c757d;vertical-align:top;">Sign in at</td>
      <td style="padding:6px 0;"><a href="${escapeHtml(signInUrl)}" style="color:#a8861a;">${escapeHtml(signInUrl)}</a></td>
    </tr>
  </table>
  <p style="margin:0 0 16px;">You will be asked to set a new password on your first sign-in.</p>
  <p style="margin:0;color:#6c757d;font-size:14px;">Your personal email on file is used for notifications like this one. You can update it later in your profile if needed.</p>
</div>`.trim();

  const { text, html } = appendEmailFooter(textBody, htmlBody);
  return { subject, text, html };
}

/** Sends welcome / access-granted email; never throws — caller decides whether to block account creation. */
export async function sendWelcomeAccessGrantedEmail(
  input: WelcomeAccessGrantedInput
): Promise<SendEmailResult> {
  const { subject, text, html } = buildWelcomeAccessGrantedEmail(input);
  return sendEmail({
    to: input.personalEmail,
    subject,
    html,
    text,
    from: input.from,
  });
}

/** @deprecated Use sendWelcomeAccessGrantedEmail — kept for existing imports. */
export async function sendStaffWelcomeEmail(input: {
  personalEmail: string;
  staffName: string;
  companyName: string;
  companySlug: string;
  companyWebsiteUrl?: string | null;
  roleLabel: string;
  companyLogin: string;
  temporaryPassword: string;
  mustChangePassword: boolean;
}): Promise<SendEmailResult> {
  const role =
    input.roleLabel === "main admin"
      ? "MAIN_ADMIN"
      : input.roleLabel === "manager"
        ? "MANAGER"
        : input.roleLabel === "employee"
          ? "EMPLOYEE"
          : input.roleLabel.toUpperCase().replace(/ /g, "_");

  return sendWelcomeAccessGrantedEmail({
    personalEmail: input.personalEmail,
    staffDisplayName: input.staffName,
    companyName: input.companyName,
    companySlug: input.companySlug,
    companyWebsiteUrl: input.companyWebsiteUrl,
    role,
    loginEmail: input.companyLogin,
    temporaryPassword: input.temporaryPassword,
  });
}
