import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMainAdmin, requireStaff, resolveCompanyId } from "@/lib/api-auth";
import { employeeWhereForStaff } from "@/lib/manager-scope";
import { nextEmployeeCode } from "@/lib/employee-code";
import { writeAuditLog } from "@/lib/audit";
import { validateEmailDeliverable, emailValidationMessage } from "@/lib/email-validation";
import { createEmployeeProfile } from "@/lib/staff-account";
import { z } from "zod";
import type { Prisma } from "@prisma/client";

const querySchema = z.object({
  status: z.enum(["active", "deleted", "all", "pending"]).default("active"),
});

const createSchema = z.object({
  firstName: z.string().trim().min(1).max(60),
  lastName: z.string().trim().min(1).max(60),
  contactEmail: z.string().trim().email().max(320),
  companyId: z.string().trim().min(1).optional(),
});

export async function GET(req: Request) {
  try {
    const session = await requireStaff();
    const url = new URL(req.url);
    const { status } = querySchema.parse(Object.fromEntries(url.searchParams.entries()));

    const where: Prisma.EmployeeWhereInput = {};
    if (status === "active") {
      where.deletedAt = null;
      where.isApproved = true;
    }
    if (status === "pending") {
      where.deletedAt = null;
      where.isApproved = false;
    }
    if (status === "deleted") where.deletedAt = { not: null };

    const scope = employeeWhereForStaff(session);
    if (scope) {
      Object.assign(where, scope);
    }

    const employees = await prisma.employee.findMany({
      where,
      orderBy: { name: "asc" },
      include: {
        user: { select: { id: true, username: true, contactEmail: true, name: true } },
        _count: { select: { timesheets: true, payslips: true } },
      },
    });

    return NextResponse.json({
      employees: employees.map((e) => ({
        id: e.id,
        name: e.name,
        username: e.username,
        contactEmail: e.contactEmail,
        employeeCode: e.employeeCode,
        deletedAt: e.deletedAt?.toISOString() ?? null,
        isApproved: e.isApproved,
        department: e.department,
        jobTitle: e.jobTitle,
        timesheetCount: e._count.timesheets,
        payslipCount: e._count.payslips,
        linkedUser: e.user,
      })),
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid query", issues: e.issues }, { status: 400 });
    }
    const err = e as Error & { status?: number };
    return NextResponse.json({ error: err.message }, { status: err.status ?? 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireMainAdmin();
    const body = createSchema.parse(await req.json());

    const deliverable = await validateEmailDeliverable(body.contactEmail);
    if (!deliverable.valid) {
      return NextResponse.json(
        { error: emailValidationMessage(deliverable.reason), reason: deliverable.reason },
        { status: 400 }
      );
    }

    const companyId = resolveCompanyId(session, body.companyId);
    const employeeCode = await nextEmployeeCode();
    const employee = await createEmployeeProfile({
      firstName: body.firstName,
      lastName: body.lastName,
      contactEmail: body.contactEmail,
      companyId,
      employeeCode,
      isApproved: true,
    });

    await writeAuditLog({
      actorId: session.id,
      action: "EMPLOYEE_CREATED_BY_ADMIN",
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
      employee: {
        id: employee.id,
        name: employee.name,
        username: employee.username,
        contactEmail: employee.contactEmail,
        employeeCode: employee.employeeCode,
      },
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", issues: e.issues }, { status: 400 });
    }
    const err = e as Error & { status?: number };
    const message = err.message ?? "Server error";
    const status = message.includes("already exists") ? 409 : (err.status ?? 500);
    return NextResponse.json({ error: message }, { status });
  }
}
