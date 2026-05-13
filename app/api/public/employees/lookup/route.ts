import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeEmployeeEmail } from "@/lib/employee-code";
import { z } from "zod";

const bodySchema = z.object({
  email: z.string().trim().email("Enter a valid email").max(320),
});

export async function POST(req: Request) {
  try {
    const body = bodySchema.parse(await req.json());
    const email = normalizeEmployeeEmail(body.email);

    const employee = await prisma.employee.findUnique({
      where: { email },
      select: { employeeCode: true, deletedAt: true, isApproved: true },
    });

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
          error: "Your account is pending admin approval.",
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
