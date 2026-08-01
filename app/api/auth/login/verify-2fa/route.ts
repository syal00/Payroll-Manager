import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/session";
import { adminPortalLoginRedirect, isAdminPortalLoginRole } from "@/lib/roles";
import { verifyAdmin2faChallenge, verifyAdminTotp } from "@/lib/admin-login-2fa";
import { z } from "zod";

const schema = z.object({
  challengeToken: z.string().min(1),
  code: z.string().trim().min(4).max(12),
});

export async function POST(req: Request) {
  try {
    let json: unknown;
    try {
      json = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    const body = schema.parse(json);
    const challenge = await verifyAdmin2faChallenge(body.challengeToken);
    if (!challenge) {
      return NextResponse.json({ error: "Verification session expired. Sign in again." }, { status: 401 });
    }

    const verified = await verifyAdminTotp(challenge.userId, body.code, challenge.mode);
    if (!verified.ok) {
      return NextResponse.json({ error: verified.error }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: challenge.userId } });
    if (!user || !isAdminPortalLoginRole(user.role)) {
      return NextResponse.json({ error: "Account not found." }, { status: 404 });
    }

    await createSession({
      id: user.id,
      username: user.username,
      email: user.contactEmail,
      role: user.role as "SUPER_ADMIN" | "MAIN_ADMIN" | "MANAGER" | "SUPERVISOR" | "ADMIN",
      name: user.name,
      companyId: user.companyId,
    });

    return NextResponse.json({
      ok: true,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
      redirect: adminPortalLoginRedirect(user.role, user.mustChangePassword),
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request", issues: e.issues }, { status: 400 });
    }
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
