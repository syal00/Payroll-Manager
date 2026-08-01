import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { checkLoginRateLimit, clearLoginRateLimit, clientIpFromRequest } from "@/lib/login-rate-limit";
import { findEmployeeByLoginIdentity } from "@/lib/login-lookup";
import { resolveRegistrationCompanyId } from "@/lib/employee-company-scope";
import { normalizeUsername } from "@/lib/username-generator";
import { z } from "zod";

const bodySchema = z.object({
  username: z.string().trim().min(3).max(320),
  password: z.string().min(1).max(128),
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

    const body = bodySchema.parse(await req.json());
    const login = normalizeUsername(body.username);
    const headerCompanyId = (await headers()).get("x-company-id");
    const companyId = await resolveRegistrationCompanyId(headerCompanyId);

    const employee = await findEmployeeByLoginIdentity(login, companyId);
    if (!employee || employee.deletedAt) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    if (!employee.userId) {
      return NextResponse.json(
        {
          error:
            "This account does not have a password yet. Contact your administrator or register again.",
        },
        { status: 403 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: employee.userId },
      select: { passwordHash: true, deletedAt: true },
    });

    if (!user || user.deletedAt) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const ok = await bcrypt.compare(body.password, user.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    if (!employee.isApproved) {
      return NextResponse.json(
        {
          error: "Your account is pending administrator approval. You will be able to sign in once approved.",
          pendingApproval: true,
          employeeCode: employee.employeeCode,
        },
        { status: 403 }
      );
    }

    clearLoginRateLimit(ip);
    return NextResponse.json({
      ok: true,
      employeeCode: employee.employeeCode,
      redirect: `/employee/${employee.employeeCode}/dashboard`,
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", issues: e.issues }, { status: 400 });
    }
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
