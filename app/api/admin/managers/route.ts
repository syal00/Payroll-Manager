import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireMainAdmin, resolveCompanyId } from "@/lib/api-auth";
import { isSuperAdminRole } from "@/lib/roles";
import { Role } from "@/lib/enums";
import { writeAuditLog } from "@/lib/audit";
import { validateEmailDeliverable, emailValidationMessage } from "@/lib/email-validation";
import { createStaffUser } from "@/lib/staff-account";
import { z } from "zod";
import type { Prisma } from "@prisma/client";

const createSchema = z.object({
  firstName: z.string().trim().min(1).max(60),
  lastName: z.string().trim().min(1).max(60),
  contactEmail: z.string().trim().email().max(320),
  password: z.string().min(8).max(128),
  companyId: z.string().trim().min(1).optional(),
});

export async function GET() {
  try {
    const session = await requireMainAdmin();
    const where: Prisma.UserWhereInput = { role: Role.MANAGER };
    if (!isSuperAdminRole(session.role)) where.companyId = session.companyId;
    const managers = await prisma.user.findMany({
      where,
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        username: true,
        contactEmail: true,
        name: true,
        createdAt: true,
        createdBy: { select: { id: true, username: true, contactEmail: true, name: true } },
      },
    });
    return NextResponse.json({
      managers: managers.map((m) => ({
        id: m.id,
        username: m.username,
        contactEmail: m.contactEmail,
        name: m.name,
        createdAt: m.createdAt.toISOString(),
        createdByUsername: m.createdBy?.username ?? null,
      })),
    });
  } catch (e) {
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

    const passwordHash = await bcrypt.hash(body.password, 12);
    const user = await createStaffUser({
      firstName: body.firstName,
      lastName: body.lastName,
      contactEmail: body.contactEmail,
      passwordHash,
      role: Role.MANAGER,
      companyId: resolveCompanyId(session, body.companyId),
      createdById: session.id,
    });

    await writeAuditLog({
      actorId: session.id,
      action: "MANAGER_ACCOUNT_CREATED",
      entityType: "User",
      entityId: user.id,
      details: { username: user.username, contactEmail: user.contactEmail, name: user.name },
    });

    return NextResponse.json({
      ok: true,
      manager: {
        id: user.id,
        username: user.username,
        contactEmail: user.contactEmail,
        name: user.name,
        createdAt: user.createdAt.toISOString(),
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
