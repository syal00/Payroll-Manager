import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateEmployeeEmailForOtp } from "@/lib/employee-code";
import { findEmployeeByLoginIdentity } from "@/lib/login-lookup";
import { sendEmployeeOtp } from "@/lib/employee-otp-delivery";
import { normalizeUsername } from "@/lib/username-generator";
import { z } from "zod";

const bodySchema = z.object({
  username: z.string().trim().min(3).max(320),
});

export async function POST(req: Request) {
  try {
    const body = bodySchema.parse(await req.json());
    const login = normalizeUsername(body.username);

    const employee = await findEmployeeByLoginIdentity(login);
    if (!employee) {
      return NextResponse.json({ error: "No employee profile found for that email." }, { status: 404 });
    }

    if (employee.deletedAt) {
      return NextResponse.json(
        {
          error: "Your account has been deactivated. Please contact admin.",
          deactivated: true,
        },
        { status: 403 }
      );
    }

    const deliverable = await validateEmployeeEmailForOtp(employee.contactEmail);
    if (!deliverable.ok) {
      return NextResponse.json(
        {
          error: deliverable.message,
          reason: deliverable.reason,
          emailUndeliverable: true,
          requiresAdminFollowUp: true,
        },
        { status: 400 }
      );
    }

    const otpResult = await sendEmployeeOtp({
      employeeId: employee.id,
      contactEmail: employee.contactEmail,
      otpExpires: employee.otpExpires,
    });
    if (!otpResult.ok) {
      return NextResponse.json(otpResult.body, { status: otpResult.status });
    }

    return NextResponse.json({
      ok: true,
      emailSent: otpResult.emailSent,
      devOtp: otpResult.devOtp,
      message: otpResult.message,
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", issues: e.issues }, { status: 400 });
    }
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
