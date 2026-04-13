import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";
import { TimesheetStatus } from "@/lib/enums";
import { writeAuditLog } from "@/lib/audit";
import { z } from "zod";

const bodySchema = z.object({
  newStatus: z.enum(["VERIFIED", "APPROVED", "REJECTED"]),
  comment: z.string().optional().nullable(),
  rejectionReason: z.string().optional().nullable(),
});

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin();
    const { id } = await ctx.params;
    const body = bodySchema.parse(await req.json());

    if (body.newStatus === "REJECTED" && !body.rejectionReason?.trim()) {
      return NextResponse.json(
        { error: "Rejection requires a reason for the employee." },
        { status: 400 }
      );
    }

    const ts = await prisma.timesheet.findUnique({
      where: { id },
      include: { employee: { include: { user: true } } },
    });
    if (!ts) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const prev = ts.status;

    const validTransition = (() => {
      if (body.newStatus === "VERIFIED") return prev === TimesheetStatus.PENDING;
      if (body.newStatus === "APPROVED")
        return prev === TimesheetStatus.VERIFIED || prev === TimesheetStatus.PENDING;
      if (body.newStatus === "REJECTED")
        return prev === TimesheetStatus.PENDING || prev === TimesheetStatus.VERIFIED;
      return false;
    })();

    if (!validTransition) {
      return NextResponse.json(
        { error: `Cannot move from ${prev} to ${body.newStatus}.` },
        { status: 400 }
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.approval.create({
        data: {
          timesheetId: id,
          adminId: session.id,
          previousStatus: prev,
          newStatus: body.newStatus,
          comment: body.comment ?? null,
          rejectionReason:
            body.newStatus === "REJECTED" ? (body.rejectionReason ?? null) : null,
        },
      });
      return tx.timesheet.update({
        where: { id },
        data: { status: body.newStatus },
      });
    });

    const empUserId = ts.employee.userId;
    if (empUserId && body.newStatus === "APPROVED") {
      await prisma.notification.create({
        data: {
          userId: empUserId,
          type: "TIMESHEET_APPROVED",
          title: "Timesheet approved",
          body: "Your submitted hours were approved. Your payslip can now be issued.",
        },
      });
    } else if (empUserId && body.newStatus === "REJECTED") {
      await prisma.notification.create({
        data: {
          userId: empUserId,
          type: "TIMESHEET_REJECTED",
          title: "Timesheet needs revision",
          body: `Reason: ${body.rejectionReason}`,
        },
      });
    } else if (empUserId && body.newStatus === "VERIFIED") {
      await prisma.notification.create({
        data: {
          userId: empUserId,
          type: "TIMESHEET_VERIFIED",
          title: "Timesheet verified",
          body: "An administrator verified your hours. Final approval may follow.",
        },
      });
    }

    await writeAuditLog({
      actorId: session.id,
      action: "TIMESHEET_STATUS_CHANGED",
      entityType: "Timesheet",
      entityId: id,
      details: {
        from: prev,
        to: body.newStatus,
        comment: body.comment,
        rejectionReason: body.rejectionReason,
      },
    });

    return NextResponse.json({ timesheet: updated });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", issues: e.issues }, { status: 400 });
    }
    const err = e as Error & { status?: number };
    return NextResponse.json({ error: err.message }, { status: err.status ?? 500 });
  }
}
