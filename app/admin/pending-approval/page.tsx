"use client";

import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { dispatchAdminStatsRefresh } from "@/lib/admin-stats-refresh";
import { employeeSignInEmail } from "@/lib/display-name";

type Row = {
  id: string;
  name: string;
  username: string;
  contactEmail: string;
  employeeCode: string;
};

export default function PendingApprovalPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/admin/employees?status=pending");
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error ?? "Could not load pending registrations");
        return;
      }
      setRows(data.employees ?? []);
    } catch {
      setErr("Network error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
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
      load();
      dispatchAdminStatsRefresh();
    } catch {
      setErr("Network error");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="page-container max-w-4xl space-y-8">
      <PageHeader
        eyebrow="Approvals"
        title="Pending approvals"
        description="Review self-registrations from the employee portal. Approve to grant portal access, or reject to remove the pending account."
      />

      {err && (
        <div className="alert-error" role="alert">
          {err}
        </div>
      )}

      <Card className="rounded-2xl border-[var(--color-border)] !bg-[var(--color-bg-card)]/95 p-5 shadow-[0_4px_22px_rgba(15,23,42,0.05)]">
        {loading ? (
          <p className="text-sm text-[var(--color-text-muted)]">Loading pending registrations…</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)]">No pending employee registrations.</p>
        ) : (
          <ul className="space-y-3">
            {rows.map((r) => (
              <li
                key={r.id}
                className="flex flex-col gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-semibold text-[var(--color-text-primary)]">{r.name}</p>
                  <p className="truncate text-xs text-[var(--color-text-secondary)]">
                    {employeeSignInEmail(r.username, r.contactEmail)}
                  </p>
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
        )}
      </Card>
    </div>
  );
}
