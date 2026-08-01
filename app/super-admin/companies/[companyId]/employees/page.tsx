"use client";

import { use, useCallback, useEffect, useState } from "react";
import { Archive, RotateCcw, Trash2 } from "lucide-react";

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

type DeleteMode = "archive" | "permanent";

export default function CompanyEmployeesPage({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = use(params);
  const [rows, setRows] = useState<EmployeeRow[]>([]);
  const [status, setStatus] = useState<"active" | "pending" | "deleted" | "all">("active");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EmployeeRow | null>(null);
  const [deleteMode, setDeleteMode] = useState<DeleteMode>("archive");
  const [deleteErr, setDeleteErr] = useState<string | null>(null);

  const apiBase = `/api/super-admin/companies/${companyId}/employees`;

  const load = useCallback(() => {
    setLoading(true);
    setErr(null);
    fetch(`${apiBase}?status=${status}`)
      .then((r) => r.json())
      .then((j) => {
        if (j.error) setErr(j.error);
        else setRows(j.employees ?? []);
      })
      .catch(() => setErr("Failed to load employees"))
      .finally(() => setLoading(false));
  }, [apiBase, status]);

  useEffect(() => {
    load();
  }, [load]);

  function openArchive(row: EmployeeRow) {
    setDeleteErr(null);
    setDeleteMode("archive");
    setDeleteTarget(row);
  }

  function openPermanentDelete(row: EmployeeRow) {
    setDeleteErr(null);
    setDeleteMode("permanent");
    setDeleteTarget(row);
  }

  async function restore(id: string) {
    setBusyId(id);
    setErr(null);
    try {
      const res = await fetch(`${apiBase}/${id}/restore`, { method: "POST" });
      const j = await res.json();
      if (!res.ok) {
        setErr(j.error ?? "Restore failed");
        return;
      }
      load();
    } catch {
      setErr("Network error");
    } finally {
      setBusyId(null);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleteErr(null);
    setBusyId(deleteTarget.id);
    try {
      const url =
        deleteMode === "permanent" ? `${apiBase}/${deleteTarget.id}/permanent` : `${apiBase}/${deleteTarget.id}`;
      const res = await fetch(url, { method: "DELETE" });
      const j = await res.json();
      if (!res.ok) {
        setDeleteErr(j.error ?? "Delete failed");
        return;
      }
      setDeleteTarget(null);
      load();
    } catch {
      setDeleteErr("Network error");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="page-container space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-[var(--sa-heading)]">Employees</h1>
        <p className="mt-1 text-sm text-[var(--sa-muted)]">
          Full roster for this tenant — archive, restore, or permanently remove employee accounts.
        </p>
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
            <table className="sa-table min-w-[900px]">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Username</th>
                  <th>Contact email</th>
                  <th>Role / dept</th>
                  <th>Activity</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
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
                    <td className="text-right">
                      <div className="flex flex-wrap justify-end gap-1.5">
                        {r.deletedAt ? (
                          <button
                            type="button"
                            className="sa-btn-ghost !px-2 !py-1 text-xs text-emerald-300"
                            disabled={busyId === r.id}
                            onClick={() => void restore(r.id)}
                            title="Restore employee"
                          >
                            <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="sa-btn-ghost !px-2 !py-1 text-xs text-amber-300"
                            disabled={busyId === r.id}
                            onClick={() => openArchive(r)}
                            title="Archive employee"
                          >
                            <Archive className="h-3.5 w-3.5" aria-hidden />
                          </button>
                        )}
                        <button
                          type="button"
                          className="sa-btn-ghost sa-btn-danger !px-2 !py-1 text-xs"
                          disabled={busyId === r.id}
                          onClick={() => openPermanentDelete(r)}
                          title="Delete permanently"
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {deleteTarget && (
        <div className="sa-modal-overlay" role="dialog" aria-modal="true">
          <div className="sa-modal">
            <h2 className="text-lg font-semibold text-[var(--sa-heading)]">
              {deleteMode === "archive" ? "Archive employee?" : "Delete permanently?"}
            </h2>
            <p className="mt-3 text-sm text-[var(--sa-muted)]">
              {deleteMode === "archive"
                ? "This hides the employee from active lists but keeps timesheets and payslips. You can restore them later."
                : "This permanently removes the employee profile, all timesheets and payslips, and their portal login. This cannot be undone."}
            </p>
            <p className="mt-3 rounded-lg border border-[var(--sa-border)] bg-black/20 px-3 py-2 text-sm">
              <span className="font-medium text-[var(--sa-heading)]">{deleteTarget.name}</span>
              <span className="text-[var(--sa-muted)]"> · </span>
              <span className="font-mono text-xs">{deleteTarget.employeeCode}</span>
            </p>
            {deleteErr && <div className="alert-error mt-4 text-sm">{deleteErr}</div>}
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" className="sa-btn-ghost" onClick={() => setDeleteTarget(null)}>
                Cancel
              </button>
              <button
                type="button"
                className={`sa-btn-primary ${deleteMode === "permanent" ? "sa-btn-danger" : ""}`}
                disabled={busyId === deleteTarget.id}
                onClick={() => void confirmDelete()}
              >
                {busyId === deleteTarget.id
                  ? "Working…"
                  : deleteMode === "archive"
                    ? "Archive employee"
                    : "Delete permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
