"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Eye, Archive } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { dispatchAdminStatsRefresh } from "@/lib/admin-stats-refresh";

type Row = {
  id: string;
  name: string;
  email: string;
  employeeCode: string;
  deletedAt: string | null;
  isApproved?: boolean;
  timesheetCount: number;
  payslipCount: number;
  department: string | null;
  jobTitle: string | null;
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[parts.length - 1]![0] ?? ""}`.toUpperCase();
}

type StatusFilter = "active" | "deleted" | "all";

export default function AdminEmployeesPage() {
  const [status, setStatus] = useState<StatusFilter>("active");
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Row | null>(null);
  const [pendingRows, setPendingRows] = useState<Row[]>([]);

  const loadPending = useCallback(() => {
    fetch(`/api/admin/employees?status=pending`)
      .then((r) => r.json())
      .then((j) => setPendingRows((j.employees ?? []) as Row[]))
      .catch(() => setPendingRows([]));
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    setErr(null);
    fetch(`/api/admin/employees?status=${status}`)
      .then((r) => r.json())
      .then((j) => {
        if (j.error) setErr(j.error);
        else setRows(j.employees ?? []);
      })
      .catch(() => setErr("Failed to load employees"))
      .finally(() => setLoading(false));
  }, [status]);

  useEffect(() => {
    loadPending();
  }, [loadPending]);

  useEffect(() => {
    load();
  }, [load]);

  async function approvePending(id: string) {
    setPendingId(id);
    setErr(null);
    try {
      const res = await fetch(`/api/admin/employees/${id}/approve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error ?? "Approve failed");
        return;
      }
      loadPending();
      load();
      dispatchAdminStatsRefresh();
    } catch {
      setErr("Network error");
    } finally {
      setPendingId(null);
    }
  }

  async function rejectPending(id: string) {
    setPendingId(id);
    setErr(null);
    try {
      const res = await fetch(`/api/admin/employees/${id}/approve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error ?? "Reject failed");
        return;
      }
      loadPending();
      dispatchAdminStatsRefresh();
    } catch {
      setErr("Network error");
    } finally {
      setPendingId(null);
    }
  }

  const filteredRows = rows.filter((r) => {
    const query = q.trim().toLowerCase();
    if (!query) return true;
    return (
      r.name.toLowerCase().includes(query) ||
      r.email.toLowerCase().includes(query) ||
      r.employeeCode.toLowerCase().includes(query)
    );
  });

  async function confirmSoftDelete() {
    if (!confirmDelete) return;
    setPendingId(confirmDelete.id);
    try {
      const res = await fetch(`/api/admin/employees/${confirmDelete.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error ?? "Delete failed");
        return;
      }
      setConfirmDelete(null);
      load();
      loadPending();
      dispatchAdminStatsRefresh();
    } catch {
      setErr("Network error");
    } finally {
      setPendingId(null);
    }
  }

  async function restore(id: string) {
    setPendingId(id);
    try {
      const res = await fetch(`/api/admin/employees/${id}/restore`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error ?? "Restore failed");
        return;
      }
      load();
      loadPending();
      dispatchAdminStatsRefresh();
    } catch {
      setErr("Network error");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="page-container max-w-6xl space-y-8">
      <PageHeader
        eyebrow="Directory"
        title="Employee management"
        description="Deactivating keeps timesheets, payslips, and history intact â€” restore roster access anytime without losing immutable payroll records."
      >
        <Button className="h-11 rounded-xl shadow-md shadow-violet-500/20">Add employee</Button>
      </PageHeader>

      {pendingRows.length > 0 && (
        <Card className="rounded-2xl border-[var(--color-border)] !border-amber-200/80 !bg-amber-50/40 p-5">
          <h2 className="text-base font-bold text-[var(--color-text-primary)]">Pending approvals</h2>
          <p className="mt-1 text-sm text-slate-600">New self-registrations awaiting your decision.</p>
          <ul className="mt-4 space-y-3">
            {pendingRows.map((r) => (
              <li
                key={r.id}
                className="flex flex-col gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-semibold text-[var(--color-text-primary)]">{r.name}</p>
                  <p className="text-xs text-slate-600">{r.email}</p>
                  <p className="mt-1 font-mono text-xs font-bold text-[var(--color-accent-light)]">{r.employeeCode}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    className="h-9 px-3 text-xs"
                    disabled={pendingId === r.id}
                    onClick={() => void approvePending(r.id)}
                  >
                    Approve
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    className="h-9 px-3 text-xs"
                    disabled={pendingId === r.id}
                    onClick={() => void rejectPending(r.id)}
                  >
                    Reject
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card className="rounded-2xl border-[var(--color-border)] !bg-[var(--color-bg-card)]/95 shadow-[0_4px_22px_rgba(15,23,42,0.05)] backdrop-blur-sm">
        <div className="flex flex-col gap-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label-field" htmlFor="employee-search">
                Search
              </label>
              <input
                id="employee-search"
                className="input-field mt-1.5"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Name, email, or employee ID"
              />
            </div>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-[var(--color-text-primary)]">Show</p>
            <p className="text-xs text-slate-500">Filter the roster</p>
          </div>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Employee status filter">
            {(
              [
                { value: "active" as const, label: "Active" },
                { value: "deleted" as const, label: "Deactivated" },
                { value: "all" as const, label: "All" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setStatus(opt.value)}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  status === opt.value
                    ? "bg-[var(--color-accent)] text-white shadow-md shadow-violet-600/20"
                    : "bg-[var(--color-accent-soft)] text-slate-600 ring-1 ring-[var(--color-accent)] hover:bg-[var(--color-accent-tint)]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        </div>
      </Card>

      {err && <div className="alert-error">{err}</div>}

      <Card padding={false} className="overflow-hidden rounded-2xl border-[var(--color-border)] !bg-[var(--color-bg-card)]/95 backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="table-shell table-employees min-w-[900px]">
            <thead>
              <tr className="table-head">
                <th className="px-4 py-3.5">Team member</th>
                <th className="px-4 py-3.5">Department</th>
                <th className="px-4 py-3.5">Position</th>
                <th className="px-4 py-3.5">Summary</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-500">
                    <span className="inline-flex items-center gap-2">
                      <span
                        className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--color-accent-tint)] border-t-violet-600"
                        aria-hidden
                      />
                      Loading employeesâ€¦
                    </span>
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-14 text-center">
                    <p className="text-sm font-medium text-slate-700">No employees match this filter</p>
                    <p className="mt-1 text-xs text-slate-500">Try another filter or add profiles from the employee portal.</p>
                  </td>
                </tr>
              ) : (
                filteredRows.map((r) => {
                  const isDeleted = Boolean(r.deletedAt);
                  const needsApproval = r.isApproved === false && !isDeleted;
                  return (
                    <tr key={r.id} className="table-row table-row-muted">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--color-accent-hover)] to-[var(--color-accent-deep)] text-xs font-bold text-white shadow-inner shadow-black/10">
                            {initials(r.name)}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-[var(--color-text-primary)]">{r.name}</p>
                            <p className="truncate text-[11px] text-[var(--color-text-muted)]">{r.email}</p>
                            <p className="font-mono text-[10px] font-semibold text-[var(--color-accent-light)]/90">{r.employeeCode}</p>
                          </div>
                        </div>
                      </td>
                      <td className="max-w-[160px] px-4 py-3.5 text-sm text-[var(--color-text-secondary)]">
                        {r.department?.trim() ? r.department : <span className="text-[var(--color-text-muted)]">â€”</span>}
                      </td>
                      <td className="max-w-[180px] px-4 py-3.5 text-sm text-[var(--color-text-secondary)]">
                        {r.jobTitle?.trim() ? r.jobTitle : <span className="text-[var(--color-text-muted)]">â€”</span>}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-xs font-medium text-[var(--color-text-secondary)]">
                        {r.timesheetCount} ts Â· {r.payslipCount} slips
                      </td>
                      <td className="px-4 py-3.5">
                        {isDeleted ? (
                          <Badge variant="danger">Inactive</Badge>
                        ) : needsApproval ? (
                          <Badge variant="warning">Awaiting approval</Badge>
                        ) : r.timesheetCount > 0 ? (
                          <Badge variant="success">Active</Badge>
                        ) : (
                          <Badge variant="warning">No timesheets</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex flex-wrap justify-end gap-2">
                          <Link
                            href={`/admin/employees/${r.id}`}
                            title="View employee"
                            className="inline-flex h-9 min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-[var(--color-accent-tint)] bg-[var(--color-accent-soft)] px-3 text-xs font-semibold text-[var(--color-accent-light)] shadow-sm transition hover:border-[var(--color-accent)] hover:bg-[var(--color-accent-tint)] md:px-3"
                          >
                            <Eye className="h-4 w-4 md:hidden" aria-hidden />
                            <span className="hidden md:inline">View</span>
                          </Link>
                          {!isDeleted ? (
                            <Button
                              type="button"
                              variant="danger"
                              className="h-9 min-h-[44px] min-w-[44px] px-3 text-xs md:min-w-0"
                              disabled={pendingId === r.id}
                              onClick={() => setConfirmDelete(r)}
                              title="Archive employee"
                            >
                              <Archive className="h-4 w-4 md:hidden" aria-hidden />
                              <span className="hidden md:inline">Archive</span>
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              variant="secondary"
                              className="h-9 px-3 text-xs"
                              disabled={pendingId === r.id}
                              onClick={() => restore(r.id)}
                            >
                              Restore
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {confirmDelete && (
        <div
          className="modal-overlay z-[1100]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-employee-title"
        >
          <Card className="modal w-full max-w-md !shadow-[var(--shadow-modal)] border-[var(--color-border)]">
            <h2 id="delete-employee-title" className="modal-title text-lg">
              Archive employee?
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              This will archive {confirmDelete.name} and hide them from active employees. Their timesheet and payslip
              history will be preserved. This cannot be undone easily.
            </p>
            <p className="mt-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-page-bg)] px-3 py-2 text-sm text-[var(--color-text-secondary)]">
              <span className="font-semibold">{confirmDelete.name}</span>
              <span className="text-slate-400"> Â· </span>
              <span className="font-mono text-xs">{confirmDelete.employeeCode}</span>
            </p>
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                disabled={pendingId === confirmDelete.id}
                onClick={() => setConfirmDelete(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                disabled={pendingId === confirmDelete.id}
                onClick={confirmSoftDelete}
              >
                {pendingId === confirmDelete.id ? "Working…" : "Archive employee"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
