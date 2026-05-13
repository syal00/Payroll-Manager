"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TimesheetStatusBadge } from "@/components/status-badges";
import { shortDate } from "@/lib/format";

type Row = {
  id: string;
  status: string;
  totalRegular: number;
  totalOvertime: number;
  totalLeave: number;
  totalHours: number;
  submittedAt: string | null;
  employee: { name: string; user: { name: string } | null };
  payPeriod: { id: string; name: string | null; startDate: string };
};

type Period = { id: string; name: string | null; startDate: string };

export default function AdminReviewPage() {
  const [items, setItems] = useState<Row[]>([]);
  const [periods, setPeriods] = useState<Period[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [payPeriodId, setPayPeriodId] = useState("");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("submittedAt");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const pageSize = 15;

  function load() {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
      sort,
      order,
    });
    if (payPeriodId) params.set("payPeriodId", payPeriodId);
    if (q.trim()) params.set("q", q.trim());
    if (status) params.set("status", status);
    fetch(`/api/timesheets?${params}`)
      .then((r) => r.json())
      .then((j) => {
        if (!j.error) {
          setItems(j.items);
          setTotal(j.total);
        }
      });
  }

  useEffect(() => {
    fetch("/api/pay-periods")
      .then((r) => r.json())
      .then((j) => {
        if (j.payPeriods) setPeriods(j.payPeriods);
      });
  }, []);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, payPeriodId, sort, order, status]);

  return (
    <div className="page-container max-w-7xl space-y-8">
      <PageHeader
        eyebrow="Compliance"
        title="Timesheet review"
        description="Surface discrepancies fasterâ€”tie every adjustment to payroll periods without leaving the approvals fabric."
      />

      <Card className="rounded-2xl border-[var(--color-border)] !bg-[var(--color-bg-card)]/95 backdrop-blur-sm">
        <div className="flex flex-col gap-4 md:flex-row md:flex-wrap md:items-end">
          <div className="min-w-[180px] flex-1">
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
          <div className="min-w-[160px] flex-1">
            <label className="label-field" htmlFor="filter-status">
              Status
            </label>
            <select
              id="filter-status"
              className="select-field mt-1.5"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
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
            <label className="label-field" htmlFor="filter-q">
              Employee name
            </label>
            <input
              id="filter-q"
              className="input-field mt-1.5"
              placeholder="Search by nameâ€¦"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (setPage(1), load())}
            />
          </div>
          <div>
            <span className="label-field">Sort</span>
            <div className="mt-1.5 flex flex-wrap gap-2">
              <select
                className="select-field min-w-[8.5rem]"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                aria-label="Sort by"
              >
                <option value="submittedAt">Submitted</option>
                <option value="updatedAt">Updated</option>
                <option value="status">Status</option>
              </select>
              <select
                className="select-field min-w-[5.5rem]"
                value={order}
                onChange={(e) => setOrder(e.target.value as "asc" | "desc")}
                aria-label="Sort order"
              >
                <option value="desc">Newest</option>
                <option value="asc">Oldest</option>
              </select>
            </div>
          </div>
          <Button
            variant="secondary"
            className="md:mb-0.5"
            onClick={() => {
              setPage(1);
              load();
            }}
          >
            Apply filters
          </Button>
        </div>
      </Card>

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
              {items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-14 text-center text-sm text-slate-500">
                    <p className="font-medium text-slate-700">No timesheets match these filters</p>
                    <p className="mt-1 text-xs">Try clearing the period or widening the status.</p>
                  </td>
                </tr>
              ) : (
                items.map((row) => (
                  <tr key={row.id} className="table-row table-row-muted text-slate-700">
                    <td className="px-4 py-3.5 font-medium text-[var(--color-text-primary)]">{row.employee.name}</td>
                    <td className="px-4 py-3.5 text-slate-600">
                      {row.payPeriod.name ?? shortDate(row.payPeriod.startDate)}
                    </td>
                    <td className="px-4 py-3.5">
                      <TimesheetStatusBadge status={row.status} />
                    </td>
                    <td className="px-4 py-3.5 tabular-nums text-slate-600">
                      {row.totalRegular} / {row.totalOvertime} / {row.totalLeave}
                    </td>
                    <td className="px-4 py-3.5 tabular-nums font-semibold text-[var(--color-text-primary)]">{row.totalHours}</td>
                    <td className="px-4 py-3.5 text-slate-500">
                      {row.submittedAt ? shortDate(row.submittedAt) : "â€”"}
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
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-4 py-3.5 text-sm text-slate-600">
          <span>{total === 0 ? "No rows" : `Page ${page} Â· ${total} total`}</span>
          <div className="flex gap-2">
            <Button variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              Previous
            </Button>
            <Button
              variant="secondary"
              disabled={page * pageSize >= total}
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
