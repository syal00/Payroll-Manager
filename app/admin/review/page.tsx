"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PageSearchBar } from "@/components/ui/PageSearchBar";
import { TimesheetStatusBadge } from "@/components/status-badges";
import { shortDate, formatPayPeriodLabel } from "@/lib/format";

type Row = {
  id: string;
  status: string;
  totalRegular: number;
  totalOvertime: number;
  totalLeave: number;
  totalHours: number;
  submittedAt: string | null;
  employee: { name: string; user: { name: string } | null };
  payPeriod: { id: string; name: string | null; startDate: string; endDate: string };
};

type Period = { id: string; name: string | null; startDate: string };

export default function AdminReviewPage() {
  const searchParams = useSearchParams();
  const [items, setItems] = useState<Row[]>([]);
  const [periods, setPeriods] = useState<Period[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [payPeriodId, setPayPeriodId] = useState("");
  const [q, setQ] = useState("");
  const [appliedQ, setAppliedQ] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("submittedAt");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const pageSize = 15;

  useEffect(() => {
    fetch("/api/pay-periods")
      .then((r) => r.json())
      .then((j) => {
        if (j.payPeriods) setPeriods(j.payPeriods);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const urlQ = searchParams.get("q");
    if (urlQ) {
      setQ(urlQ);
      setAppliedQ(urlQ);
      setPage(1);
    }
  }, [searchParams]);

  useEffect(() => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
      sort,
      order,
    });
    if (payPeriodId) params.set("payPeriodId", payPeriodId);
    if (appliedQ) params.set("q", appliedQ);
    if (status) params.set("status", status);

    let cancelled = false;
    setLoading(true);
    setErr(null);
    fetch(`/api/timesheets?${params}`)
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return;
        if (j.error) {
          setErr(j.error);
          setItems([]);
          setTotal(0);
          return;
        }
        setItems(j.items ?? []);
        setTotal(j.total ?? 0);
      })
      .catch(() => {
        if (!cancelled) {
          setErr("Failed to load timesheets");
          setItems([]);
          setTotal(0);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [page, payPeriodId, sort, order, status, appliedQ]);

  function applyFilters() {
    setPage(1);
    setAppliedQ(q.trim());
  }

  return (
    <div className="page-container max-w-7xl space-y-8">
      <PageHeader
        eyebrow="Compliance"
        title="Timesheet review"
        description="Surface discrepancies faster—tie every adjustment to payroll periods without leaving the approvals fabric."
      />

      <Card className="rounded-2xl border-[var(--color-border)] !bg-[var(--color-bg-card)]/95 backdrop-blur-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-end">
          <div className="min-w-[160px] flex-1">
            <label className="label-field" htmlFor="filter-period">
              Pay period
            </label>
            <select
              id="filter-period"
              className="select-field mt-1.5"
              value={payPeriodId}
              onChange={(e) => {
                setPage(1);
                setPayPeriodId(e.target.value);
              }}
            >
              <option value="">All periods</option>
              {periods.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name ?? shortDate(p.startDate)}
                </option>
              ))}
            </select>
          </div>

          <div className="min-w-[140px] flex-1">
            <label className="label-field" htmlFor="filter-status">
              Status
            </label>
            <select
              id="filter-status"
              className="select-field mt-1.5"
              value={status}
              onChange={(e) => {
                setPage(1);
                setStatus(e.target.value);
              }}
            >
              <option value="">Any status</option>
              <option value="DRAFT">Draft</option>
              <option value="PENDING">Pending</option>
              <option value="UNDER_REVIEW">Under review</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          <div className="min-w-[200px] flex-[2]">
            <PageSearchBar
              id="filter-q"
              label="Employee name"
              value={q}
              placeholder="Search by name, email, or ID"
              onChange={setQ}
              onSubmit={applyFilters}
            />
          </div>

          <div className="min-w-[200px] flex-1">
            <span className="label-field">Sort</span>
            <div className="mt-1.5 flex flex-wrap gap-2">
              <select
                className="select-field min-w-[8.5rem] flex-1"
                value={sort}
                onChange={(e) => {
                  setPage(1);
                  setSort(e.target.value);
                }}
                aria-label="Sort by"
              >
                <option value="submittedAt">Submitted</option>
                <option value="updatedAt">Updated</option>
                <option value="status">Status</option>
              </select>
              <select
                className="select-field min-w-[5.5rem] flex-1"
                value={order}
                onChange={(e) => {
                  setPage(1);
                  setOrder(e.target.value as "asc" | "desc");
                }}
                aria-label="Sort order"
              >
                <option value="desc">Newest</option>
                <option value="asc">Oldest</option>
              </select>
            </div>
          </div>

          <Button type="button" variant="secondary" className="lg:mb-0.5 shrink-0" onClick={applyFilters}>
            Apply filters
          </Button>
        </div>
      </Card>

      {err ? <div className="alert-error">{err}</div> : null}

      <Card padding={false} className="overflow-hidden rounded-2xl border-[var(--color-border)] !bg-[var(--color-bg-card)]/95 backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="table-shell min-w-[720px]">
            <thead>
              <tr className="table-head">
                <th className="px-4 py-3.5">Employee</th>
                <th className="px-4 py-3.5">Period</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Reg / OT / Leave</th>
                <th className="px-4 py-3.5">Total</th>
                <th className="px-4 py-3.5">Submitted</th>
                <th className="px-4 py-3.5" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-14 text-center text-sm text-[var(--color-text-muted)]">
                    Loading timesheets…
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-14 text-center text-sm text-[var(--color-text-muted)]">
                    <p className="font-medium text-[var(--color-text-primary)]">
                      {appliedQ ? `No timesheets found for "${appliedQ}".` : "No timesheets match these filters"}
                    </p>
                    <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                      {appliedQ
                        ? "Try a different name or clear the search."
                        : "Try clearing the period or widening the status."}
                    </p>
                  </td>
                </tr>
              ) : (
                items.map((row) => (
                  <tr key={row.id} className="table-row table-row-muted">
                    <td className="px-4 py-3.5 font-medium text-[var(--color-text-primary)]">{row.employee.name}</td>
                    <td className="px-4 py-3.5 text-[var(--color-text-secondary)]">
                      {formatPayPeriodLabel(row.payPeriod)}
                    </td>
                    <td className="px-4 py-3.5">
                      <TimesheetStatusBadge status={row.status} />
                    </td>
                    <td className="px-4 py-3.5 tabular-nums text-[var(--color-text-secondary)]">
                      {row.totalRegular} / {row.totalOvertime} / {row.totalLeave}
                    </td>
                    <td className="px-4 py-3.5 tabular-nums font-semibold text-[var(--color-text-primary)]">
                      {row.totalHours}
                    </td>
                    <td className="px-4 py-3.5 text-[var(--color-text-muted)]">
                      {row.submittedAt ? shortDate(row.submittedAt) : "—"}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Link
                        href={`/admin/timesheets/${row.id}`}
                        className="btn btn-primary btn-xs h-9 px-3 shadow-sm"
                      >
                        Review
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-border)] px-4 py-3.5 text-sm text-[var(--color-text-secondary)]">
          <span>{loading ? "Loading…" : total === 0 ? "No rows" : `Page ${page} · ${total} total`}</span>
          <div className="flex gap-2">
            <Button variant="secondary" disabled={loading || page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              Previous
            </Button>
            <Button
              variant="secondary"
              disabled={loading || page * pageSize >= total}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
