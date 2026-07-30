import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/api-auth";
import { assertStaffCanAccessEmployee } from "@/lib/manager-scope";
import { writeAuditLog } from "@/lib/audit";
import { buildPayslipReadyEmail } from "@/lib/email/payslip-ready";
import { sendEmail } from "@/lib/mailer";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireStaff();
    const { id } = await ctx.params;
    const payslip = await prisma.payslip.findUnique({
      where: { id },
      include: {
        employee: { include: { user: true, company: true } },
        payPeriod: true,
      },
    });
    if (!payslip) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!(await assertStaffCanAccessEmployee(session, payslip.employeeId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const to = payslip.employee.contactEmail;
    const companyName = payslip.employee.company?.name ?? process.env.NEXT_PUBLIC_COMPANY_NAME ?? "PayRun";
    const { subject, text, html } = buildPayslipReadyEmail({
      employeeName: payslip.employee.name,
      companyName,
      payslipNumber: payslip.payslipNumber,
      periodStart: payslip.payPeriod.startDate,
      periodEnd: payslip.payPeriod.endDate,
      netPay: payslip.netPay,
    });

    const emailResult = await sendEmail({ to, subject, text, html });

    await prisma.payslip.update({
      where: { id },
      data: { emailSentAt: emailResult.sent ? new Date() : undefined },
    });

    await writeAuditLog({
      actorId: session.id,
      action: "PAYSLIP_EMAIL_DISPATCH",
      entityType: "Payslip",
      entityId: id,
      details: { to, emailSent: emailResult.sent, subject },
    });

    return NextResponse.json({
      ok: true,
      emailSent: emailResult.sent,
      message: emailResult.sent
        ? `Payslip email sent to ${to}.`
        : emailResult.detail ?? "Email not configured — payslip recorded only.",
      preview: emailResult.sent ? undefined : { to, subject, text },
    });
  } catch (e) {
    const err = e as Error & { status?: number };
    return NextResponse.json({ error: err.message }, { status: err.status ?? 500 });
  }
}
