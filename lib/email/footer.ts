import { APP_NAME } from "@/lib/brand";
import { EMAIL_CREATOR_NAME, EMAIL_SUPPORT_CONTACT } from "@/lib/email/constants";
import { escapeHtml } from "@/lib/email/utils";

/** Plain-text footer appended to every PayRun email. */
export function renderEmailFooterText(): string {
  return [
    "---",
    `${APP_NAME} is built and maintained by ${EMAIL_CREATOR_NAME}.`,
    `Questions, feedback, or something not working right? Reach out anytime — ${EMAIL_SUPPORT_CONTACT}`,
    "",
    "Built with care, one payroll cycle at a time.",
    "Thanks for using PayRun — built by a solo dev who actually reads the support emails.",
    "---",
  ].join("\n");
}

/** HTML footer — muted, separated from main body (email-client safe inline styles). */
export function renderEmailFooterHtml(): string {
  return `
<div style="margin-top:32px;padding-top:20px;border-top:1px solid #2a3548;font-family:system-ui,sans-serif;font-size:12px;line-height:1.65;color:#8b95a5;">
  <p style="margin:0 0 8px;">${escapeHtml(APP_NAME)} is built and maintained by ${escapeHtml(EMAIL_CREATOR_NAME)}.</p>
  <p style="margin:0 0 12px;">Questions, feedback, or something not working right? Reach out anytime —
    <a href="mailto:${escapeHtml(EMAIL_SUPPORT_CONTACT)}" style="color:#c5a021;text-decoration:none;">${escapeHtml(EMAIL_SUPPORT_CONTACT)}</a>
  </p>
  <p style="margin:0 0 4px;font-style:italic;">Built with care, one payroll cycle at a time.</p>
  <p style="margin:0;">Thanks for using PayRun — built by a solo dev who actually reads the support emails.</p>
</div>`.trim();
}

/** Appends the shared footer to plain-text and HTML bodies. */
export function appendEmailFooter(text: string, html: string): { text: string; html: string } {
  return {
    text: `${text.trim()}\n\n${renderEmailFooterText()}`,
    html: `${html.trim()}\n${renderEmailFooterHtml()}`,
  };
}
