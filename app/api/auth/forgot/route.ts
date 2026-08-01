import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeContactEmail } from "@/lib/display-name";
import { z } from "zod";

const bodySchema = z.object({
  email: z.string().trim().email().max(320),
});

export async function POST(req: Request) {
  try {
    const body = bodySchema.parse(await req.json());
    const contactEmail = normalizeContactEmail(body.email);

    const employee = await prisma.employee.findFirst({
      where: { contactEmail, deletedAt: null },
      select: { name: true, employeeCode: true },
      orderBy: { createdAt: "asc" },
    });

    if (!employee) {
      return NextResponse.json({ found: false, message: "No account found" });
    }

    const admin = await prisma.user.findFirst({
      where: { role: { in: ["MAIN_ADMIN", "ADMIN"] } },
      orderBy: { createdAt: "asc" },
      select: { contactEmail: true },
    });

    return NextResponse.json({
      found: true,
      message: `Your Employee ID is ${employee.employeeCode}. Contact your admin at ${admin?.contactEmail ?? "your payroll administrator"}.`,
      employeeName: employee.name,
      employeeCode: employee.employeeCode,
      adminEmail: admin?.contactEmail ?? null,
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request", issues: e.issues }, { status: 400 });
    }
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
