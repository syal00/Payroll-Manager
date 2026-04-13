import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";
import { TimesheetStatus, PayslipItemType } from "@/lib/enums";
import { writeAuditLog } from "@/lib/audit";
import { z } from "zod";

const itemSchema = z.object({
  label: z.string().min(1),
  amount: z.number().min(0),
  type: z.enum(["EARNING", "DEDUCTION"]),
});

const bodySchema = z.object({
  extraDeductions: z.array(itemSchema).optional(),
  /** Single aggregate deduction line (optional shortcut) */
  deductionTotal: z.number().min(0).optional(),
});

function nextPayslipNumber(): string {
  const y = new Date().getFullYear();
  const r = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `PSL-${y}-${r}`;
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin();
    const { id: timesheetId } = await ctx.params;
    const body = bodySchema.parse(await req.json().catch(() => ({})));

    const ts = await prisma.timesheet.findUnique({
      where: { id: timesheetId },
      include: {
        employee: true,
        payPeriod: true,
        payslip: true,
      },
    });

    if (!ts) return NextResponse.json({ error: "Timesheet not found" }, { status: 404 });
    if (ts.status !== TimesheetStatus.APPROVED) {
      return NextResponse.json(
        { error: "Only approved timesheets can generate a payslip." },
        { status: 400 }
      );
    }
    if (ts.payslip) {
      return NextResponse.json({ error: "A payslip already exists for this timesheet." }, { status: 400 });
    }

    const { hourlyRate, overtimeRate } = ts.employee;
    const regPay = ts.totalRegular * hourlyRate;
    const otPay = ts.totalOvertime * overtimeRate;
    const grossPay = regPay + otPay;

    const baseItems = [
      { label: "Regular earnings", amount: regPay, type: PayslipItemType.EARNING },
      { label: "Overtime earnings", amount: otPay, type: PayslipItemType.EARNING },
    ];
    const extra = body.extraDeductions ?? [];
    const deductions =
      extra.length > 0
        ? extra.filter((i) => i.type === "DEDUCTION")
        : body.deductionTotal != null && body.deductionTotal > 0
          ? [
              {
                label: "Deductions (aggregate)",
                amount: body.deductionTotal,
                type: "DEDUCTION" as const,
              },
            ]
          : [];
    const totalDeductions = deductions.reduce((s, i) => s + i.amount, 0);
    const netPay = grossPay - totalDeductions;

    if (netPay < 0) {
      return NextResponse.json({ error: "Deductions cannot exceed gross pay." }, { status: 400 });
    }

    const lastApproval = await prisma.approval.findFirst({
      where: { timesheetId, newStatus: TimesheetStatus.APPROVED },
      orderBy: { createdAt: "desc" },
    });

    const adminUser = await prisma.user.findUnique({ where: { id: session.id } });

    const payslip = await prisma.payslip.create({
      data: {
        payslipNumber: nextPayslipNumber(),
        timesheetId,
        employeeId: ts.employeeId,
        payPeriodId: ts.payPeriodId,
        hourlyRate,
        overtimeRate,
        regularHours: ts.totalRegular,
        overtimeHours: ts.totalOvertime,
        grossPay,
        totalDeductions,
        netPay,
        approvalDate: lastApproval?.createdAt ?? new Date(),
        adminSignoff: adminUser?.name ?? "Administrator",
        items: {
          create: [
            ...baseItems.map((i) => ({
              label: i.label,
              amount: i.amount,
              type: i.type,
            })),
            ...deductions.map((i) => ({
              label: i.label,
              amount: i.amount,
              type: PayslipItemType.DEDUCTION,
            })),
          ],
        },
      },
      include: { items: true },
    });

    await writeAuditLog({
      actorId: session.id,
      action: "PAYSLIP_GENERATED",
      entityType: "Payslip",
      entityId: payslip.id,
      details: { timesheetId, payslipNumber: payslip.payslipNumber },
    });

    if (ts.employee.userId) {
      await prisma.notification.create({
        data: {
          userId: ts.employee.userId,
          type: "PAYSLIP_READY",
          title: "Payslip generated",
          body: `Payslip ${payslip.payslipNumber} is available in your portal.`,
        },
      });
    }

    return NextResponse.json({ payslip });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", issues: e.issues }, { status: 400 });
    }
    const err = e as Error & { status?: number };
    return NextResponse.json({ error: err.message }, { status: err.status ?? 500 });
  }
}
