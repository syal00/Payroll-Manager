import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { nextEmployeeCode, normalizeEmployeeEmail } from "@/lib/employee-code";
import { writeAuditLog } from "@/lib/audit";
import { z } from "zod";

const bodySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  email: z.string().trim().email("Enter a valid email").max(320),
});

export async function POST(req: Request) {
  try {
    const body = bodySchema.parse(await req.json());
    const email = normalizeEmployeeEmail(body.email);
    const name = body.name.trim();

    const existing = await prisma.employee.findUnique({ where: { email } });
    if (existing) {
      if (existing.deletedAt) {
        return NextResponse.json(
          {
            error:
              "This email belongs to a deactivated profile. Contact an administrator to restore access.",
            deactivated: true,
          },
          { status: 403 }
        );
      }
      return NextResponse.json(
        {
          error: "An employee profile already exists for this email.",
          exists: true,
          employeeCode: existing.employeeCode,
          redirect: `/employee/${existing.employeeCode}/dashboard`,
        },
        { status: 409 }
      );
    }

    const employee = await prisma.$transaction(async (tx) => {
      const employeeCode = await nextEmployeeCode(tx);
      return tx.employee.create({
        data: {
          employeeCode,
          name,
          email,
          hourlyRate: 28,
          overtimeRate: 42,
          isApproved: false,
        },
      });
    });

    await writeAuditLog({
      actorId: null,
      action: "EMPLOYEE_SELF_REGISTERED",
      entityType: "Employee",
      entityId: employee.id,
      details: { employeeCode: employee.employeeCode, email },
    });

    return NextResponse.json({
      ok: true,
      pendingApproval: true,
      employeeCode: employee.employeeCode,
      message: "Pending admin approval. You will be able to sign in after an administrator approves your profile.",
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", issues: e.issues }, { status: 400 });
    }
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
