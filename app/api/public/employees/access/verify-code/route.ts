import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeEmployeeEmail } from "@/lib/employee-code";
import { z } from "zod";

const bodySchema = z.object({
  email: z.string().trim().email().max(320),
  code: z.string().trim().length(6),
});

export async function POST(req: Request) {
  try {
    const body = bodySchema.parse(await req.json());
    const email = normalizeEmployeeEmail(body.email);

    const employee = await prisma.employee.findUnique({
      where: { email },
      select: {
        id: true,
        employeeCode: true,
        deletedAt: true,
        isApproved: true,
        otpCode: true,
        otpExpires: true,
      },
    });

    if (!employee || employee.deletedAt) {
      return NextResponse.json({ error: "No employee profile found." }, { status: 404 });
    }

    if (!employee.isApproved) {
      return NextResponse.json(
        { error: "Your account is pending admin approval." },
        { status: 403 }
      );
    }

    if (!employee.otpCode || !employee.otpExpires) {
      return NextResponse.json({ error: "Request a new code first." }, { status: 400 });
    }

    if (employee.otpExpires.getTime() < Date.now()) {
      return NextResponse.json({ error: "That code has expired. Request a new one." }, { status: 400 });
    }

    if (employee.otpCode !== body.code.trim()) {
      return NextResponse.json({ error: "Invalid code." }, { status: 401 });
    }

    await prisma.employee.update({
      where: { id: employee.id },
      data: { otpCode: null, otpExpires: null },
    });

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
