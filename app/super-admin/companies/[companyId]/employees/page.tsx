"use client";

import { use, useEffect, useState } from "react";

type EmployeeRow = {
  id: string;
  name: string;
  username: string;
  contactEmail: string;
  employeeCode: string;
  department: string | null;
  jobTitle: string | null;
  timesheetCount: number;
  payslipCount: number;
  isApproved: boolean;
  deletedAt: string | null;
};

export default function CompanyEmployeesPage({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = use(params);
  const [rows, setRows] = useState<EmployeeRow[]>([]);
  const [status, setStatus] = useState<"active" | "pending" | "deleted" | "all">("active");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setErr(null);
    fetch(`/api/super-admin/companies/${companyId}/employees?status=${status}`)
      .then((r) => r.json())
      .then((j) => {
        if (j.error) setErr(j.error);
        else setRows(j.employees ?? []);
      })
      .catch(() => setErr("Failed to load employees"))
      .finally(() => setLoading(false));
  }, [companyId, status]);

  return (
    <div className="page-container space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-[var(--sa-heading)]">Employees</h1>
        <p className="mt-1 text-sm text-[var(--sa-muted)]">Full roster for this tenant — read-only platform view.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["active", "Active"],
            ["pending", "Pending"],
            ["deleted", "Archived"],
            ["all", "All"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setStatus(value)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
              status === value
                ? "bg-[var(--sa-accent-soft)] text-[var(--sa-accent)]"
                : "text-[var(--sa-muted)] hover:bg-white/5"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {err ? <div className="alert-error max-w-xl">{err}</div> : null}

      <div className="sa-panel overflow-hidden">
        {loading ? (
          <p className="p-8 text-center text-sm text-[var(--sa-muted)]">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="p-8 text-center text-sm text-[var(--sa-muted)]">No employees in this filter.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="sa-table min-w-[800px]">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Username</th>
                  <th>Contact email</th>
                  <th>Role / dept</th>
                  <th>Activity</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <p className="font-semibold text-[var(--sa-heading)]">{r.name}</p>
                      <p className="sa-mono text-xs text-[var(--sa-muted)]">{r.employeeCode}</p>
                    </td>
                    <td className="sa-mono text-xs text-[var(--sa-accent)]">{r.username}</td>
                    <td className="text-xs text-[var(--sa-muted)]">{r.contactEmail}</td>
                    <td className="text-xs text-[var(--sa-muted)]">
                      {r.jobTitle ?? "—"}
                      {r.department ? ` · ${r.department}` : ""}
                    </td>
                    <td className="text-xs text-[var(--sa-muted)]">
                      {r.timesheetCount} ts · {r.payslipCount} slips
                    </td>
                    <td>
                      {r.deletedAt ? (
                        <span className="sa-badge !bg-rose-500/15 !text-rose-300">Archived</span>
                      ) : !r.isApproved ? (
                        <span className="sa-badge !bg-amber-500/15 !text-amber-300">Pending</span>
                      ) : (
                        <span className="sa-badge !bg-emerald-500/15 !text-emerald-300">Active</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
