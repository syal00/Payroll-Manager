import nodemailer from "nodemailer";

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
  /** Overrides MAIL_FROM / SMTP_FROM for this message. */
  from?: string;
};

export type SendEmailResult = {
  sent: boolean;
  detail?: string;
};

function mailFromAddress(options?: { resend?: boolean }): string {
  const mailFrom = process.env.MAIL_FROM?.trim();
  if (mailFrom) return mailFrom;
  const explicit = process.env.SMTP_FROM?.trim() || process.env.SMTP_USER?.trim();
  if (explicit) return explicit;
  if (options?.resend) {
    return "PayRun <onboarding@resend.dev>";
  }
  return "PayRun <onboarding@payrun.app>";
}

function smtpConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST?.trim() &&
      process.env.SMTP_USER?.trim() &&
      process.env.SMTP_PASS?.trim()
  );
}

async function sendViaResend(input: SendEmailInput, apiKey: string): Promise<SendEmailResult> {
  const from = input.from?.trim() || mailFromAddress({ resend: true });
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: input.subject,
      html: input.html,
      text: input.text,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error("[mailer] Resend error", res.status, body);
    let detail = "Email provider rejected the message.";
    try {
      const parsed = JSON.parse(body) as { message?: string };
      if (parsed.message) detail = parsed.message;
    } catch {
      /* ignore */
    }
    return { sent: false, detail };
  }

  return { sent: true };
}

async function sendViaSmtp(input: SendEmailInput): Promise<SendEmailResult> {
  const host = process.env.SMTP_HOST!.trim();
  const port = Number(process.env.SMTP_PORT ?? 587);
  const secure = process.env.SMTP_SECURE === "true" || port === 465;
  const user = process.env.SMTP_USER!.trim();
  const pass = process.env.SMTP_PASS!.trim();
  const from = input.from?.trim() || mailFromAddress();

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });

  try {
    await transporter.sendMail({
      from,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    });
    return { sent: true };
  } catch (e) {
    console.error("[mailer] SMTP error", e);
    const message = e instanceof Error ? e.message : "SMTP send failed.";
    return { sent: false, detail: message };
  }
}

/** Sends transactional email via Resend or SMTP (Gmail, etc.) when configured. */
export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const resendKey = process.env.RESEND_API_KEY?.trim();
  if (resendKey) {
    return sendViaResend(input, resendKey);
  }

  if (smtpConfigured()) {
    return sendViaSmtp(input);
  }

  console.info("[mailer] No email provider configured — skipping email to", input.to);
  console.info("[mailer] Subject:", input.subject);
  console.info("[mailer] Text preview:\n", input.text.slice(0, 500));
  return {
    sent: false,
    detail:
      "Email not configured. Add SMTP_HOST, SMTP_USER, and SMTP_PASS (or RESEND_API_KEY) to .env, then restart the dev server.",
  };
}

export function isEmailDeliveryConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim()) || smtpConfigured();
}

/** User-safe message — never expose provider/API-key details on public endpoints. */
export function publicEmailSendError(detail?: string): string {
  const d = detail?.toLowerCase() ?? "";
  if (d.includes("api key") || d.includes("unauthorized") || d.includes("forbidden")) {
    return "We couldn't send the verification email right now. Please try again in a few minutes.";
  }
  if (d.includes("not configured")) {
    return "Email delivery is not set up on this server yet. Contact your administrator.";
  }
  return "We couldn't send the verification email. Check the address and try again shortly.";
}

/** True when Resend key looks like a real key (not a placeholder). */
export function isResendKeyLikelyValid(): boolean {
  const key = process.env.RESEND_API_KEY?.trim() ?? "";
  return key.startsWith("re_") && key.length >= 30;
}
