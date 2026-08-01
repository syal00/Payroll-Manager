import "server-only";

import { prisma } from "@/lib/prisma";

/** Latest employee pay profile used when issuing a payslip (optional UI overrides). */
export async function resolvePayslipEmployeeProfile(
  employeeId: string,
  overrides?: { hourlyRate?: number; overtimeRate?: number }
) {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: {
      id: true,
      hourlyRate: true,
      overtimeRate: true,
      jobTitle: true,
      department: true,
    },
  });
  if (!employee) {
    throw new Error("Employee not found");
  }

  const hourlyRate = overrides?.hourlyRate ?? employee.hourlyRate;
  const overtimeRate = overrides?.overtimeRate ?? employee.overtimeRate;

  if (
    overrides?.hourlyRate !== undefined ||
    overrides?.overtimeRate !== undefined
  ) {
    await prisma.employee.update({
      where: { id: employeeId },
      data: {
        ...(overrides.hourlyRate !== undefined ? { hourlyRate: overrides.hourlyRate } : {}),
        ...(overrides.overtimeRate !== undefined ? { overtimeRate: overrides.overtimeRate } : {}),
      },
    });
  }

  return {
    hourlyRate,
    overtimeRate,
    jobTitle: employee.jobTitle,
    department: employee.department,
  };
}

export function computePayslipGross(input: {
  regularHours: number;
  overtimeHours: number;
  hourlyRate: number;
  overtimeRate: number;
}) {
  const regPay = input.regularHours * input.hourlyRate;
  const otPay = input.overtimeHours * input.overtimeRate;
  const grossPay = regPay + otPay;
  return {
    regPay: Math.round(regPay * 100) / 100,
    otPay: Math.round(otPay * 100) / 100,
    grossPay: Math.round(grossPay * 100) / 100,
  };
}
