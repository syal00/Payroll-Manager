import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { money } from "@/lib/format";
import { EmployeePayRatesEditor } from "@/components/admin/EmployeePayRatesEditor";

export default async function AdminEmployeeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const employee = await prisma.employee.findUnique({
    where: { id },
    include: {
      user: { select: { email: true, name: true, role: true } },
      _count: { select: { timesheets: true, payslips: true } },
    },
  });

  if (!employee) {
    notFound();
  }

  const isDeleted = Boolean(employee.deletedAt);

  return (
    <div className="page-container max-w-2xl space-y-8">
      <div>
        <Link href="/admin/employees" className="link-accent text-sm">
          â† Back to employees
        </Link>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <h1 className="page-title">{employee.name}</h1>
          {isDeleted ? (
            <Badge variant="danger">Deactivated</Badge>
          ) : (
            <Badge variant="success">Active</Badge>
          )}
        </div>
        <p className="mt-1 font-mono text-sm text-slate-500">{employee.employeeCode}</p>
      </div>

      <Card>
        <h2 className="card-heading">Contact &amp; payroll</h2>
        <p className="mt-1 text-xs text-slate-500">Rates and identifiers on file</p>
        <dl className="mt-5 space-y-4 text-sm">
          <div className="flex justify-between gap-4 border-b border-violet-50 pb-3">
            <dt className="text-slate-500">Email</dt>
            <dd className="text-right font-medium text-[var(--color-text-secondary)]">{employee.email}</dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-violet-50 pb-3">
            <dt className="text-slate-500">Hourly rate</dt>
            <dd className="tabular-nums font-medium">{money(employee.hourlyRate)}</dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-violet-50 pb-3">
            <dt className="text-slate-500">Overtime rate</dt>
            <dd className="tabular-nums font-medium">{money(employee.overtimeRate)}</dd>
          </div>
          {employee.department && (
            <div className="flex justify-between gap-4 border-b border-violet-50 pb-3">
              <dt className="text-slate-500">Department</dt>
              <dd>{employee.department}</dd>
            </div>
          )}
          {employee.jobTitle && (
            <div className="flex justify-between gap-4 border-b border-violet-50 pb-3">
              <dt className="text-slate-500">Job title</dt>
              <dd>{employee.jobTitle}</dd>
            </div>
          )}
          {employee.user && (
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Linked user</dt>
              <dd className="text-right text-xs text-slate-700">
                {employee.user.name} ({employee.user.role})
              </dd>
            </div>
          )}
        </dl>
        <EmployeePayRatesEditor
          employeeId={employee.id}
          initialHourly={employee.hourlyRate}
          initialOvertime={employee.overtimeRate}
          disabled={isDeleted}
        />
      </Card>

      <Card>
        <h2 className="card-heading">Records retained</h2>
        <p className="mt-1 text-sm text-slate-600">
          History stays available even when someone is deactivated.
        </p>
        <ul className="mt-5 grid gap-3 text-sm text-[var(--color-text-secondary)] sm:grid-cols-2">
          <li className="rounded-xl border border-[var(--color-accent-tint)]/80 bg-[var(--color-accent-soft)]/40 px-4 py-3">
            Timesheets:{" "}
            <span className="font-bold tabular-nums text-[var(--color-text-primary)]">{employee._count.timesheets}</span>
          </li>
          <li className="rounded-xl border border-[var(--color-accent-tint)]/80 bg-[var(--color-accent-soft)]/40 px-4 py-3">
            Payslips:{" "}
            <span className="font-bold tabular-nums text-[var(--color-text-primary)]">{employee._count.payslips}</span>
          </li>
        </ul>
        <div className="mt-5">
          <Link
            href={`/admin/review?q=${encodeURIComponent(employee.name)}`}
            className="link-accent text-sm font-semibold"
          >
            Open timesheet review (search by name) â†’
          </Link>
        </div>
      </Card>
    </div>
  );
}
