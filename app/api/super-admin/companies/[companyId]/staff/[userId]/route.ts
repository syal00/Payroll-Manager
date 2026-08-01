import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireSuperAdminCompanyDrilldown } from "@/lib/super-admin-drilldown";
import { Role } from "@/lib/enums";
import { writeAuditLog } from "@/lib/audit";
import { validateEmailDeliverable, emailValidationMessage } from "@/lib/email-validation";
import { splitDisplayName } from "@/lib/display-name";
import {
  assertCanRemoveMainAdmin,
  mapStaffRow,
  requireCompanyStaffMember,
  staffListSelect,
} from "@/lib/company-staff";
import { z } from "zod";

const patchSchema = z
  .object({
    firstName: z.string().trim().min(1).max(60).optional(),
    lastName: z.string().trim().min(1).max(60).optional(),
    contactEmail: z.string().trim().email().max(320).optional(),
    password: z.string().min(8).max(128).optional(),
    status: z.enum(["active", "suspended"]).optional(),
  })
  .refine(
    (d) =>
      d.firstName !== undefined ||
      d.lastName !== undefined ||
      d.contactEmail !== undefined ||
      d.password !== undefined ||
      d.status !== undefined,
    { message: "Provide at least one field to update" }
  );

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ companyId: string; userId: string }> }
) {
  try {
    const { session, companyId } = await requireSuperAdminCompanyDrilldown(ctx.params);
    const { userId } = await ctx.params;
    const body = patchSchema.parse(await req.json());
    const member = await requireCompanyStaffMember(companyId, userId);

    if (body.status === "suspended" && member.deletedAt == null) {
      await assertCanRemoveMainAdmin(companyId, userId);
    }

    const firstName = body.firstName ?? splitDisplayName(member.name).firstName;
    const lastName = body.lastName ?? splitDisplayName(member.name).lastName;
    const name = `${firstName.trim()} ${lastName.trim()}`.trim();

    let contactEmail = member.contactEmail;
    if (body.contactEmail !== undefined) {
      const deliverable = await validateEmailDeliverable(body.contactEmail);
      if (!deliverable.valid) {
        return NextResponse.json(
          { error: emailValidationMessage(deliverable.reason), reason: deliverable.reason },
          { status: 400 }
        );
      }
      contactEmail = body.contactEmail.trim().toLowerCase();
      if (contactEmail !== member.contactEmail) {
        const taken = await prisma.user.findFirst({
          where: { contactEmail, NOT: { id: member.id } },
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
      deletedAt?: Date | null;
      tokenVersion?: { increment: number };
    } = { name, contactEmail };

    if (body.password) {
      data.passwordHash = await bcrypt.hash(body.password, 12);
      data.mustChangePassword = true;
      data.tokenVersion = { increment: 1 };
    }

    if (body.status === "suspended") {
      data.deletedAt = new Date();
      data.tokenVersion = { increment: 1 };
    } else if (body.status === "active") {
      data.deletedAt = null;
    }

    const updated = await prisma.user.update({
      where: { id: member.id },
      data,
      select: staffListSelect,
    });

    await writeAuditLog({
      actorId: session.id,
      action: body.status === "suspended" ? "SUPER_ADMIN_STAFF_SUSPENDED" : "SUPER_ADMIN_STAFF_UPDATED",
      entityType: "User",
      entityId: member.id,
      details: {
        companyId,
        status: body.status,
        username: updated.username,
        role: updated.role,
      },
    });

    return NextResponse.json({ ok: true, staff: mapStaffRow(updated) });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", issues: e.issues }, { status: 400 });
    }
    const err = e as Error & { status?: number };
    return NextResponse.json({ error: err.message }, { status: err.status ?? 500 });
  }
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ companyId: string; userId: string }> }
) {
  try {
    const { session, companyId } = await requireSuperAdminCompanyDrilldown(ctx.params);
    const { userId } = await ctx.params;
    const member = await assertCanRemoveMainAdmin(companyId, userId);

    const fallbackAdmin = await prisma.user.findFirst({
      where: {
        companyId,
        role: Role.MAIN_ADMIN,
        deletedAt: null,
        NOT: { id: member.id },
      },
      select: { id: true },
    });

    await prisma.$transaction(async (tx) => {
      if (fallbackAdmin) {
        await tx.approval.updateMany({
          where: { adminId: member.id },
          data: { adminId: fallbackAdmin.id },
        });
      }
      await tx.user.delete({ where: { id: member.id } });
    });

    await writeAuditLog({
      actorId: session.id,
      action: "SUPER_ADMIN_STAFF_DELETED",
      entityType: "User",
      entityId: member.id,
      details: {
        companyId,
        username: member.username,
        role: member.role,
        assignedEmployeeCount: member._count.assignedEmployees,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    const err = e as Error & { status?: number };
    const message = err.message?.includes("Foreign key constraint")
      ? "Could not delete account — related records still exist."
      : err.message;
    return NextResponse.json({ error: message }, { status: err.status ?? 500 });
  }
}
