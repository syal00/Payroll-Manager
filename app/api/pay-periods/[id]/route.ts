import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";
import { writeAuditLog } from "@/lib/audit";
import { z } from "zod";

const patchSchema = z.object({
  name: z.string().optional().nullable(),
  status: z.enum(["OPEN", "CLOSED", "PROCESSING"]).optional(),
  isCurrent: z.boolean().optional(),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdmin();
    const { id } = await ctx.params;
    const body = patchSchema.parse(await req.json());
    const existing = await prisma.payPeriod.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const updated = await prisma.$transaction(async (tx) => {
      if (body.isCurrent === true) {
        await tx.payPeriod.updateMany({ data: { isCurrent: false } });
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
