import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prismaDatabaseUnavailableMessage } from "@/lib/prisma-errors";
import { checkLoginRateLimit, clearLoginRateLimit, clientIpFromRequest } from "@/lib/login-rate-limit";
import { isKnownDemoLogin } from "@/lib/demo-credentials";
import { findUserByLoginIdentity } from "@/lib/login-lookup";
import { isStaffRole, isSupervisorRole, adminPortalLoginRedirect } from "@/lib/roles";
import { normalizeUsername } from "@/lib/username-generator";
import { beginAdmin2fa } from "@/lib/admin-login-2fa";
import { createSessionResponse } from "@/lib/session";
import { isTestAccountBypass2fa } from "@/lib/test-account-bypass-2fa";
import { z } from "zod";

function admin2faLoginResponse(
  result: Extract<Awaited<ReturnType<typeof beginAdmin2fa>>, { ok: true }>,
  extras?: { mustChangePassword?: boolean }
) {
  if (result.mode === "setup") {
    return {
      ok: true,
      requires2fa: true,
      mode: "setup" as const,
      challengeToken: result.challengeToken,
      qrCodeDataUrl: result.qrCodeDataUrl,
      setupKey: result.setupKey,
      message: result.message,
      ...extras,
    };
  }
  return {
    ok: true,
    requires2fa: true,
    mode: "verify" as const,
    challengeToken: result.challengeToken,
    message: result.message,
    ...extras,
  };
}

const schema = z.object({
  username: z.string().trim().min(3).max(320),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  const ip = clientIpFromRequest(req);
  try {
    if (!checkLoginRateLimit(ip)) {
      return NextResponse.json(
        { error: "Too many login attempts. Try again in 15 minutes." },
        { status: 429 }
      );
    }

    let json: unknown;
    try {
      json = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    const body = schema.parse(json);
    const username = normalizeUsername(body.username);
    const user = await findUserByLoginIdentity(username);
    if (!user) {
      return NextResponse.json(
        {
          error: isKnownDemoLogin(username)
            ? "No admin account in the database yet. Wait for the latest deploy to finish, or run: npm run setup (or npx tsx scripts/ensure-demo-admins.ts)."
            : "Invalid email or password.",
        },
        { status: 401 }
      );
    }
    const ok = await bcrypt.compare(body.password, user.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }
    if (user.deletedAt) {
      return NextResponse.json(
        { error: "This account has been temporarily suspended. Contact your platform administrator." },
        { status: 403 }
      );
    }
    if (!isStaffRole(user.role) && !isSupervisorRole(user.role)) {
      return NextResponse.json(
        {
          error:
            "Employees do not use password login. Use the employee portal and sign in with your contact email.",
        },
        { status: 403 }
      );
    }

    if (isTestAccountBypass2fa(user.contactEmail, user.username)) {
      clearLoginRateLimit(ip);
      return createSessionResponse(
        {
          id: user.id,
          username: user.username,
          email: user.contactEmail,
          role: user.role as "SUPER_ADMIN" | "MAIN_ADMIN" | "MANAGER" | "SUPERVISOR" | "ADMIN",
          name: user.name,
          companyId: user.companyId,
        },
        {
          ok: true,
          role: user.role,
          mustChangePassword: user.mustChangePassword,
          redirect: adminPortalLoginRedirect(user.role, user.mustChangePassword),
        }
      );
    }

    const tfa = await beginAdmin2fa({
      userId: user.id,
      contactEmail: user.contactEmail,
    });
    if (!tfa.ok) {
      return NextResponse.json(tfa.body, { status: tfa.status });
    }
    clearLoginRateLimit(ip);
    return NextResponse.json(
      admin2faLoginResponse(tfa, user.mustChangePassword ? { mustChangePassword: true } : undefined)
    );
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request", issues: e.issues }, { status: 400 });
    }
    const dbUnavailable = prismaDatabaseUnavailableMessage(e);
    if (dbUnavailable) {
      return NextResponse.json({ error: dbUnavailable }, { status: 503 });
    }
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
