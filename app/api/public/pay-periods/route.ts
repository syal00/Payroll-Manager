import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PayPeriodStatus } from "@/lib/enums";

export async function GET() {
  try {
    const current = await prisma.payPeriod.findFirst({
      where: { isCurrent: true },
      orderBy: { startDate: "desc" },
    });
    const openPayPeriods = await prisma.payPeriod.findMany({
      where: { status: PayPeriodStatus.OPEN },
      orderBy: { startDate: "desc" },
    });
    return NextResponse.json({ current, openPayPeriods });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load pay periods" }, { status: 500 });
  }
}
