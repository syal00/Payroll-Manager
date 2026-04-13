import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { PayslipDocument } from "@/components/pdf/PayslipDocument";
import { format } from "date-fns";
import { getPublicEmployeeByCode } from "@/lib/public-employee";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ employeeId: string; payslipId: string }> }
) {
  try {
    const { employeeId, payslipId } = await ctx.params;
    const emp = await getPublicEmployeeByCode(employeeId);
    if (!emp) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const payslip = await prisma.payslip.findFirst({
      where: { id: payslipId, employeeId: emp.id },
      include: {
        items: true,
        payPeriod: true,
        employee: { include: { user: true } },
      },
    });
    if (!payslip) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const company = process.env.NEXT_PUBLIC_COMPANY_NAME ?? "Company";

    const doc = (
      <PayslipDocument
        companyName={company}
        payslipNumber={payslip.payslipNumber}
        employeeName={payslip.employee.name}
        employeeId={payslip.employee.employeeCode}
        periodStart={format(payslip.payPeriod.startDate, "MMM d, yyyy")}
        periodEnd={format(payslip.payPeriod.endDate, "MMM d, yyyy")}
        regularHours={payslip.regularHours}
        overtimeHours={payslip.overtimeHours}
        hourlyRate={payslip.hourlyRate}
        overtimeRate={payslip.overtimeRate}
        grossPay={payslip.grossPay}
        totalDeductions={payslip.totalDeductions}
        netPay={payslip.netPay}
        approvalDate={
          payslip.approvalDate ? format(payslip.approvalDate, "MMM d, yyyy") : null
        }
        adminSignoff={payslip.adminSignoff}
        items={payslip.items.map((i) => ({
          label: i.label,
          amount: i.amount,
          type: i.type,
        }))}
      />
    );

    const buffer = await renderToBuffer(doc);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="payslip-${payslip.payslipNumber}.pdf"`,
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to render PDF" }, { status: 500 });
  }
}
