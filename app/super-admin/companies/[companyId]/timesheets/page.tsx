"use client";

import { use, useEffect, useState } from "react";
import { TimesheetStatusBadge } from "@/components/status-badges";
import { shortDate } from "@/lib/format";

type TimesheetRow = {
  id: string;
  status: string;
  totalHours: number;
  submittedAt: string | null;
  employee: { name: string; employeeCode: string; username: string };
  payPeriod: { name: string | null; startDate: string; endDate: string };
};

export default function CompanyTimesheetsPage({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = use(params);
  const [items, setItems] = useState<TimesheetRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const pageSize = 20;

  useEffect(() => {
    setLoading(true);
    setErr(null);
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (q.trim()) params.set("q", q.trim());
    fetch(`/api/super-admin/companies/${companyId}/timesheets?${params}`)
      .then((r) => r.json())
      .then((j) => {
        if (j.error) setErr(j.error);
        else {
          setItems(j.items ?? []);
          setTotal(j.total ?? 0);
        }
      })
      .catch(() => setErr("Failed to load timesheets"))
      .finally(() => setLoading(false));
  }, [companyId, page, q]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="page-container space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-[var(--sa-heading)]">Timesheets</h1>
        <p className="mt-1 text-sm text-[var(--sa-muted)]">All submissions for this tenant.</p>
      </div>

      <div className="sa-panel p-4">
        <input
          className="sa-input max-w-md"
          placeholder="Search employee name, username, ID…"
          value={q}
          onChange={(e) => {
            setPage(1);
            setQ(e.target.value);
          }}
        />
      </div>

      {err ? <div className="alert-error max-w-xl">{err}</div> : null}

      <div className="sa-panel overflow-hidden">
        {loading ? (
          <p className="p-8 text-center text-sm text-[var(--sa-muted)]">Loading…</p>
        ) : items.length === 0 ? (
          <p className="p-8 text-center text-sm text-[var(--sa-muted)]">No timesheets found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="sa-table min-w-[760px]">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Pay period</th>
                  <th>Hours</th>
                  <th>Submitted</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <p className="font-medium text-[var(--sa-heading)]">{row.employee.name}</p>
                      <p className="sa-mono text-xs text-[var(--sa-muted)]">{row.employee.employeeCode}</p>
                    </td>
                    <td className="text-xs text-[var(--sa-muted)]">
                      {row.payPeriod.name ?? `${shortDate(row.payPeriod.startDate)} – ${shortDate(row.payPeriod.endDate)}`}
                    </td>
                    <td className="text-sm text-[var(--sa-text)]">{row.totalHours}h</td>
                    <td className="text-xs text-[var(--sa-muted)]">
                      {row.submittedAt ? shortDate(row.submittedAt) : "—"}
                    </td>
                    <td>
                      <TimesheetStatusBadge status={row.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 ? (
        <div className="flex items-center justify-between text-sm text-[var(--sa-muted)]">
          <span>
            Page {page} of {totalPages} · {total} total
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              className="sa-btn-ghost"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </button>
            <button
              type="button"
              className="sa-btn-ghost"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
