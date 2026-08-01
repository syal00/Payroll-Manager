import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/api-auth";
import { Role, TimesheetStatus } from "@/lib/enums";
import { writeAuditLog } from "@/lib/audit";
import { validateEmailDeliverable, emailValidationMessage } from "@/lib/email-validation";
import { createStaffUser, splitDisplayName } from "@/lib/staff-account";
import { companySlugSchema, normalizeCompanySlug, validateCompanySlug } from "@/lib/company-slug";
import { companyLogoUrlSchema } from "@/lib/company-logo-url";
import { companyWebsiteUrlSchema } from "@/lib/website-url";
import { createInitialPayPeriod } from "@/lib/company-provisioning";
import { DEFAULT_COMPANY_TIMEZONE } from "@/lib/company-timezones";
import { DEFAULT_INITIAL_STAFF_PASSWORD } from "@/lib/default-staff-password";
import { sendWelcomeAccessGrantedEmail } from "@/lib/email/welcome-access-granted";
import { getPlatformWorkingCompanyId } from "@/lib/platform-working-company";
import { getCompanyMirrorStatus } from "@/lib/company-mirror";
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

    const workingCompanyId = await getPlatformWorkingCompanyId();
    const companyMirror = await getCompanyMirrorStatus();

    return NextResponse.json({
      workingCompanyId,
      companyMirror,
      companies: companies.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        websiteUrl: c.websiteUrl,
        logoUrl: c.logoUrl,
        primaryColor: c.primaryColor,
        createdAt: c.createdAt.toISOString(),
        employeeCount: employeeCountByCompany.get(c.id) ?? 0,
        managerCount: managerCountByCompany.get(c.id) ?? 0,
        timesheetPendingCount: pendingCountByCompany.get(c.id) ?? 0,
        isWorkingCompany: workingCompanyId === c.id,
      })),
    });
  } catch (e) {
    const err = e as Error & { status?: number };
    return NextResponse.json({ error: err.message }, { status: err.status ?? 500 });
  }
}

/** Kept in sync with the reserved-subdomain list in proxy.ts — these can never resolve to a tenant. */
const createSchema = z.object({
  name: z.string().trim().min(1).max(120),
  slug: companySlugSchema,
  websiteUrl: companyWebsiteUrlSchema,
  logoUrl: companyLogoUrlSchema,
  timezone: z.string().trim().min(1).max(64).default(DEFAULT_COMPANY_TIMEZONE),
  payPeriod: z
    .object({
      type: z.enum(["biweekly", "custom"]),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    })
    .optional(),
  /** Optional initial staff account — sign-in uses the contact email; welcome email goes to the same address. */
  initialAdmin: z
    .object({
      contactEmail: z.string().trim().email().max(320),
      name: z.string().trim().min(1).max(120),
      role: z.enum([Role.MAIN_ADMIN, Role.MANAGER]).default(Role.MAIN_ADMIN),
      password: z.string().min(8).max(128).optional(),
      mustChangePassword: z.boolean().optional(),
    })
    .optional(),
});

export async function POST(req: Request) {
  try {
    const session = await requireSuperAdmin();
    const body = createSchema.parse(await req.json());

    const slug = normalizeCompanySlug(body.slug);
    const slugErr = validateCompanySlug(slug);
    if (slugErr) {
      return NextResponse.json({ error: slugErr }, { status: 409 });
    }

    const existingCompany = await prisma.company.findUnique({ where: { slug } });
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
        slug,
        websiteUrl: body.websiteUrl ?? null,
        logoUrl: body.logoUrl ?? null,
        timezone: body.timezone ?? DEFAULT_COMPANY_TIMEZONE,
      },
    });

    let payPeriod: { id: string; name: string | null; startDate: Date; endDate: Date } | null = null;
    if (body.payPeriod) {
      payPeriod = await createInitialPayPeriod({
        companyId: company.id,
        type: body.payPeriod.type,
        customStart: body.payPeriod.startDate,
        customEnd: body.payPeriod.endDate,
      });
    }

    await writeAuditLog({
      actorId: session.id,
      action: "COMPANY_CREATED",
      entityType: "Company",
      entityId: company.id,
      details: { name: company.name, slug: company.slug },
    });

    let initialAdmin: {
      id: string;
      username: string;
      contactEmail: string;
      name: string;
      role: string;
      welcomeEmailSent: boolean;
      welcomeEmailDetail?: string;
    } | null = null;
    if (body.initialAdmin) {
      const password = body.initialAdmin.password ?? DEFAULT_INITIAL_STAFF_PASSWORD;
      const mustChangePassword = body.initialAdmin.mustChangePassword ?? true;
      const passwordHash = await bcrypt.hash(password, 12);
      const { firstName, lastName } = splitDisplayName(body.initialAdmin.name);
      const admin = await createStaffUser({
        firstName,
        lastName,
        contactEmail: body.initialAdmin.contactEmail,
        passwordHash,
        role: body.initialAdmin.role,
        companyId: company.id,
        name: body.initialAdmin.name,
        createdById: session.id,
        mustChangePassword,
      });

      const welcomeResult = await sendWelcomeAccessGrantedEmail({
        personalEmail: admin.contactEmail,
        staffDisplayName: admin.name,
        companyName: company.name,
        companySlug: company.slug,
        companyWebsiteUrl: company.websiteUrl,
        role: body.initialAdmin.role,
        loginEmail: admin.username,
        temporaryPassword: password,
      });

      initialAdmin = {
        ...admin,
        role: body.initialAdmin.role,
        welcomeEmailSent: welcomeResult.sent,
        welcomeEmailDetail: welcomeResult.detail,
      };

      await writeAuditLog({
        actorId: session.id,
        action: body.initialAdmin.role === Role.MAIN_ADMIN ? "MAIN_ADMIN_ACCOUNT_CREATED" : "MANAGER_ACCOUNT_CREATED",
        entityType: "User",
        entityId: admin.id,
        details: {
          username: admin.username,
          contactEmail: admin.contactEmail,
          name: admin.name,
          companyId: company.id,
          role: body.initialAdmin.role,
          welcomeEmailSent: welcomeResult.sent,
        },
      });
    }

    return NextResponse.json({
      ok: true,
      company: {
        id: company.id,
        name: company.name,
        slug: company.slug,
        websiteUrl: company.websiteUrl,
        logoUrl: company.logoUrl,
        timezone: company.timezone,
        createdAt: company.createdAt.toISOString(),
      },
      payPeriod: payPeriod
        ? {
            id: payPeriod.id,
            name: payPeriod.name,
            startDate: payPeriod.startDate.toISOString(),
            endDate: payPeriod.endDate.toISOString(),
          }
        : null,
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
