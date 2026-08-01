import "server-only";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { validateEmployeeEmailForOtp } from "@/lib/employee-code";
import { buildEmployeeOtpEmail } from "@/lib/email/employee-otp";
import { sendEmail, isEmailDeliveryConfigured, publicEmailSendError } from "@/lib/mailer";

export const EMPLOYEE_OTP_TTL_MS = 10 * 60 * 1000;
export const EMPLOYEE_OTP_COOLDOWN_MS = 60 * 1000;

export function employeeOtpSentAt(otpExpires: Date): Date {
  return new Date(otpExpires.getTime() - EMPLOYEE_OTP_TTL_MS);
}

/** Milliseconds until another OTP may be sent; 0 when cooldown has elapsed. */
export function employeeOtpCooldownRemainingMs(otpExpires: Date | null | undefined): number {
  if (!otpExpires) return 0;
  const elapsed = Date.now() - employeeOtpSentAt(otpExpires).getTime();
  const remaining = EMPLOYEE_OTP_COOLDOWN_MS - elapsed;
  return remaining > 0 ? remaining : 0;
}

export function isEmployeeOtpCooldownActive(otpExpires: Date | null | undefined): boolean {
  return employeeOtpCooldownRemainingMs(otpExpires) > 0;
}

export type SendEmployeeOtpResult =
  | { ok: true; emailSent: boolean; devOtp?: string; message: string }
  | { ok: false; status: number; body: Record<string, unknown> };

/** Persists OTP on the employee row and sends email — same storage as login send-code. */
export async function sendEmployeeOtp(params: {
  employeeId: string;
  contactEmail: string;
  otpExpires?: Date | null;
}): Promise<SendEmployeeOtpResult> {
  const remainingMs = employeeOtpCooldownRemainingMs(params.otpExpires);
  if (remainingMs > 0) {
    const retryAfterSeconds = Math.ceil(remainingMs / 1000);
    return {
      ok: false,
      status: 429,
      body: {
        error: `Please wait ${retryAfterSeconds} seconds before requesting another code.`,
        retryAfterSeconds,
        otpCooldown: true,
      },
    };
  }

  const deliverable = await validateEmployeeEmailForOtp(params.contactEmail);
  if (!deliverable.ok) {
    await writeAuditLog({
      actorId: null,
      action: "EMPLOYEE_OTP_BLOCKED_UNDELIVERABLE_EMAIL",
      entityType: "Employee",
      entityId: params.employeeId,
      details: {
        contactEmail: params.contactEmail,
        reason: deliverable.reason,
      },
    });
    return {
      ok: false,
      status: 400,
      body: {
        error: deliverable.message,
        reason: deliverable.reason,
        emailUndeliverable: true,
        requiresAdminFollowUp: true,
      },
    };
  }

  const otp = String(Math.floor(100000 + Math.random() * 900000));
  const expires = new Date(Date.now() + EMPLOYEE_OTP_TTL_MS);

  await prisma.employee.update({
    where: { id: params.employeeId },
    data: { otpCode: otp, otpExpires: expires },
  });

  const { subject, text, html } = buildEmployeeOtpEmail({ otp, expiresMinutes: 10 });
  const emailResult = await sendEmail({ to: params.contactEmail, subject, text, html });

  if (isEmailDeliveryConfigured() && !emailResult.sent) {
    // Local dev: show OTP on screen when provider misconfigured (invalid key, etc.)
    if (process.env.NODE_ENV !== "production") {
      console.warn("[employee-otp] Email send failed — dev fallback:", emailResult.detail);
      return {
        ok: true,
        emailSent: false,
        devOtp: otp,
        message: `Verification email could not be sent. Use the code shown below to continue.`,
      };
    }
    return {
      ok: false,
      status: 502,
      body: {
        error: publicEmailSendError(emailResult.detail),
        emailSendFailed: true,
      },
    };
  }

  return {
    ok: true,
    emailSent: emailResult.sent,
    devOtp: emailResult.sent ? undefined : otp,
    message: emailResult.sent
      ? `Your one-time code was emailed to ${params.contactEmail}.`
      : `Your one-time code was generated for ${params.contactEmail}. (Email not configured — use the code shown below.)`,
  };
}
