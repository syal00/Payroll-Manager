"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PageSearchBar } from "@/components/ui/PageSearchBar";
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
  const searchParams = useSearchParams();
  const [items, setItems] = useState<Row[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [appliedQ, setAppliedQ] = useState("");
  const [status, setStatus] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const pageSize = 15;

  useEffect(() => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
      sort: "submittedAt",
      order: "desc",
    });
    if (appliedQ) params.set("q", appliedQ);
    if (status) params.set("status", status);

    let cancelled = false;
    fetch(`/api/timesheets?${params}`)
      .then((r) => r.json())
      .then((j) => {
        if (cancelled || j.error) return;
        setItems(j.items ?? []);
        setTotal(j.total ?? 0);
      });
    return () => {
      cancelled = true;
    };
  }, [page, status, appliedQ]);

  useEffect(() => {
    const urlQ = searchParams.get("q");
    if (urlQ) {
      setQ(urlQ);
      setAppliedQ(urlQ);
      setPage(1);
    }
  }, [searchParams]);

  function applySearch() {
    setPage(1);
    setAppliedQ(q.trim());
  }

  function reload() {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
      sort: "submittedAt",
      order: "desc",
    });
    if (appliedQ) params.set("q", appliedQ);
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

  async function applyAction(id: string, newStatus: "APPROVED" | "REJECTED") {
    if (newStatus === "REJECTED") {
      const reason = window.prompt("Rejection reason (shown to the employee):");
      if (!reason?.trim()) return;
      setBusyId(id);
      try {
        const res = await fetch(`/api/admin/timesheets/${id}/approval`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            newStatus,
            comment: null,
            rejectionReason: reason.trim(),
          }),
        });
        if (res.ok) reload();
      } finally {
        setBusyId(null);
      }
      return;
    }

    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/timesheets/${id}/approval`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newStatus,
          comment: null,
          rejectionReason: null,
        }),
      });
      if (res.ok) reload();
    } finally {
      setBusyId(null);
    }
  }

  const filters = [
    { label: "Pending", value: "PENDING" },
    { label: "Approved", value: "APPROVED" },
    { label: "Rejected", value: "REJECTED" },
  ] as const;

  return (
    <div className="page-container max-w-7xl space-y-8">
      <PageHeader
        eyebrow="Workflow"
        title="Timesheets pipeline"
        description="Operational triage lane for submitted hours—prioritize bottlenecks, route approvals confidently."
      />

      <Card className="rounded-2xl border-[var(--color-border)] !bg-[var(--color-bg-card)]/95 backdrop-blur-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="flex min-w-[220px] flex-1 flex-col gap-3 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1">
              <PageSearchBar
                id="timesheets-search"
                label="Search employee"
                value={q}
                placeholder="Name, email, or employee ID"
                onChange={setQ}
                onSubmit={applySearch}
              />
            </div>
            <Button type="button" variant="secondary" className="sm:mb-0.5 shrink-0" onClick={applySearch}>
              Search
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setPage(1);
                setStatus("");
              }}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                status === ""
                  ? "bg-[var(--color-accent)] text-white"
                  : "bg-[var(--color-accent-soft)] text-[var(--color-text-secondary)] ring-1 ring-[var(--color-accent)] hover:bg-[var(--color-accent-tint)]"
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
                    ? "bg-[var(--color-accent)] text-white"
                    : "bg-[var(--color-accent-soft)] text-[var(--color-text-secondary)] ring-1 ring-[var(--color-accent)] hover:bg-[var(--color-accent-tint)]"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Card padding={false} className="overflow-hidden rounded-2xl border-[var(--color-border)] !bg-[var(--color-bg-card)]/95 backdrop-blur-sm">
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
                  <td colSpan={5} className="px-4 py-14 text-center text-sm text-[var(--color-text-muted)]">
                    {appliedQ ? `No timesheets found for "${appliedQ}".` : "No timesheets found."}
                  </td>
                </tr>
              ) : (
                items.map((row) => (
                  <tr key={row.id} className="table-row table-row-muted">
                    <td className="px-4 py-3.5 font-medium text-[var(--color-text-primary)]">{row.employee.name}</td>
                    <td className="px-4 py-3.5 text-[var(--color-text-secondary)]">
                      {row.submittedAt ? shortDate(row.submittedAt) : "—"}
                    </td>
                    <td className="px-4 py-3.5 font-semibold tabular-nums text-[var(--color-text-primary)]">
                      {row.totalHours}h
                    </td>
                    <td className="px-4 py-3.5">
                      <TimesheetStatusBadge status={row.status} />
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="secondary"
                          className="h-8 px-3 text-xs"
                          disabled={busyId === row.id || row.status === "APPROVED" || row.status === "DRAFT"}
                          onClick={() => applyAction(row.id, "APPROVED")}
                        >
                          {row.status === "REJECTED" ? "Approve again" : "Approve"}
                        </Button>
                        <Button
                          variant="danger"
                          className="h-8 px-3 text-xs"
                          disabled={busyId === row.id || row.status === "REJECTED" || row.status === "DRAFT"}
                          onClick={() => applyAction(row.id, "REJECTED")}
                        >
                          {row.status === "APPROVED" ? "Revoke" : "Reject"}
                        </Button>
                        <Link
                          href={`/admin/timesheets/${row.id}`}
                          className="inline-flex h-8 items-center rounded-lg bg-[var(--color-accent-tint)] px-3 text-xs font-semibold text-[var(--color-accent-light)] hover:bg-[var(--color-accent)] hover:text-white"
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
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-border)] px-4 py-3.5 text-sm text-[var(--color-text-secondary)]">
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
