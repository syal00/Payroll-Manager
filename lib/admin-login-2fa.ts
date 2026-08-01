import "server-only";
import * as OTPAuth from "otpauth";
import QRCode from "qrcode";
import * as jose from "jose";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { APP_NAME } from "@/lib/brand";
import { isAdminPortalLoginRole } from "@/lib/roles";
import { decryptTotpSecret, encryptTotpSecret } from "@/lib/totp-secret-crypto";

const CHALLENGE_PURPOSE = "admin_2fa";
export type Admin2faMode = "setup" | "verify";

function authSecret(): Uint8Array {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) {
    throw new Error("AUTH_SECRET must be set and at least 32 characters");
  }
  return new TextEncoder().encode(s);
}

export async function signAdmin2faChallenge(userId: string, mode: Admin2faMode): Promise<string> {
  return new jose.SignJWT({ purpose: CHALLENGE_PURPOSE, mode })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setExpirationTime("15m")
    .setIssuedAt()
    .sign(authSecret());
}

export async function verifyAdmin2faChallenge(
  token: string
): Promise<{ userId: string; mode: Admin2faMode } | null> {
  try {
    const { payload } = await jose.jwtVerify(token, authSecret());
    if (payload.purpose !== CHALLENGE_PURPOSE && payload.purpose !== "super_admin_2fa") return null;
    const userId = payload.sub;
    if (!userId || typeof userId !== "string") return null;
    const mode = payload.mode === "setup" ? "setup" : "verify";
    return { userId, mode };
  } catch {
    return null;
  }
}

function buildTotp(contactEmail: string, secretBase32: string): OTPAuth.TOTP {
  return new OTPAuth.TOTP({
    issuer: APP_NAME,
    label: contactEmail,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secretBase32),
  });
}

function validateTotpCode(totp: OTPAuth.TOTP, code: string): boolean {
  const delta = totp.validate({ token: code.trim(), window: 1 });
  return delta !== null;
}

async function ensurePendingTotpSecret(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { totpSecretEnc: true, totpEnabled: true },
  });
  if (!user) return null;
  if (user.totpSecretEnc) {
    return decryptTotpSecret(user.totpSecretEnc);
  }

  const secret = new OTPAuth.Secret({ size: 20 });
  const base32 = secret.base32;
  await prisma.user.update({
    where: { id: userId },
    data: {
      totpSecretEnc: encryptTotpSecret(base32),
      totpEnabled: false,
      loginOtpCode: null,
      loginOtpExpires: null,
    },
  });
  return base32;
}

export type BeginAdmin2faResult =
  | {
      ok: true;
      challengeToken: string;
      mode: "setup";
      qrCodeDataUrl: string;
      setupKey: string;
      message: string;
    }
  | {
      ok: true;
      challengeToken: string;
      mode: "verify";
      message: string;
    }
  | { ok: false; status: number; body: Record<string, unknown> };

export async function beginAdmin2fa(params: {
  userId: string;
  contactEmail: string;
}): Promise<BeginAdmin2faResult> {
  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    select: { role: true, totpEnabled: true, totpSecretEnc: true },
  });
  if (!user || !isAdminPortalLoginRole(user.role)) {
    return { ok: false, status: 403, body: { error: "Two-factor login is not available for this account." } };
  }

  if (user.totpEnabled && user.totpSecretEnc) {
    const challengeToken = await signAdmin2faChallenge(params.userId, "verify");
    return {
      ok: true,
      challengeToken,
      mode: "verify",
      message: "Enter the 6-digit code from your authenticator app.",
    };
  }

  const secretBase32 = await ensurePendingTotpSecret(params.userId);
  if (!secretBase32) {
    return { ok: false, status: 404, body: { error: "Account not found." } };
  }

  const totp = buildTotp(params.contactEmail, secretBase32);
  const qrCodeDataUrl = await QRCode.toDataURL(totp.toString(), {
    width: 220,
    margin: 2,
    color: { dark: "#0b1426", light: "#ffffff" },
  });

  const challengeToken = await signAdmin2faChallenge(params.userId, "setup");

  await writeAuditLog({
    actorId: params.userId,
    action: "ADMIN_TOTP_SETUP_STARTED",
    entityType: "User",
    entityId: params.userId,
    details: { role: user.role },
  });

  return {
    ok: true,
    challengeToken,
    mode: "setup",
    qrCodeDataUrl,
    setupKey: secretBase32,
    message:
      "Scan the QR code with Microsoft Authenticator (or enter the setup key manually), then enter the 6-digit code.",
  };
}

export async function verifyAdminTotp(
  userId: string,
  code: string,
  mode: Admin2faMode
): Promise<{ ok: true; setupComplete: boolean } | { ok: false; error: string }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, contactEmail: true, totpSecretEnc: true, totpEnabled: true },
  });
  if (!user || !isAdminPortalLoginRole(user.role)) {
    return { ok: false, error: "Invalid verification request." };
  }
  if (!user.totpSecretEnc) {
    return { ok: false, error: "Authenticator not configured. Sign in again to set up." };
  }

  const secretBase32 = decryptTotpSecret(user.totpSecretEnc);
  const totp = buildTotp(user.contactEmail, secretBase32);
  if (!validateTotpCode(totp, code)) {
    return { ok: false, error: "Invalid authenticator code. Check the app and try again." };
  }

  if (mode === "setup" && !user.totpEnabled) {
    await prisma.user.update({
      where: { id: userId },
      data: { totpEnabled: true, loginOtpCode: null, loginOtpExpires: null },
    });
    await writeAuditLog({
      actorId: userId,
      action: "ADMIN_TOTP_ENABLED",
      entityType: "User",
      entityId: userId,
      details: { role: user.role },
    });
    return { ok: true, setupComplete: true };
  }

  if (!user.totpEnabled) {
    return { ok: false, error: "Complete authenticator setup first." };
  }

  await writeAuditLog({
    actorId: userId,
    action: "ADMIN_TOTP_VERIFIED",
    entityType: "User",
    entityId: userId,
    details: { role: user.role },
  });

  return { ok: true, setupComplete: false };
}

export function maskEmailForDisplay(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  const visible = local.length <= 2 ? local[0] ?? "*" : `${local.slice(0, 2)}***`;
  return `${visible}@${domain}`;
}
