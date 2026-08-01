import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/api-auth";
import { TimesheetStatus, canonicalTimesheetStatus } from "@/lib/enums";
import { assertStaffCanAccessEmployee } from "@/lib/manager-scope";
import { writeAuditLog } from "@/lib/audit";
import { z } from "zod";

const bodySchema = z.object({
  newStatus: z.enum(["UNDER_REVIEW", "APPROVED", "REJECTED"]),
  comment: z.string().optional().nullable(),
  rejectionReason: z.string().optional().nullable(),
});

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireStaff();
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
      include: { employee: { include: { user: true } }, payslip: { select: { id: true, payslipNumber: true } } },
    });
    if (!ts) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (!(await assertStaffCanAccessEmployee(session, ts.employeeId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const prev = canonicalTimesheetStatus(ts.status);

    const validTransition = (() => {
      if (body.newStatus === "UNDER_REVIEW") return prev === TimesheetStatus.PENDING;
      if (body.newStatus === "APPROVED")
        return (
          prev === TimesheetStatus.UNDER_REVIEW ||
          prev === TimesheetStatus.PENDING ||
          prev === TimesheetStatus.REJECTED
        );
      if (body.newStatus === "REJECTED")
        return (
          prev === TimesheetStatus.PENDING ||
          prev === TimesheetStatus.UNDER_REVIEW ||
          prev === TimesheetStatus.APPROVED
        );
      return false;
    })();

    if (!validTransition) {
      return NextResponse.json(
        { error: `Cannot move from ${prev} to ${body.newStatus}.` },
        { status: 400 }
      );
    }

    const payslipToVoid = body.newStatus === "REJECTED" && prev === TimesheetStatus.APPROVED ? ts.payslip : null;

    const updated = await prisma.$transaction(async (tx) => {
      if (payslipToVoid) {
        await tx.payslip.delete({ where: { id: payslipToVoid.id } });
      }
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
      const reapproved = prev === TimesheetStatus.REJECTED;
      await prisma.notification.create({
        data: {
          userId: empUserId,
          type: "TIMESHEET_APPROVED",
          title: reapproved ? "Timesheet approved again" : "Timesheet approved",
          body: reapproved
            ? "Your timesheet was reviewed and approved. Your payslip can now be issued."
            : "Your submitted hours were approved. Your payslip can now be issued.",
        },
      });
    } else if (empUserId && body.newStatus === "REJECTED") {
      const revoked = prev === TimesheetStatus.APPROVED;
      const payslipNote = payslipToVoid
        ? ` Payslip ${payslipToVoid.payslipNumber} was voided.`
        : "";
      await prisma.notification.create({
        data: {
          userId: empUserId,
          type: "TIMESHEET_REJECTED",
          title: revoked ? "Approved timesheet reversed" : "Timesheet needs revision",
          body: `${revoked ? "Your approved hours were rejected and must be corrected." : "Your submitted hours need changes."} Reason: ${body.rejectionReason}.${payslipNote}`,
        },
      });
    } else if (empUserId && body.newStatus === "UNDER_REVIEW") {
      await prisma.notification.create({
        data: {
          userId: empUserId,
          type: "TIMESHEET_UNDER_REVIEW",
          title: "Timesheet under review",
          body: "A reviewer is verifying your submitted hours. You will be notified when it is approved or needs changes.",
        },
      });
    }

    const auditAction =
      body.newStatus === "APPROVED"
        ? "APPROVE_TIMESHEET"
        : body.newStatus === "REJECTED"
          ? "REJECT_TIMESHEET"
          : "TIMESHEET_UNDER_REVIEW";

    await writeAuditLog({
      actorId: session.id,
      action: auditAction,
      entityType: "Timesheet",
      entityId: id,
      details: {
        from: prev,
        to: body.newStatus,
        comment: body.comment,
        rejectionReason: body.rejectionReason,
        revokedFromApproved: prev === TimesheetStatus.APPROVED && body.newStatus === "REJECTED",
        reapprovedAfterRejection: prev === TimesheetStatus.REJECTED && body.newStatus === "APPROVED",
        payslipVoided: payslipToVoid?.payslipNumber ?? null,
      },
    });

    return NextResponse.json({
      timesheet: updated,
      payslipVoided: payslipToVoid?.payslipNumber ?? null,
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", issues: e.issues }, { status: 400 });
    }
    const err = e as Error & { status?: number };
    return NextResponse.json({ error: err.message }, { status: err.status ?? 500 });
  }
}
