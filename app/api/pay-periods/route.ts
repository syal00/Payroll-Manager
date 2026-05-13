import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, requireStaff } from "@/lib/api-auth";
import { PayPeriodStatus } from "@/lib/enums";
import { isValidFourteenDayWindow } from "@/lib/pay-period-utils";
import { writeAuditLog } from "@/lib/audit";
import { z } from "zod";
import { isStaffRole } from "@/lib/roles";

export async function GET() {
  try {
    const session = await requireSession();
    if (isStaffRole(session.role)) {
      const rows = await prisma.payPeriod.findMany({
        orderBy: { startDate: "desc" },
        include: {
          _count: { select: { timesheets: true, payslips: true } },
        },
      });
      return NextResponse.json({ payPeriods: rows });
    }
    const current = await prisma.payPeriod.findFirst({
      where: { isCurrent: true },
      orderBy: { startDate: "desc" },
    });
    const open = await prisma.payPeriod.findMany({
      where: { status: PayPeriodStatus.OPEN },
      orderBy: { startDate: "desc" },
    });
    return NextResponse.json({ current, openPayPeriods: open });
  } catch (e) {
    const err = e as Error & { status?: number };
    return NextResponse.json({ error: err.message }, { status: err.status ?? 500 });
  }
}

const createSchema = z.object({
  name: z.string().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  status: z.enum(["OPEN", "CLOSED", "PROCESSING"]).default("OPEN"),
  setAsCurrent: z.boolean().optional(),
});

export async function POST(req: Request) {
  try {
    const session = await requireStaff();
    const body = createSchema.parse(await req.json());
    const start = new Date(body.startDate);
    const end = new Date(body.endDate);
    if (!isValidFourteenDayWindow(start, end)) {
      return NextResponse.json(
        { error: "Pay period must span exactly 14 calendar days (inclusive)." },
        { status: 400 }
      );
    }
    const period = await prisma.$transaction(async (tx) => {
      if (body.setAsCurrent) {
        await tx.payPeriod.updateMany({ data: { isCurrent: false } });
      }
      return tx.payPeriod.create({
        data: {
          name: body.name ?? null,
          startDate: start,
          endDate: end,
          status: body.status,
          isCurrent: body.setAsCurrent ?? false,
        },
      });
    });
    await writeAuditLog({
      actorId: session.id,
      action: "PAY_PERIOD_CREATED",
      entityType: "PayPeriod",
      entityId: period.id,
      details: { status: period.status, isCurrent: period.isCurrent },
    });
    return NextResponse.json({ payPeriod: period });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", issues: e.issues }, { status: 400 });
    }
    const err = e as Error & { status?: number };
    return NextResponse.json({ error: err.message }, { status: err.status ?? 500 });
  }
}
