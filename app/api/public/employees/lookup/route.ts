import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { normalizeContactEmail } from "@/lib/display-name";
import { resolveRegistrationCompanyId } from "@/lib/employee-company-scope";
import { findEmployeeByContactEmailInCompany } from "@/lib/employee-lookup";
import { z } from "zod";

const bodySchema = z.object({
  contactEmail: z.string().trim().email("Enter a valid email").max(320),
});

export async function POST(req: Request) {
  try {
    const body = bodySchema.parse(await req.json());
    const contactEmail = normalizeContactEmail(body.contactEmail);
    const headerCompanyId = (await headers()).get("x-company-id");
    const companyId = await resolveRegistrationCompanyId(headerCompanyId);

    const employee = companyId
      ? await findEmployeeByContactEmailInCompany(contactEmail, companyId)
      : null;

    if (!employee) {
      return NextResponse.json(
        { error: "No employee profile found for that email. Create one first or check the address." },
        { status: 404 }
      );
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

    if (!employee.isApproved) {
      return NextResponse.json(
        {
          error: "Your account is pending administrator approval.",
          pendingApproval: true,
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
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
