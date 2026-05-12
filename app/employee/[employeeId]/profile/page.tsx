"use client";

import { useEffect, useState, use } from "react";
import { Card } from "@/components/ui/Card";
import { money } from "@/lib/format";
import { IdCard } from "lucide-react";

export default function PublicProfilePage({
  params,
}: {
  params: Promise<{ employeeId: string }>;
}) {
  const { employeeId } = use(params);
  const [emp, setEmp] = useState<{
    name: string;
    email: string;
    employeeCode: string;
    hourlyRate: number;
    overtimeRate: number;
    department: string | null;
    jobTitle: string | null;
  } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/public/employees/${employeeId}`)
      .then((r) => r.json())
      .then((j) => {
        if (j.error) setErr(j.error);
        else setEmp(j.employee);
      });
  }, [employeeId]);

  if (err) {
    return <div className="alert-error max-w-xl">{err}</div>;
  }
  if (!emp) {
    return (
      <div className="flex items-center gap-3 text-sm text-slate-500">
        <span
          className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--color-accent-tint)] border-t-violet-600"
          aria-hidden
        />
        Loading profileâ€¦
      </div>
    );
  }

  return (
    <div className="page-container max-w-lg space-y-8">
      <div>
        <p className="page-eyebrow">About you</p>
        <h1 className="page-title mt-1 flex flex-wrap items-center gap-2">
          <span className="stat-icon shrink-0">
            <IdCard className="h-5 w-5 text-[var(--color-accent)]" aria-hidden />
          </span>
          Profile
        </h1>
        <p className="page-description">What we have on file for payroll. Contact admin to request changes.</p>
      </div>

      <Card>
        <h2 className="card-heading">Employment</h2>
        <dl className="mt-5 space-y-4 text-sm">
          <div className="flex justify-between gap-4 border-b border-violet-50 pb-3">
            <dt className="text-slate-500">Name</dt>
            <dd className="text-right font-semibold text-[var(--color-text-primary)]">{emp.name}</dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-violet-50 pb-3">
            <dt className="text-slate-500">Email</dt>
            <dd className="text-right text-[var(--color-text-secondary)]">{emp.email}</dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-violet-50 pb-3">
            <dt className="text-slate-500">Employee ID</dt>
            <dd className="font-mono font-semibold text-[var(--color-text-primary)]">{emp.employeeCode}</dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-violet-50 pb-3">
            <dt className="text-slate-500">Hourly rate</dt>
            <dd className="tabular-nums font-medium">{money(emp.hourlyRate)}</dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-violet-50 pb-3">
            <dt className="text-slate-500">Overtime rate</dt>
            <dd className="tabular-nums font-medium">{money(emp.overtimeRate)}</dd>
          </div>
          {emp.department && (
            <div className="flex justify-between gap-4 border-b border-violet-50 pb-3">
              <dt className="text-slate-500">Department</dt>
              <dd>{emp.department}</dd>
            </div>
          )}
          {emp.jobTitle && (
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Title</dt>
              <dd>{emp.jobTitle}</dd>
            </div>
          )}
        </dl>
        <p className="mt-5 rounded-xl border border-white/10 bg-[var(--color-bg-card)]/[0.04] px-3 py-2 text-xs text-slate-400">
          Need an update? Ask your administratorâ€”this screen is read-only for employees.
        </p>
      </Card>
    </div>
  );
}
