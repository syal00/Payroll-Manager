import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeEmployeeEmail } from "@/lib/employee-code";
import { z } from "zod";

const bodySchema = z.object({
  email: z.string().trim().email().max(320),
});

export async function POST(req: Request) {
  try {
    const body = bodySchema.parse(await req.json());
    const email = normalizeEmployeeEmail(body.email);

    const employee = await prisma.employee.findUnique({
      where: { email },
      select: { id: true, deletedAt: true, isApproved: true },
    });

    if (!employee || employee.deletedAt) {
      return NextResponse.json(
        { error: "No employee profile found for that email." },
        { status: 404 }
      );
    }

    if (!employee.isApproved) {
      return NextResponse.json(
        { error: "Your account is pending admin approval." },
        { status: 403 }
      );
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expires = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.employee.update({
      where: { id: employee.id },
      data: { otpCode: otp, otpExpires: expires },
    });

    return NextResponse.json({
      ok: true,
      /** Shown in UI because outbound email is not configured in this deployment. */
      devOtp: otp,
      message:
        "Your one-time code is shown below. (In production this would be emailed to you.)",
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", issues: e.issues }, { status: 400 });
    }
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
