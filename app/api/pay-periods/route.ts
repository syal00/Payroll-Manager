import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, requireStaff } from "@/lib/api-auth";
import { PayPeriodStatus } from "@/lib/enums";
import { isValidPayPeriodWindow, normalizePayPeriodDate } from "@/lib/pay-period-utils";
import {
  clearCurrentPayPeriods,
  findPayPeriodByWindow,
  normalizeCurrentPayPeriod,
  requireStaffCompanyId,
} from "@/lib/pay-period-company";
import { writeAuditLog } from "@/lib/audit";
import { mirrorPayPeriodToTargetCompany } from "@/lib/company-mirror";
import { z } from "zod";
import { isStaffRole, isSupervisorRole } from "@/lib/roles";

export async function GET() {
  try {
    const session = await requireSession();
    if (isStaffRole(session.role) || isSupervisorRole(session.role)) {
      const companyId = requireStaffCompanyId(session);
      await normalizeCurrentPayPeriod(prisma, companyId);
      const rows = await prisma.payPeriod.findMany({
        where: { companyId },
        orderBy: { startDate: "desc" },
        include: {
          _count: { select: { timesheets: true, payslips: true } },
        },
      });
      return NextResponse.json({ payPeriods: rows });
    }
    const companyId = requireStaffCompanyId(session);
    const current = await prisma.payPeriod.findFirst({
      where: { companyId, isCurrent: true },
      orderBy: { startDate: "desc" },
    });
    const open = await prisma.payPeriod.findMany({
      where: { companyId, status: PayPeriodStatus.OPEN },
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
    const companyId = requireStaffCompanyId(session);
    const body = createSchema.parse(await req.json());
    const start = normalizePayPeriodDate(new Date(body.startDate));
    const end = normalizePayPeriodDate(new Date(body.endDate));
    if (!isValidPayPeriodWindow(start, end)) {
      return NextResponse.json(
        { error: "Pay period end date must be on or after the start date." },
        { status: 400 }
      );
    }

    const duplicate = await findPayPeriodByWindow(prisma, companyId, start, end);
    if (duplicate) {
      return NextResponse.json(
        { error: "A pay period with these dates already exists for your company." },
        { status: 409 }
      );
    }

    const period = await prisma.$transaction(async (tx) => {
      if (body.setAsCurrent) {
        await clearCurrentPayPeriods(tx, companyId);
      }
      return tx.payPeriod.create({
        data: {
          companyId,
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
      details: { status: period.status, isCurrent: period.isCurrent, companyId },
    });

    await mirrorPayPeriodToTargetCompany({
      sourceCompanyId: companyId,
      name: period.name,
      startDate: period.startDate,
      endDate: period.endDate,
      status: period.status,
      isCurrent: period.isCurrent,
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
