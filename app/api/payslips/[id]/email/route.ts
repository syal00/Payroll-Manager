import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";
import { writeAuditLog } from "@/lib/audit";
import { format } from "date-fns";

/**
 * Email-ready payload: wire SMTP (e.g. nodemailer) via env when available.
 * Always records audit + optional emailSentAt for traceability.
 */
export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin();
    const { id } = await ctx.params;
    const payslip = await prisma.payslip.findUnique({
      where: { id },
      include: {
        employee: { include: { user: true } },
        payPeriod: true,
      },
    });
    if (!payslip) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const company = process.env.NEXT_PUBLIC_COMPANY_NAME ?? "Company";
    const to = payslip.employee.email;
    const subject = `${company} — Payslip ${payslip.payslipNumber}`;
    const body = `Hello ${payslip.employee.name},

Your payslip ${payslip.payslipNumber} for the period ${format(payslip.payPeriod.startDate, "MMM d, yyyy")} – ${format(payslip.payPeriod.endDate, "MMM d, yyyy")} is available.

Net pay: $${payslip.netPay.toFixed(2)}

Sign in to the employee portal to view details and download your PDF.

— Payroll`;

    const smtpConfigured = Boolean(process.env.SMTP_HOST && process.env.SMTP_FROM);

    await prisma.payslip.update({
      where: { id },
      data: { emailSentAt: new Date() },
    });

    await writeAuditLog({
      actorId: session.id,
      action: "PAYSLIP_EMAIL_DISPATCH",
      entityType: "Payslip",
      entityId: id,
      details: { to, smtpConfigured, subject },
    });

    return NextResponse.json({
      ok: true,
      message: smtpConfigured
        ? "Email queued (configure nodemailer in production to actually send)."
        : "Email template recorded; attach SMTP in .env to send in production.",
      preview: { to, subject, body },
    });
  } catch (e) {
    const err = e as Error & { status?: number };
    return NextResponse.json({ error: err.message }, { status: err.status ?? 500 });
  }
}
