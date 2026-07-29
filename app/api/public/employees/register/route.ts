import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { nextEmployeeCode } from "@/lib/employee-code";
import { writeAuditLog } from "@/lib/audit";
import { validateEmailDeliverable, emailValidationMessage } from "@/lib/email-validation";
import { createEmployeeProfile } from "@/lib/staff-account";
import { z } from "zod";

const bodySchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(60),
  lastName: z.string().trim().min(1, "Last name is required").max(60),
  contactEmail: z.string().trim().email("Enter a valid contact email").max(320),
});

export async function POST(req: Request) {
  try {
    const body = bodySchema.parse(await req.json());

    const deliverable = await validateEmailDeliverable(body.contactEmail);
    if (!deliverable.valid) {
      return NextResponse.json(
        { error: emailValidationMessage(deliverable.reason), reason: deliverable.reason },
        { status: 400 }
      );
    }

    const existing = await prisma.employee.findUnique({
      where: { contactEmail: body.contactEmail.trim().toLowerCase() },
    });
    if (existing) {
      if (existing.deletedAt) {
        return NextResponse.json(
          {
            error:
              "This contact email belongs to a deactivated profile. Contact an administrator to restore access.",
            deactivated: true,
          },
          { status: 403 }
        );
      }
      return NextResponse.json(
        {
          error: "An employee profile already exists for this contact email.",
          exists: true,
          employeeCode: existing.employeeCode,
          username: existing.username,
          redirect: `/employee/${existing.employeeCode}/dashboard`,
        },
        { status: 409 }
      );
    }

    const companyId = (await headers()).get("x-company-id");

    const employeeCode = await nextEmployeeCode();
    const employee = await createEmployeeProfile({
      firstName: body.firstName,
      lastName: body.lastName,
      contactEmail: body.contactEmail,
      companyId,
      employeeCode,
      isApproved: false,
    });

    await writeAuditLog({
      actorId: null,
      action: "EMPLOYEE_SELF_REGISTERED",
      entityType: "Employee",
      entityId: employee.id,
      details: {
        employeeCode: employee.employeeCode,
        username: employee.username,
        contactEmail: employee.contactEmail,
      },
    });

    return NextResponse.json({
      ok: true,
      pendingApproval: true,
      employeeCode: employee.employeeCode,
      username: employee.username,
      message:
        "Pending admin approval. You will be able to sign in with your username after an administrator approves your profile.",
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", issues: e.issues }, { status: 400 });
    }
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
