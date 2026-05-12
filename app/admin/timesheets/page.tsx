"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TimesheetStatusBadge } from "@/components/status-badges";
import { shortDate } from "@/lib/format";

type Row = {
  id: string;
  status: string;
  totalHours: number;
  submittedAt: string | null;
  employee: { name: string; user: { name: string } | null };
  payPeriod: { id: string; name: string | null; startDate: string };
};

export default function AdminTimesheetsPage() {
  const [items, setItems] = useState<Row[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const pageSize = 15;

  function load() {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize), sort: "submittedAt", order: "desc" });
    if (q.trim()) params.set("q", q.trim());
    if (status) params.set("status", status);
    fetch(`/api/timesheets?${params}`)
      .then((r) => r.json())
      .then((j) => {
        if (!j.error) {
          setItems(j.items ?? []);
          setTotal(j.total ?? 0);
        }
      });
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, status]);

  async function applyAction(id: string, newStatus: "APPROVED" | "REJECTED") {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/timesheets/${id}/approval`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newStatus,
          comment: null,
          rejectionReason: newStatus === "REJECTED" ? "Rejected from timesheets dashboard." : null,
        }),
      });
      if (res.ok) load();
    } finally {
      setBusyId(null);
    }
  }

  const filters = useMemo(
    () => [
      { label: "Pending", value: "PENDING" },
      { label: "Approved", value: "APPROVED" },
      { label: "Rejected", value: "REJECTED" },
    ],
    []
  );

  return (
    <div className="page-container max-w-7xl space-y-8">
      <PageHeader
        eyebrow="Workflow"
        title="Timesheets pipeline"
        description="Operational triage lane for submitted hours—prioritize bottlenecks, route approvals confidently."
      />

      <Card className="rounded-2xl border-[var(--color-border)] !bg-white/95 backdrop-blur-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="min-w-[220px] flex-1">
            <label className="label-field" htmlFor="timesheets-search">
              Search employee
            </label>
            <input
              id="timesheets-search"
              className="input-field mt-1.5"
              value={q}
              placeholder="Type a name and press Enter"
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (setPage(1), load())}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setPage(1);
                setStatus("");
              }}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                status === "" ? "bg-violet-600 text-white" : "bg-violet-50 text-slate-600 ring-1 ring-violet-200 hover:bg-violet-100"
              }`}
            >
              All
            </button>
            {filters.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => {
                  setPage(1);
                  setStatus(f.value);
                }}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  status === f.value
                    ? "bg-violet-600 text-white"
                    : "bg-violet-50 text-slate-600 ring-1 ring-violet-200 hover:bg-violet-100"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Card padding={false} className="overflow-hidden rounded-2xl border-[var(--color-border)] !bg-white/95 backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="table-shell min-w-[760px]">
            <thead>
              <tr className="table-head">
                <th className="px-4 py-3.5">Employee</th>
                <th className="px-4 py-3.5">Submitted</th>
                <th className="px-4 py-3.5">Hours</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-14 text-center text-sm text-slate-500">
                    No timesheets found.
                  </td>
                </tr>
              ) : (
                items.map((row) => (
                  <tr key={row.id} className="table-row table-row-muted">
                    <td className="px-4 py-3.5 font-medium text-slate-800">{row.employee.name}</td>
                    <td className="px-4 py-3.5 text-slate-600">{row.submittedAt ? shortDate(row.submittedAt) : "—"}</td>
                    <td className="px-4 py-3.5 font-semibold text-slate-700">{row.totalHours}h</td>
                    <td className="px-4 py-3.5">
                      <TimesheetStatusBadge status={row.status} />
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="secondary"
                          className="h-8 px-3 text-xs"
                          disabled={busyId === row.id || row.status === "APPROVED"}
                          onClick={() => applyAction(row.id, "APPROVED")}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="danger"
                          className="h-8 px-3 text-xs"
                          disabled={busyId === row.id || row.status === "REJECTED"}
                          onClick={() => applyAction(row.id, "REJECTED")}
                        >
                          Reject
                        </Button>
                        <Link
                          href={`/admin/timesheets/${row.id}`}
                          className="inline-flex h-8 items-center rounded-lg bg-violet-100 px-3 text-xs font-semibold text-violet-700 hover:bg-violet-200"
                        >
                          Open
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-violet-200 px-4 py-3.5 text-sm text-slate-600">
          <span>{total === 0 ? "No rows" : `Page ${page} · ${total} total`}</span>
          <div className="flex gap-2">
            <Button variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              Previous
            </Button>
            <Button variant="secondary" disabled={page * pageSize >= total} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
