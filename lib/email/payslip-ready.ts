import { format } from "date-fns";
import { APP_NAME } from "@/lib/brand";
import { appendEmailFooter } from "@/lib/email/footer";
import { escapeHtml } from "@/lib/email/utils";

export type PayslipReadyEmailInput = {
  employeeName: string;
  companyName: string;
  payslipNumber: string;
  periodStart: Date;
  periodEnd: Date;
  netPay: number;
  portalUrl?: string;
};

export function buildPayslipReadyEmail(input: PayslipReadyEmailInput): {
  subject: string;
  text: string;
  html: string;
} {
  const company = input.companyName || APP_NAME;
  const subject = `${company} — Payslip ${input.payslipNumber}`;
  const periodLabel = `${format(input.periodStart, "MMM d, yyyy")} – ${format(input.periodEnd, "MMM d, yyyy")}`;

  const textBody = [
    `Hello ${input.employeeName},`,
    "",
    `Your payslip ${input.payslipNumber} for the period ${periodLabel} is available.`,
    "",
    `Net pay: $${input.netPay.toFixed(2)}`,
    "",
    input.portalUrl
      ? `Sign in to the employee portal to view details and download your PDF:\n  ${input.portalUrl}`
      : "Sign in to the employee portal to view details and download your PDF.",
    "",
    "— Payroll",
  ].join("\n");

  const htmlBody = `
<div style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.6;color:#212529;max-width:560px;">
  <p style="margin:0 0 12px;">Hello ${escapeHtml(input.employeeName)},</p>
  <p style="margin:0 0 12px;">Your payslip <strong>${escapeHtml(input.payslipNumber)}</strong> for the period ${escapeHtml(periodLabel)} is available.</p>
  <p style="margin:0 0 12px;">Net pay: <strong>$${input.netPay.toFixed(2)}</strong></p>
  <p style="margin:0;">${input.portalUrl ? `Sign in to the <a href="${escapeHtml(input.portalUrl)}" style="color:#a8861a;">employee portal</a> to view details and download your PDF.` : "Sign in to the employee portal to view details and download your PDF."}</p>
</div>`.trim();

  return { subject, ...appendEmailFooter(textBody, htmlBody) };
}
