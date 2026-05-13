import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { prismaDatabaseUnavailableMessage } from "@/lib/prisma-errors";
import { createSession } from "@/lib/session";
import { checkLoginRateLimit, clearLoginRateLimit, clientIpFromRequest } from "@/lib/login-rate-limit";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
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
    const user = await prisma.user.findUnique({ where: { email: body.email } });
    if (!user) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }
    const ok = await bcrypt.compare(body.password, user.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }
    if (user.role !== "ADMIN") {
      return NextResponse.json(
        {
          error:
            "Employees do not use password login. Use the Employee button to register or access your profile with email.",
        },
        { status: 403 }
      );
    }
    await createSession({
      id: user.id,
      email: user.email,
      role: "ADMIN",
      name: user.name,
    });
    clearLoginRateLimit(ip);
    return NextResponse.json({
      ok: true,
      role: user.role,
      redirect: "/admin",
    });
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
