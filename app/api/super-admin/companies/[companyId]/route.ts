import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdminCompanyDrilldown } from "@/lib/super-admin-drilldown";
import { writeAuditLog } from "@/lib/audit";
import { deleteCompanyAndTenantData } from "@/lib/company-deletion";
import { companySlugSchema, normalizeCompanySlug, validateCompanySlug } from "@/lib/company-slug";
import { companyLogoUrlSchema } from "@/lib/company-logo-url";
import { companyWebsiteUrlSchema } from "@/lib/website-url";
import { z } from "zod";

const patchSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  slug: companySlugSchema.optional(),
  websiteUrl: companyWebsiteUrlSchema,
  logoUrl: companyLogoUrlSchema,
  primaryColor: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "Primary color must be a hex code like #c5a021.")
    .nullable()
    .optional(),
});

export async function GET(_req: Request, ctx: { params: Promise<{ companyId: string }> }) {
  try {
    const { companyId } = await requireSuperAdminCompanyDrilldown(ctx.params);

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        id: true,
        name: true,
        slug: true,
        websiteUrl: true,
        logoUrl: true,
        primaryColor: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { users: true, employees: true } },
      },
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found." }, { status: 404 });
    }

    return NextResponse.json({
      company: {
        ...company,
        createdAt: company.createdAt.toISOString(),
        updatedAt: company.updatedAt.toISOString(),
        userCount: company._count.users,
        employeeCount: company._count.employees,
      },
    });
  } catch (e) {
    const err = e as Error & { status?: number };
    return NextResponse.json({ error: err.message }, { status: err.status ?? 500 });
  }
}

export async function PATCH(req: Request, ctx: { params: Promise<{ companyId: string }> }) {
  try {
    const { session, companyId } = await requireSuperAdminCompanyDrilldown(ctx.params);
    const body = patchSchema.parse(await req.json());

    const existing = await prisma.company.findUnique({ where: { id: companyId } });
    if (!existing) {
      return NextResponse.json({ error: "Company not found." }, { status: 404 });
    }

    if (body.slug !== undefined) {
      const slug = normalizeCompanySlug(body.slug);
      const slugErr = validateCompanySlug(slug);
      if (slugErr) {
        return NextResponse.json({ error: slugErr }, { status: 409 });
      }
      if (slug !== existing.slug) {
        const taken = await prisma.company.findUnique({ where: { slug } });
        if (taken) {
          return NextResponse.json({ error: "Another company already uses this subdomain." }, { status: 409 });
        }
      }
    }

    const company = await prisma.company.update({
      where: { id: companyId },
      data: {
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.slug !== undefined ? { slug: normalizeCompanySlug(body.slug) } : {}),
        ...(body.websiteUrl !== undefined ? { websiteUrl: body.websiteUrl } : {}),
        ...(body.logoUrl !== undefined ? { logoUrl: body.logoUrl } : {}),
        ...(body.primaryColor !== undefined ? { primaryColor: body.primaryColor } : {}),
      },
    });

    await writeAuditLog({
      actorId: session.id,
      action: "COMPANY_UPDATED",
      entityType: "Company",
      entityId: company.id,
      details: {
        name: company.name,
        slug: company.slug,
        previousSlug: existing.slug !== company.slug ? existing.slug : undefined,
      },
    });

    return NextResponse.json({
      ok: true,
      company: {
        id: company.id,
        name: company.name,
        slug: company.slug,
        websiteUrl: company.websiteUrl,
        logoUrl: company.logoUrl,
        primaryColor: company.primaryColor,
        updatedAt: company.updatedAt.toISOString(),
      },
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", issues: e.issues }, { status: 400 });
    }
    const err = e as Error & { status?: number };
    return NextResponse.json({ error: err.message }, { status: err.status ?? 500 });
  }
}

const deleteSchema = z.object({
  confirmName: z.string().trim().min(1),
});

export async function DELETE(req: Request, ctx: { params: Promise<{ companyId: string }> }) {
  try {
    const { session, companyId } = await requireSuperAdminCompanyDrilldown(ctx.params);
    const body = deleteSchema.parse(await req.json());

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: { _count: { select: { users: true, employees: true } } },
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found." }, { status: 404 });
    }

    if (body.confirmName !== company.name) {
      return NextResponse.json(
        { error: "Confirmation name does not match. Type the exact company name to delete." },
        { status: 400 }
      );
    }

    await deleteCompanyAndTenantData(companyId);

    await writeAuditLog({
      actorId: session.id,
      action: "COMPANY_DELETED",
      entityType: "Company",
      entityId: companyId,
      details: {
        name: company.name,
        slug: company.slug,
        userCount: company._count.users,
        employeeCount: company._count.employees,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", issues: e.issues }, { status: 400 });
    }
    console.error("[company-delete]", e);
    const err = e as Error & { status?: number };
    const message = err.message?.includes("Foreign key constraint")
      ? "Could not delete company — related records still exist. Contact support."
      : err.message?.includes("User_company_required_unless_super_admin")
        ? "Could not delete company — staff accounts must be removed first."
        : (err.message ?? "Could not delete company.");
    return NextResponse.json({ error: message }, { status: err.status ?? 500 });
  }
}
