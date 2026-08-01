import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireSuperAdminCompanyDrilldown } from "@/lib/super-admin-drilldown";
import { Role } from "@/lib/enums";
import { writeAuditLog } from "@/lib/audit";
import { validateEmailDeliverable, emailValidationMessage } from "@/lib/email-validation";
import {
  COMPANY_STAFF_ROLES,
  mapStaffRow,
  provisionCompanyStaffUser,
  staffListSelect,
} from "@/lib/company-staff";
import { normalizeStaffRoleInput, staffRoleInputError } from "@/lib/staff-roles";
import { z } from "zod";
import type { Prisma } from "@prisma/client";

const querySchema = z.object({
  status: z.enum(["active", "suspended", "all"]).default("active"),
});

const createSchema = z.object({
  firstName: z.string().trim().min(1).max(60),
  lastName: z.string().trim().min(1).max(60),
  contactEmail: z.string().trim().email().max(320),
  password: z.string().min(8).max(128),
  role: z.string().trim().min(1).max(40),
});

export async function GET(req: Request, ctx: { params: Promise<{ companyId: string }> }) {
  try {
    const { session, companyId } = await requireSuperAdminCompanyDrilldown(ctx.params);
    const url = new URL(req.url);
    const { status } = querySchema.parse(Object.fromEntries(url.searchParams.entries()));

    const where: Prisma.UserWhereInput = {
      companyId,
      role: { in: [...COMPANY_STAFF_ROLES] },
    };
    if (status === "active") where.deletedAt = null;
    if (status === "suspended") where.deletedAt = { not: null };

    const staff = await prisma.user.findMany({
      where,
      orderBy: [{ role: "asc" }, { createdAt: "asc" }],
      select: staffListSelect,
    });

    return NextResponse.json({ staff: staff.map(mapStaffRow) });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Bad query", issues: e.issues }, { status: 400 });
    }
    const err = e as Error & { status?: number };
    return NextResponse.json({ error: err.message }, { status: err.status ?? 500 });
  }
}

export async function POST(req: Request, ctx: { params: Promise<{ companyId: string }> }) {
  try {
    const { session, companyId } = await requireSuperAdminCompanyDrilldown(ctx.params);
    const body = createSchema.parse(await req.json());
    const staffRole = normalizeStaffRoleInput(body.role);
    if (!staffRole) {
      return NextResponse.json({ error: staffRoleInputError(body.role) }, { status: 400 });
    }

    const deliverable = await validateEmailDeliverable(body.contactEmail);
    if (!deliverable.valid) {
      return NextResponse.json(
        { error: emailValidationMessage(deliverable.reason), reason: deliverable.reason },
        { status: 400 }
      );
    }

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { name: true, slug: true, websiteUrl: true },
    });
    if (!company) {
      return NextResponse.json({ error: "Company not found." }, { status: 404 });
    }

    const passwordHash = await bcrypt.hash(body.password, 12);
    const provisioned = await provisionCompanyStaffUser({
      companyId,
      companyName: company.name,
      firstName: body.firstName,
      lastName: body.lastName,
      contactEmail: body.contactEmail,
      passwordHash,
      role: staffRole,
      createdById: session.id,
    });

    if (!provisioned.ok) {
      return NextResponse.json(
        { error: provisioned.error, hint: provisioned.hint },
        { status: provisioned.status }
      );
    }

    const user = provisioned.user;

    await writeAuditLog({
      actorId: session.id,
      action: provisioned.reactivated ? "SUPER_ADMIN_STAFF_REACTIVATED" : "SUPER_ADMIN_STAFF_CREATED",
      entityType: "User",
      entityId: user.id,
      details: {
        companyId,
        role: staffRole,
        username: user.username,
        contactEmail: user.contactEmail,
        reactivated: provisioned.reactivated,
      },
    });

    return NextResponse.json({
      ok: true,
      reactivated: provisioned.reactivated,
      staff: {
        id: user.id,
        username: user.username,
        contactEmail: user.contactEmail,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt.toISOString(),
      },
      temporaryPassword: body.password,
      company: {
        name: company.name,
        slug: company.slug,
        websiteUrl: company.websiteUrl,
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
