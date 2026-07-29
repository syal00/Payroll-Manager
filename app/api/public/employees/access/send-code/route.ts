import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { validateEmployeeEmailForOtp } from "@/lib/employee-code";
import { normalizeUsername } from "@/lib/username-generator";
import { z } from "zod";

const bodySchema = z.object({
  username: z.string().trim().min(3).max(320),
});

export async function POST(req: Request) {
  try {
    const body = bodySchema.parse(await req.json());
    const username = normalizeUsername(body.username);

    const employee = await prisma.employee.findUnique({
      where: { username },
      select: { id: true, deletedAt: true, isApproved: true, contactEmail: true },
    });

    if (!employee || employee.deletedAt) {
      return NextResponse.json({ error: "No employee profile found for that username." }, { status: 404 });
    }

    if (!employee.isApproved) {
      return NextResponse.json({ error: "Your account is pending admin approval." }, { status: 403 });
    }

    const deliverable = await validateEmployeeEmailForOtp(employee.contactEmail);
    if (!deliverable.ok) {
      await writeAuditLog({
        actorId: null,
        action: "EMPLOYEE_OTP_BLOCKED_UNDELIVERABLE_EMAIL",
        entityType: "Employee",
        entityId: employee.id,
        details: {
          contactEmail: employee.contactEmail,
          reason: deliverable.reason,
        },
      });
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

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expires = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.employee.update({
      where: { id: employee.id },
      data: { otpCode: otp, otpExpires: expires },
    });

    // OTP is sent to contactEmail only — username is a login handle, never routable mail.
    const deliverTo = employee.contactEmail;

    return NextResponse.json({
      ok: true,
      /** Shown in UI because outbound email is not configured in this deployment. */
      devOtp: otp,
      message: `Your one-time code was generated for ${deliverTo}. (In production this would be emailed to that address — never to your username.)`,
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", issues: e.issues }, { status: 400 });
    }
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
