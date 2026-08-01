import { NextResponse } from "next/server";
import { beginAdmin2fa, verifyAdmin2faChallenge } from "@/lib/admin-login-2fa";
import { prisma } from "@/lib/prisma";
import { isAdminPortalLoginRole } from "@/lib/roles";
import { z } from "zod";

const schema = z.object({
  challengeToken: z.string().min(1),
});

/** Regenerates QR/setup for an in-progress TOTP setup (authenticator apps only). */
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
    if (challenge.mode !== "setup") {
      return NextResponse.json(
        { error: "Authenticator codes refresh automatically every 30 seconds." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { id: challenge.userId } });
    if (!user || !isAdminPortalLoginRole(user.role)) {
      return NextResponse.json({ error: "Account not found." }, { status: 404 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { totpSecretEnc: null, totpEnabled: false },
    });

    const tfa = await beginAdmin2fa({ userId: user.id, contactEmail: user.contactEmail });
    if (!tfa.ok) {
      return NextResponse.json(tfa.body, { status: tfa.status });
    }
    if (tfa.mode !== "setup") {
      return NextResponse.json({ error: "Could not refresh setup." }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      challengeToken: tfa.challengeToken,
      qrCodeDataUrl: tfa.qrCodeDataUrl,
      setupKey: tfa.setupKey,
      message: tfa.message,
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request", issues: e.issues }, { status: 400 });
    }
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
