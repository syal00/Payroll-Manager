import { APP_NAME } from "@/lib/brand";
import { appendEmailFooter } from "@/lib/email/footer";
import { escapeHtml } from "@/lib/email/utils";

export type EmployeeOtpEmailInput = {
  otp: string;
  expiresMinutes?: number;
};

export function buildEmployeeOtpEmail(input: EmployeeOtpEmailInput): {
  subject: string;
  text: string;
  html: string;
} {
  const expiresMinutes = input.expiresMinutes ?? 10;
  const subject = `Your ${APP_NAME} sign-in code`;

  const textBody = [
    `Your one-time sign-in code is: ${input.otp}`,
    "",
    `This code expires in ${expiresMinutes} minutes.`,
    "",
    "If you did not request this code, you can ignore this email.",
  ].join("\n");

  const htmlBody = `
<div style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.6;color:#212529;max-width:560px;">
  <p style="margin:0 0 12px;">Your one-time sign-in code is:</p>
  <p style="margin:0 0 16px;font-size:28px;font-weight:700;letter-spacing:0.2em;color:#050a14;">${escapeHtml(input.otp)}</p>
  <p style="margin:0 0 12px;color:#6c757d;font-size:14px;">This code expires in ${expiresMinutes} minutes.</p>
  <p style="margin:0;color:#6c757d;font-size:14px;">If you did not request this code, you can ignore this email.</p>
</div>`.trim();

  return { subject, ...appendEmailFooter(textBody, htmlBody) };
}
