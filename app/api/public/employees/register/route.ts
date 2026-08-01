import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { headers } from "next/headers";
import { nextEmployeeCode, normalizeEmployeeEmail } from "@/lib/employee-code";
import { writeAuditLog } from "@/lib/audit";
import { validateEmailDeliverable, emailValidationMessage } from "@/lib/email-validation";
import { createSelfRegisteredEmployee } from "@/lib/staff-account";
import { resolveRegistrationCompanyId } from "@/lib/employee-company-scope";
import { findEmployeeByContactEmailInCompany } from "@/lib/employee-lookup";
import { z } from "zod";

const bodySchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(60),
  lastName: z.string().trim().min(1, "Last name is required").max(60),
  contactEmail: z.string().trim().email("Enter a valid contact email").max(320),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
});

export async function POST(req: Request) {
  try {
    const body = bodySchema.parse(await req.json());
    const contactEmail = normalizeEmployeeEmail(body.contactEmail);
    const passwordHash = await bcrypt.hash(body.password, 12);
    const headerCompanyId = (await headers()).get("x-company-id");
    const companyId = await resolveRegistrationCompanyId(headerCompanyId);

    const existing = companyId
      ? await findEmployeeByContactEmailInCompany(contactEmail, companyId)
      : null;

    if (existing?.deletedAt) {
      return NextResponse.json(
        {
          error:
            "This contact email belongs to a deactivated profile. Contact an administrator to restore access.",
          deactivated: true,
        },
        { status: 403 }
      );
    }

    if (existing?.isApproved && existing.userId) {
      return NextResponse.json(
        {
          error: "This email is already registered. Sign in with your email and password instead.",
          exists: true,
          alreadyRegistered: true,
          employeeCode: existing.employeeCode,
        },
        { status: 409 }
      );
    }

    if (!existing) {
      const deliverable = await validateEmailDeliverable(contactEmail);
      if (!deliverable.valid) {
        return NextResponse.json(
          { error: emailValidationMessage(deliverable.reason), reason: deliverable.reason },
          { status: 400 }
        );
      }
    }

    const employeeCode = await nextEmployeeCode();

    let employee;
    try {
      employee = await createSelfRegisteredEmployee({
        firstName: body.firstName,
        lastName: body.lastName,
        contactEmail,
        passwordHash,
        companyId,
        employeeCode,
      });
    } catch (createErr) {
      const message = createErr instanceof Error ? createErr.message : "Could not create profile";
      if (message === "DEACTIVATED") {
        return NextResponse.json(
          {
            error:
              "This contact email belongs to a deactivated profile. Contact an administrator to restore access.",
            deactivated: true,
          },
          { status: 403 }
        );
      }
      if (message === "ALREADY_REGISTERED") {
        return NextResponse.json(
          {
            error: "This email is already registered. Sign in with your email and password instead.",
            exists: true,
            alreadyRegistered: true,
          },
          { status: 409 }
        );
      }
      if (message === "Company is required for employee registration.") {
        return NextResponse.json(
          { error: "Could not determine your company workspace. Open the employee portal from your company link and try again." },
          { status: 400 }
        );
      }
      if (message === "ADMIN_EMAIL_IN_USE") {
        return NextResponse.json(
          {
            error:
              "This email is already used for an administrator account. Sign in at the admin login page or use a different email for the employee portal.",
            adminEmailInUse: true,
          },
          { status: 409 }
        );
      }
      if (message.includes("already exists")) {
        return NextResponse.json({ error: message }, { status: 409 });
      }
      throw createErr;
    }

    if (!existing) {
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
    }

    return NextResponse.json({
      ok: true,
      pendingApproval: !employee.isApproved,
      employeeCode: employee.employeeCode,
      username: employee.username,
      message: employee.isApproved
        ? "Your password has been set. You can sign in with your email and password."
        : "Your account has been created and is pending administrator approval. You can sign in once an admin approves your request.",
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", issues: e.issues }, { status: 400 });
    }
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
