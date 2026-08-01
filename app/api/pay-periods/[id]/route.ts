import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/api-auth";
import { writeAuditLog } from "@/lib/audit";
import { deletePayPeriodWithData, clearCurrentPayPeriods, requireStaffCompanyId } from "@/lib/pay-period-company";
import { z } from "zod";

const patchSchema = z.object({
  name: z.string().optional().nullable(),
  status: z.enum(["OPEN", "CLOSED", "PROCESSING"]).optional(),
  isCurrent: z.boolean().optional(),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireStaff();
    const companyId = requireStaffCompanyId(session);
    const { id } = await ctx.params;
    const body = patchSchema.parse(await req.json());
    const existing = await prisma.payPeriod.findFirst({ where: { id, companyId } });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const updated = await prisma.$transaction(async (tx) => {
      if (body.isCurrent === true) {
        await clearCurrentPayPeriods(tx, companyId);
      }
      return tx.payPeriod.update({
        where: { id },
        data: {
          ...(body.name !== undefined ? { name: body.name } : {}),
          ...(body.status !== undefined ? { status: body.status } : {}),
          ...(body.isCurrent !== undefined ? { isCurrent: body.isCurrent } : {}),
        },
      });
    });
    await writeAuditLog({
      actorId: session.id,
      action: "PAY_PERIOD_UPDATED",
      entityType: "PayPeriod",
      entityId: id,
      details: body as Record<string, unknown>,
    });
    return NextResponse.json({ payPeriod: updated });
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
    const session = await requireStaff();
    const companyId = requireStaffCompanyId(session);
    const { id } = await ctx.params;

    const existing = await prisma.payPeriod.findFirst({
      where: { id, companyId },
      include: { _count: { select: { timesheets: true, payslips: true } } },
    });
    if (!existing) {
      return NextResponse.json({ error: "Pay period not found" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      await deletePayPeriodWithData(tx, id);
    });

    await writeAuditLog({
      actorId: session.id,
      action: "PAY_PERIOD_DELETED",
      entityType: "PayPeriod",
      entityId: id,
      details: {
        name: existing.name,
        startDate: existing.startDate.toISOString(),
        endDate: existing.endDate.toISOString(),
        timesheetsRemoved: existing._count.timesheets,
        payslipsRemoved: existing._count.payslips,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    const err = e as Error & { status?: number };
    const message =
      err.message === "Forbidden"
        ? "You do not have permission to delete pay periods."
        : err.message === "Company context required"
          ? "Select a company before deleting pay periods."
          : err.message;
    return NextResponse.json({ error: message }, { status: err.status ?? 500 });
  }
}
