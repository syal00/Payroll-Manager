import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/api-auth";
import { getSlugValidationReason, normalizeCompanySlug } from "@/lib/company-slug";

export async function GET(req: Request) {
  try {
    await requireSuperAdmin();
    const { searchParams } = new URL(req.url);
    const slug = normalizeCompanySlug(searchParams.get("slug") ?? "");
    const excludeId = searchParams.get("excludeId")?.trim() || null;

    if (!slug) {
      return NextResponse.json({
        slug: "",
        formatValid: false,
        available: false,
        status: "invalid_format" as const,
        message: "Enter a subdomain slug.",
      });
    }

    const formatReason = getSlugValidationReason(slug);
    if (formatReason) {
      return NextResponse.json({
        slug,
        formatValid: false,
        available: false,
        status: formatReason,
        message:
          formatReason === "reserved"
            ? "This subdomain is reserved and cannot be used."
            : formatReason === "too_short"
              ? "Subdomain must be at least 2 characters."
              : "Use lowercase letters, numbers, and hyphens only (no leading/trailing hyphen).",
      });
    }

    const existing = await prisma.company.findUnique({
      where: { slug },
      select: { id: true },
    });

    const taken = Boolean(existing && existing.id !== excludeId);

    return NextResponse.json({
      slug,
      formatValid: true,
      available: !taken,
      status: taken ? ("taken" as const) : ("available" as const),
      message: taken ? "This subdomain is already in use." : "Subdomain is available.",
    });
  } catch (e) {
    const err = e as Error & { status?: number };
    return NextResponse.json({ error: err.message }, { status: err.status ?? 500 });
  }
}
