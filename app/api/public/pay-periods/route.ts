import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { resolveRegistrationCompanyId } from "@/lib/employee-company-scope";
import { PayPeriodStatus } from "@/lib/enums";

export async function GET() {
  try {
    const companyId = await resolveRegistrationCompanyId((await headers()).get("x-company-id"));
    const periodWhere = companyId ? { companyId } : {};

    const current = await prisma.payPeriod.findFirst({
      where: { ...periodWhere, isCurrent: true },
      orderBy: { startDate: "desc" },
    });
    const openPayPeriods = await prisma.payPeriod.findMany({
      where: { ...periodWhere, status: PayPeriodStatus.OPEN },
      orderBy: { startDate: "desc" },
    });
    return NextResponse.json({ current, openPayPeriods });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load pay periods" }, { status: 500 });
  }
}
