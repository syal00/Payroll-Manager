import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireSuperAdminCompanyDrilldown } from "@/lib/super-admin-drilldown";
import { DEFAULT_INITIAL_STAFF_PASSWORD } from "@/lib/default-staff-password";
import { sendWelcomeAccessGrantedEmail } from "@/lib/email/welcome-access-granted";
import { z } from "zod";

const bodySchema = z.object({
  userId: z.string().trim().min(1),
});

/** Resend onboarding email to a staff member's personal email (resets temp password). */
export async function POST(req: Request, ctx: { params: Promise<{ companyId: string }> }) {
  try {
    await requireSuperAdminCompanyDrilldown(ctx.params);
    const { companyId } = await ctx.params;
    const { userId } = bodySchema.parse(await req.json());

    const [company, user] = await Promise.all([
      prisma.company.findUnique({
        where: { id: companyId },
        select: { id: true, name: true, slug: true, websiteUrl: true },
      }),
      prisma.user.findFirst({
        where: { id: userId, companyId },
        select: { id: true, username: true, contactEmail: true, name: true, role: true },
      }),
    ]);

    if (!company) {
      return NextResponse.json({ error: "Company not found." }, { status: 404 });
    }
    if (!user) {
      return NextResponse.json({ error: "Staff account not found for this company." }, { status: 404 });
    }

    const passwordHash = await bcrypt.hash(DEFAULT_INITIAL_STAFF_PASSWORD, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, mustChangePassword: true },
    });

    const welcomeResult = await sendWelcomeAccessGrantedEmail({
      personalEmail: user.contactEmail,
      staffDisplayName: user.name,
      companyName: company.name,
      companySlug: company.slug,
      companyWebsiteUrl: company.websiteUrl,
      role: user.role,
      generatedUsername: user.username,
      temporaryPassword: DEFAULT_INITIAL_STAFF_PASSWORD,
    });

    return NextResponse.json({
      ok: true,
      welcomeEmailSent: welcomeResult.sent,
      welcomeEmailDetail: welcomeResult.detail,
      to: user.contactEmail,
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", issues: e.issues }, { status: 400 });
    }
    const err = e as Error & { status?: number };
    return NextResponse.json({ error: err.message }, { status: err.status ?? 500 });
  }
}
