import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/api-auth";
import { Role, TimesheetStatus } from "@/lib/enums";
import { writeAuditLog } from "@/lib/audit";
import { validateEmailDeliverable, emailValidationMessage } from "@/lib/email-validation";
import { createStaffUser, splitDisplayName } from "@/lib/staff-account";
import { z } from "zod";

/**
 * Cross-company aggregate list — the ONLY super-admin endpoint allowed to have zero companyId
 * filter, because it never returns row-level data, only per-company counts. Any row-level data
 * (employees, timesheets, payslips) belongs under /api/super-admin/companies/[companyId]/* instead,
 * where a companyId filter is mandatory (see lib/manager-scope.ts scopeForCompanyDrilldown).
 */
export async function GET() {
  try {
    await requireSuperAdmin();

    const companies = await prisma.company.findMany({ orderBy: { name: "asc" } });

    const [employeeGroups, managerGroups, pendingTimesheets] = await Promise.all([
      prisma.employee.groupBy({
        by: ["companyId"],
        _count: { _all: true },
        where: { deletedAt: null, isApproved: true, companyId: { not: null } },
      }),
      prisma.user.groupBy({
        by: ["companyId"],
        _count: { _all: true },
        where: { role: Role.MANAGER, companyId: { not: null } },
      }),
      // Timesheet has no direct companyId column (only via its Employee relation), so Prisma's
      // groupBy can't aggregate it directly — tally in JS from a minimal projection instead. Still
      // no row-level business data (hours, names, etc.) leaves this endpoint.
      prisma.timesheet.findMany({
        where: {
          status: { in: [TimesheetStatus.PENDING, TimesheetStatus.UNDER_REVIEW] },
          employee: { companyId: { not: null } },
        },
        select: { employee: { select: { companyId: true } } },
      }),
    ]);

    const employeeCountByCompany = new Map(employeeGroups.map((g) => [g.companyId as string, g._count._all]));
    const managerCountByCompany = new Map(managerGroups.map((g) => [g.companyId as string, g._count._all]));
    const pendingCountByCompany = new Map<string, number>();
    for (const ts of pendingTimesheets) {
      const cid = ts.employee.companyId;
      if (!cid) continue;
      pendingCountByCompany.set(cid, (pendingCountByCompany.get(cid) ?? 0) + 1);
    }

    return NextResponse.json({
      companies: companies.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        logoUrl: c.logoUrl,
        employeeCount: employeeCountByCompany.get(c.id) ?? 0,
        managerCount: managerCountByCompany.get(c.id) ?? 0,
        timesheetPendingCount: pendingCountByCompany.get(c.id) ?? 0,
      })),
    });
  } catch (e) {
    const err = e as Error & { status?: number };
    return NextResponse.json({ error: err.message }, { status: err.status ?? 500 });
  }
}

/** Kept in sync with the reserved-subdomain list in proxy.ts — these can never resolve to a tenant. */
const RESERVED_SLUGS = new Set(["app", "www"]);

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const createSchema = z.object({
  name: z.string().trim().min(1).max(120),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(2)
    .max(63)
    .regex(SLUG_PATTERN, "Slug must be lowercase alphanumeric with single hyphens (e.g. acme-corp)."),
  logoUrl: z.string().trim().url().max(2048).nullable().optional(),
  /** Optional initial staff account for the new tenant. No email-invite flow exists yet in this
   *  codebase (see lib/api-auth.ts/managers route) — the caller sets the password directly, same
   *  as manager creation, and communicates it out of band. */
  initialAdmin: z
    .object({
      contactEmail: z.string().trim().email().max(320),
      name: z.string().trim().min(1).max(120),
      password: z.string().min(8).max(128),
    })
    .optional(),
});

export async function POST(req: Request) {
  try {
    const session = await requireSuperAdmin();
    const body = createSchema.parse(await req.json());

    if (RESERVED_SLUGS.has(body.slug)) {
      return NextResponse.json({ error: "This slug is reserved and cannot be used." }, { status: 409 });
    }

    const existingCompany = await prisma.company.findUnique({ where: { slug: body.slug } });
    if (existingCompany) {
      return NextResponse.json({ error: "A company with this slug already exists." }, { status: 409 });
    }

    if (body.initialAdmin) {
      const deliverable = await validateEmailDeliverable(body.initialAdmin.contactEmail);
      if (!deliverable.valid) {
        return NextResponse.json(
          { error: emailValidationMessage(deliverable.reason), reason: deliverable.reason },
          { status: 400 }
        );
      }

      const existingUser = await prisma.user.findUnique({
        where: { contactEmail: body.initialAdmin.contactEmail.toLowerCase() },
      });
      if (existingUser) {
        return NextResponse.json(
          { error: "An account with this contact email already exists. Use a different email." },
          { status: 409 }
        );
      }
    }

    const company = await prisma.company.create({
      data: {
        name: body.name,
        slug: body.slug,
        logoUrl: body.logoUrl ?? null,
      },
    });

    await writeAuditLog({
      actorId: session.id,
      action: "COMPANY_CREATED",
      entityType: "Company",
      entityId: company.id,
      details: { name: company.name, slug: company.slug },
    });

    let initialAdmin: { id: string; username: string; contactEmail: string; name: string } | null = null;
    if (body.initialAdmin) {
      const passwordHash = await bcrypt.hash(body.initialAdmin.password, 12);
      const { firstName, lastName } = splitDisplayName(body.initialAdmin.name);
      const admin = await createStaffUser({
        firstName,
        lastName,
        contactEmail: body.initialAdmin.contactEmail,
        passwordHash,
        role: Role.MAIN_ADMIN,
        companyId: company.id,
        name: body.initialAdmin.name,
        createdById: session.id,
      });
      initialAdmin = admin;

      await writeAuditLog({
        actorId: session.id,
        action: "MAIN_ADMIN_ACCOUNT_CREATED",
        entityType: "User",
        entityId: admin.id,
        details: { username: admin.username, contactEmail: admin.contactEmail, name: admin.name, companyId: company.id },
      });
    }

    return NextResponse.json({
      ok: true,
      company: {
        id: company.id,
        name: company.name,
        slug: company.slug,
        logoUrl: company.logoUrl,
        createdAt: company.createdAt.toISOString(),
      },
      initialAdmin,
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", issues: e.issues }, { status: 400 });
    }
    const err = e as Error & { status?: number };
    return NextResponse.json({ error: err.message }, { status: err.status ?? 500 });
  }
}
