"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Users } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

type Row = {
  id: string;
  name: string;
  email: string;
  employeeCode: string;
  deletedAt: string | null;
  timesheetCount: number;
  payslipCount: number;
};

type StatusFilter = "active" | "deleted" | "all";

export default function AdminEmployeesPage() {
  const [status, setStatus] = useState<StatusFilter>("active");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Row | null>(null);

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
    load();
  }, [load]);

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
    } catch {
      setErr("Network error");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="page-container max-w-6xl space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="page-eyebrow">Directory</p>
          <h1 className="page-title mt-1">
            <span className="stat-icon mb-2">
              <Users className="h-5 w-5 text-violet-200" aria-hidden />
            </span>
            <span className="block">Employee management</span>
          </h1>
          <p className="page-description">
            Deactivating keeps timesheets, payslips, and history intact. Restore access anytime.
          </p>
        </div>
      </div>

      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-100">Show</p>
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
                    ? "bg-violet-600 text-white shadow-md shadow-violet-600/20"
                    : "bg-white/[0.06] text-slate-300 ring-1 ring-white/10 hover:bg-white/10"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {err && <div className="alert-error">{err}</div>}

      <Card padding={false} className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-shell min-w-[720px]">
            <thead>
              <tr className="table-head">
                <th className="px-4 py-3.5">Name</th>
                <th className="px-4 py-3.5">Email</th>
                <th className="px-4 py-3.5">Employee ID</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-sm text-slate-500">
                    <span className="inline-flex items-center gap-2">
                      <span
                        className="h-4 w-4 animate-spin rounded-full border-2 border-violet-200 border-t-violet-600"
                        aria-hidden
                      />
                      Loading employees…
                    </span>
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-14 text-center">
                    <p className="text-sm font-medium text-slate-200">No employees match this filter</p>
                    <p className="mt-1 text-xs text-slate-500">Try another filter or add profiles from the employee portal.</p>
                  </td>
                </tr>
              ) : (
                rows.map((r) => {
                  const isDeleted = Boolean(r.deletedAt);
                  return (
                    <tr key={r.id} className="table-row table-row-muted">
                      <td className="px-4 py-3.5 font-medium text-slate-100">{r.name}</td>
                      <td className="px-4 py-3.5 text-slate-600">{r.email}</td>
                      <td className="px-4 py-3.5 font-mono text-xs text-slate-700">{r.employeeCode}</td>
                      <td className="px-4 py-3.5">
                        {isDeleted ? (
                          <Badge variant="danger">Deactivated</Badge>
                        ) : (
                          <Badge variant="success">Active</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex flex-wrap justify-end gap-2">
                          <Link
                            href={`/admin/employees/${r.id}`}
                            className="inline-flex h-9 items-center rounded-xl border border-white/15 bg-white/[0.06] px-3 text-xs font-semibold text-slate-200 shadow-sm transition hover:border-violet-400/40 hover:bg-white/10"
                          >
                            View
                          </Link>
                          {!isDeleted ? (
                            <Button
                              type="button"
                              variant="danger"
                              className="h-9 px-3 text-xs"
                              disabled={pendingId === r.id}
                              onClick={() => setConfirmDelete(r)}
                            >
                              Deactivate
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-employee-title"
        >
          <Card className="w-full max-w-md border-violet-100 shadow-2xl shadow-violet-950/15">
            <h2 id="delete-employee-title" className="text-lg font-semibold text-slate-100">
              Deactivate employee?
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              They won&apos;t be able to use the portal until restored. All timesheets, payslips, and audit
              history stay on file.
            </p>
            <p className="mt-3 rounded-xl bg-white/[0.06] px-3 py-2 text-sm text-slate-200">
              <span className="font-semibold">{confirmDelete.name}</span>
              <span className="text-slate-400"> · </span>
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
                {pendingId === confirmDelete.id ? "Working…" : "Deactivate"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
