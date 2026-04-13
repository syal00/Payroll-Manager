import { NextResponse } from "next/server";
import { getPublicEmployeeByCode } from "@/lib/public-employee";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ employeeId: string }> }
) {
  try {
    const { employeeId } = await ctx.params;
    const emp = await getPublicEmployeeByCode(employeeId);
    if (!emp) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }
    return NextResponse.json({
      employee: {
        id: emp.id,
        name: emp.name,
        email: emp.email,
        employeeCode: emp.employeeCode,
        hourlyRate: emp.hourlyRate,
        overtimeRate: emp.overtimeRate,
        department: emp.department,
        jobTitle: emp.jobTitle,
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
