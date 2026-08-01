import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/api-auth";
import {
  employeeWhereForStaff,
  payslipWhereForStaff,
  timesheetWhereForStaff,
} from "@/lib/manager-scope";
import type { Prisma } from "@prisma/client";
import { z } from "zod";

const querySchema = z.object({
  q: z.string().trim().min(1).max(120),
});

function employeeTextFilter(term: string): Prisma.EmployeeWhereInput {
  return {
    OR: [
      { name: { contains: term, mode: "insensitive" } },
      { username: { contains: term, mode: "insensitive" } },
      { contactEmail: { contains: term, mode: "insensitive" } },
      { employeeCode: { contains: term, mode: "insensitive" } },
      { user: { name: { contains: term, mode: "insensitive" } } },
    ],
  };
}

export async function GET(req: Request) {
  try {
    const session = await requireStaff();
    const url = new URL(req.url);
    const { q } = querySchema.parse(Object.fromEntries(url.searchParams.entries()));
    const term = q.trim();

    const employeeScope = (await employeeWhereForStaff(session)) ?? {};
    const employeeWhere: Prisma.EmployeeWhereInput = {
      deletedAt: null,
      ...employeeScope,
      ...employeeTextFilter(term),
    };

    const timesheetScope = await timesheetWhereForStaff(session);
    const timesheetParts: Prisma.TimesheetWhereInput[] = [];
    if (Object.keys(timesheetScope).length > 0) timesheetParts.push(timesheetScope);
    timesheetParts.push({ employee: employeeTextFilter(term) });
    const timesheetWhere: Prisma.TimesheetWhereInput =
      timesheetParts.length === 1 ? timesheetParts[0]! : { AND: timesheetParts };

    const payslipScope = await payslipWhereForStaff(session);
    const payslipParts: Prisma.PayslipWhereInput[] = [payslipScope];
    payslipParts.push({ employee: employeeTextFilter(term) });
    const payslipWhere: Prisma.PayslipWhereInput = { AND: payslipParts };

    const [employees, timesheets, payslips] = await Promise.all([
      prisma.employee.findMany({
        where: employeeWhere,
        orderBy: { name: "asc" },
        take: 5,
        select: { id: true, name: true, employeeCode: true, contactEmail: true },
      }),
      prisma.timesheet.findMany({
        where: timesheetWhere,
        orderBy: { submittedAt: "desc" },
        take: 5,
        select: {
          id: true,
          status: true,
          employee: { select: { name: true } },
          payPeriod: { select: { name: true, startDate: true } },
        },
      }),
      prisma.payslip.findMany({
        where: payslipWhere,
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          employee: { select: { name: true, employeeCode: true } },
          payPeriod: { select: { name: true } },
        },
      }),
    ]);

    return NextResponse.json({
      q: term,
      employees: employees.map((e) => ({
        id: e.id,
        name: e.name,
        employeeCode: e.employeeCode,
        contactEmail: e.contactEmail,
        href: `/admin/employees/${e.id}`,
      })),
      timesheets: timesheets.map((t) => ({
        id: t.id,
        status: t.status,
        employeeName: t.employee.name,
        periodLabel: t.payPeriod.name ?? t.payPeriod.startDate.toISOString().slice(0, 10),
        href: `/admin/timesheets/${t.id}`,
      })),
      payslips: payslips.map((p) => ({
        id: p.id,
        employeeName: p.employee.name,
        employeeCode: p.employee.employeeCode,
        periodLabel: p.payPeriod.name ?? "Pay period",
        href: `/admin/payslips/${p.id}`,
      })),
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Enter a search term", issues: e.issues }, { status: 400 });
    }
    const err = e as Error & { status?: number };
    return NextResponse.json({ error: err.message }, { status: err.status ?? 500 });
  }
}
