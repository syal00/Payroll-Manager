import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireMainAdmin } from "@/lib/api-auth";
import { requireManagerInCompany } from "@/lib/manager-admin";
import { writeAuditLog } from "@/lib/audit";
import { validateEmailDeliverable, emailValidationMessage } from "@/lib/email-validation";
import { splitDisplayName } from "@/lib/display-name";
import { z } from "zod";

const patchSchema = z
  .object({
    firstName: z.string().trim().min(1).max(60).optional(),
    lastName: z.string().trim().min(1).max(60).optional(),
    contactEmail: z.string().trim().email().max(320).optional(),
    password: z.string().min(8).max(128).optional(),
  })
  .refine(
    (d) =>
      d.firstName !== undefined ||
      d.lastName !== undefined ||
      d.contactEmail !== undefined ||
      d.password !== undefined,
    { message: "Provide at least one field to update" }
  );

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireMainAdmin();
    const { id } = await ctx.params;
    const body = patchSchema.parse(await req.json());
    const { manager } = await requireManagerInCompany(session, id);

    const firstName = body.firstName ?? splitDisplayName(manager.name).firstName;
    const lastName = body.lastName ?? splitDisplayName(manager.name).lastName;
    const name = `${firstName.trim()} ${lastName.trim()}`.trim();

    let contactEmail = manager.contactEmail;
    if (body.contactEmail !== undefined) {
      const deliverable = await validateEmailDeliverable(body.contactEmail);
      if (!deliverable.valid) {
        return NextResponse.json(
          { error: emailValidationMessage(deliverable.reason), reason: deliverable.reason },
          { status: 400 }
        );
      }
      contactEmail = body.contactEmail.trim().toLowerCase();
      if (contactEmail !== manager.contactEmail) {
        const taken = await prisma.user.findFirst({
          where: { contactEmail, NOT: { id: manager.id } },
          select: { id: true },
        });
        if (taken) {
          return NextResponse.json({ error: "An account with this contact email already exists." }, { status: 409 });
        }
      }
    }

    const data: {
      name: string;
      contactEmail: string;
      passwordHash?: string;
      mustChangePassword?: boolean;
      tokenVersion?: { increment: number };
    } = { name, contactEmail };

    if (body.password) {
      data.passwordHash = await bcrypt.hash(body.password, 12);
      data.mustChangePassword = true;
      data.tokenVersion = { increment: 1 };
    }

    const updated = await prisma.user.update({
      where: { id: manager.id },
      data,
      select: {
        id: true,
        username: true,
        contactEmail: true,
        name: true,
        createdAt: true,
      },
    });

    await writeAuditLog({
      actorId: session.id,
      action: "MANAGER_ACCOUNT_UPDATED",
      entityType: "User",
      entityId: manager.id,
      details: {
        username: updated.username,
        previousContactEmail: manager.contactEmail,
        contactEmail: updated.contactEmail,
        previousName: manager.name,
        name: updated.name,
        passwordReset: Boolean(body.password),
      },
    });

    return NextResponse.json({
      ok: true,
      manager: {
        ...updated,
        createdAt: updated.createdAt.toISOString(),
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

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireMainAdmin();
    const { id } = await ctx.params;

    if (id === session.id) {
      return NextResponse.json({ error: "You cannot delete your own account." }, { status: 400 });
    }

    const { manager } = await requireManagerInCompany(session, id);

    await prisma.$transaction(async (tx) => {
      await tx.approval.updateMany({
        where: { adminId: manager.id },
        data: { adminId: session.id },
      });
      await tx.user.delete({ where: { id: manager.id } });
    });

    await writeAuditLog({
      actorId: session.id,
      action: "MANAGER_ACCOUNT_DELETED",
      entityType: "User",
      entityId: manager.id,
      details: {
        username: manager.username,
        contactEmail: manager.contactEmail,
        name: manager.name,
        assignedEmployeeCount: manager._count.assignedEmployees,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    const err = e as Error & { status?: number };
    const message = err.message?.includes("Foreign key constraint")
      ? "Could not delete manager — related records still exist."
      : err.message;
    return NextResponse.json({ error: message }, { status: err.status ?? 500 });
  }
}
