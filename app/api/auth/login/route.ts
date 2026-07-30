import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { prismaDatabaseUnavailableMessage } from "@/lib/prisma-errors";
import { createSession } from "@/lib/session";
import { checkLoginRateLimit, clearLoginRateLimit, clientIpFromRequest } from "@/lib/login-rate-limit";
import { DEMO_CREDENTIALS } from "@/lib/demo-credentials";
import { isStaffRole, isSupervisorRole, isSuperAdminRole } from "@/lib/roles";
import { normalizeUsername } from "@/lib/username-generator";
import { z } from "zod";

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
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      const isDemoAdminUsername =
        username === DEMO_CREDENTIALS.admin.username ||
        username === DEMO_CREDENTIALS.manager.username;
      return NextResponse.json(
        {
          error: isDemoAdminUsername
            ? "No admin account in the database yet. Wait for the latest deploy to finish, or run: npm run setup (or npx tsx scripts/ensure-demo-admins.ts)."
            : "Invalid username or password.",
        },
        { status: 401 }
      );
    }
    const ok = await bcrypt.compare(body.password, user.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: "Invalid username or password." }, { status: 401 });
    }
    if (!isStaffRole(user.role) && !isSupervisorRole(user.role)) {
      return NextResponse.json(
        {
          error:
            "Employees do not use password login. Use the employee portal and sign in with your username.",
        },
        { status: 403 }
      );
    }
    if (user.mustChangePassword) {
      await createSession({
        id: user.id,
        username: user.username,
        email: user.contactEmail,
        role: user.role as "SUPER_ADMIN" | "MAIN_ADMIN" | "MANAGER" | "SUPERVISOR" | "ADMIN",
        name: user.name,
        companyId: user.companyId,
      });
      clearLoginRateLimit(ip);
      return NextResponse.json({
        ok: true,
        role: user.role,
        mustChangePassword: true,
        redirect: "/admin/change-password",
      });
    }
    await createSession({
      id: user.id,
      username: user.username,
      email: user.contactEmail,
      role: user.role as "SUPER_ADMIN" | "MAIN_ADMIN" | "MANAGER" | "SUPERVISOR" | "ADMIN",
      name: user.name,
      companyId: user.companyId,
    });
    clearLoginRateLimit(ip);
    return NextResponse.json({
      ok: true,
      role: user.role,
      redirect: isSuperAdminRole(user.role) ? "/super-admin/companies" : "/admin",
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
