import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { money } from "@/lib/format";
import { employeeSignInEmail } from "@/lib/display-name";
import { EmployeePayRatesEditor } from "@/components/admin/EmployeePayRatesEditor";
import { EmployeeProfileEditor } from "@/components/admin/EmployeeProfileEditor";
import { EmployeeRecordsPanel } from "@/components/admin/EmployeeRecordsPanel";
import { EmployeePermanentDeleteButton } from "@/components/admin/EmployeePermanentDeleteButton";

export default async function AdminEmployeeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const employee = await prisma.employee.findUnique({
    where: { id },
    include: {
      user: { select: { username: true, contactEmail: true, name: true, role: true } },
      timesheets: {
        orderBy: { submittedAt: "desc" },
        include: {
          payPeriod: { select: { name: true, startDate: true, endDate: true } },
          payslip: { select: { id: true, payslipNumber: true } },
        },
      },
      payslips: {
        orderBy: { createdAt: "desc" },
        include: {
          payPeriod: { select: { name: true, startDate: true, endDate: true } },
        },
      },
    },
  });

  if (!employee) {
    notFound();
  }

  const isDeleted = Boolean(employee.deletedAt);

  const timesheets = employee.timesheets.map((ts) => ({
    id: ts.id,
    status: ts.status,
    totalHours: ts.totalHours,
    submittedAt: ts.submittedAt?.toISOString() ?? null,
    payPeriod: {
      name: ts.payPeriod.name,
      startDate: ts.payPeriod.startDate.toISOString(),
      endDate: ts.payPeriod.endDate.toISOString(),
    },
    payslip: ts.payslip,
  }));

  const payslips = employee.payslips.map((ps) => ({
    id: ps.id,
    payslipNumber: ps.payslipNumber,
    netPay: ps.netPay,
    createdAt: ps.createdAt.toISOString(),
    payPeriod: {
      name: ps.payPeriod.name,
      startDate: ps.payPeriod.startDate.toISOString(),
      endDate: ps.payPeriod.endDate.toISOString(),
    },
  }));

  return (
    <div className="page-container max-w-3xl space-y-8">
      <div>
        <Link href="/admin/employees" className="link-accent text-sm">
          ← Back to employees
        </Link>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <h1 className="page-title">{employee.name}</h1>
          {isDeleted ? (
            <Badge variant="danger">Deactivated</Badge>
          ) : (
            <Badge variant="success">Active</Badge>
          )}
        </div>
        <p className="mt-1 font-mono text-sm text-[var(--color-text-muted)]">{employee.employeeCode}</p>
      </div>

      <Card>
        <h2 className="card-heading">Contact &amp; payroll</h2>
        <p className="mt-1 text-xs text-[var(--color-text-muted)]">Rates and identifiers on file</p>
        <dl className="mt-5 space-y-4 text-sm">
          <div className="flex justify-between gap-4 border-b border-[var(--color-border)] pb-3">
            <dt className="text-[var(--color-text-muted)]">Sign-in email</dt>
            <dd className="text-right font-medium text-[var(--color-text-secondary)]">
              {employeeSignInEmail(employee.username, employee.contactEmail)}
            </dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-[var(--color-border)] pb-3">
            <dt className="text-[var(--color-text-muted)]">Hourly rate</dt>
            <dd className="tabular-nums font-medium text-[var(--color-text-primary)]">{money(employee.hourlyRate)}</dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-[var(--color-border)] pb-3">
            <dt className="text-[var(--color-text-muted)]">Overtime rate</dt>
            <dd className="tabular-nums font-medium text-[var(--color-text-primary)]">{money(employee.overtimeRate)}</dd>
          </div>
          {employee.user ? (
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--color-text-muted)]">Portal account</dt>
              <dd className="text-right text-xs text-[var(--color-text-secondary)]">
                {employee.user.name} ({employee.user.role})
              </dd>
            </div>
          ) : null}
        </dl>
        <EmployeeProfileEditor
          key={`${employee.jobTitle ?? ""}-${employee.department ?? ""}`}
          employeeId={employee.id}
          initialJobTitle={employee.jobTitle}
          initialDepartment={employee.department}
          disabled={isDeleted}
        />
        <EmployeePayRatesEditor
          employeeId={employee.id}
          initialHourly={employee.hourlyRate}
          initialOvertime={employee.overtimeRate}
          disabled={isDeleted}
        />
      </Card>

      <Card>
        <h2 className="card-heading">Hours &amp; payslips</h2>
        <EmployeeRecordsPanel
          employeeId={employee.id}
          timesheets={timesheets}
          payslips={payslips}
          disabled={isDeleted}
        />
      </Card>

      {!isDeleted ? (
        <Card>
          <EmployeePermanentDeleteButton employeeId={employee.id} employeeName={employee.name} />
        </Card>
      ) : null}
    </div>
  );
}
