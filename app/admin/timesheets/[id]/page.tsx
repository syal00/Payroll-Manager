"use client";

import { useEffect, useState, use, useMemo } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TimesheetStatusBadge } from "@/components/status-badges";
import { shortDate, money } from "@/lib/format";
import { TimesheetStatus } from "@/lib/enums";
import { sumEntries } from "@/lib/timesheet-math";

type Entry = {
  id: string;
  workDate: string;
  regularHours: number;
  overtimeHours: number;
  leaveHours: number;
  location: string | null;
  notes: string | null;
};

type Timesheet = {
  id: string;
  status: string;
  notes: string | null;
  totalRegular: number;
  totalOvertime: number;
  totalLeave: number;
  totalHours: number;
  entries: Entry[];
  employee: {
    name: string;
    email: string;
    employeeCode: string;
    hourlyRate: number;
    overtimeRate: number;
    user: { name: string; email: string } | null;
  };
  payPeriod: { name: string | null; startDate: string; endDate: string };
  payslip: { id: string; payslipNumber: string } | null;
  approvals: {
    id: string;
    newStatus: string;
    comment: string | null;
    rejectionReason: string | null;
    createdAt: string;
    admin: { name: string };
  }[];
};

export default function AdminTimesheetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [ts, setTs] = useState<Timesheet | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [deduction, setDeduction] = useState("400");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const [editNotes, setEditNotes] = useState("");
  const [editSummary, setEditSummary] = useState("");
  const [editHourly, setEditHourly] = useState("");
  const [editOT, setEditOT] = useState("");
  const [editEntries, setEditEntries] = useState<
    {
      id: string;
      workDate: string;
      regularHours: number;
      overtimeHours: number;
      leaveHours: number;
      location: string;
      notes: string;
    }[]
  >([]);

  function load() {
    fetch(`/api/timesheets/${id}`)
      .then((r) => r.json())
      .then((j) => {
        if (j.error) setErr(j.error);
        else setTs(j.timesheet);
      });
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload when id changes only
  }, [id]);

  useEffect(() => {
    if (!ts) return;
    setEditNotes(ts.notes ?? "");
    setEditHourly(String(ts.employee.hourlyRate));
    setEditOT(String(ts.employee.overtimeRate));
    setEditEntries(
      ts.entries.map((e) => ({
        id: e.id,
        workDate: e.workDate,
        regularHours: e.regularHours,
        overtimeHours: e.overtimeHours,
        leaveHours: e.leaveHours,
        location: e.location ?? "",
        notes: e.notes ?? "",
      }))
    );
  }, [ts]);

  const liveTotals = useMemo(
    () =>
      sumEntries(
        editEntries.map((e) => ({
          regularHours: e.regularHours,
          overtimeHours: e.overtimeHours,
          leaveHours: e.leaveHours,
        }))
      ),
    [editEntries]
  );

  const canEditHours = ts && !ts.payslip;

  function updateEntry(
    index: number,
    field: "regularHours" | "overtimeHours" | "leaveHours" | "location" | "notes",
    value: string
  ) {
    setEditEntries((prev) => {
      const next = [...prev];
      const row = { ...next[index]! };
      if (field === "notes" || field === "location") row[field] = value;
      else row[field] = Number(value) || 0;
      next[index] = row;
      return next;
    });
  }

  async function saveEdits() {
    if (!ts) return;
    setErr(null);
    setMsg(null);
    setBusy(true);
    const hr = parseFloat(editHourly);
    const ot = parseFloat(editOT);
    const res = await fetch(`/api/admin/timesheets/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        notes: editNotes,
        editSummary: editSummary.trim() || null,
        hourlyRate: Number.isFinite(hr) && hr > 0 ? hr : undefined,
        overtimeRate: Number.isFinite(ot) && ot > 0 ? ot : undefined,
        entries: editEntries.map((e) => ({
          id: e.id,
          regularHours: e.regularHours,
          overtimeHours: e.overtimeHours,
          leaveHours: e.leaveHours,
          location: e.location || null,
          notes: e.notes || null,
        })),
      }),
    });
    const j = await res.json();
    setBusy(false);
    if (!res.ok) {
      setErr(j.error ?? "Save failed");
      return;
    }
    setMsg("Timesheet and rates saved. The employee was notified.");
    setEditSummary("");
    setTs(j.timesheet);
  }

  async function approveAction(newStatus: "VERIFIED" | "APPROVED" | "REJECTED") {
    setErr(null);
    setMsg(null);
    setBusy(true);
    const res = await fetch(`/api/admin/timesheets/${id}/approval`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        newStatus,
        comment: comment || null,
        rejectionReason: newStatus === "REJECTED" ? rejectReason : null,
      }),
    });
    const j = await res.json();
    setBusy(false);
    if (!res.ok) {
      setErr(j.error ?? "Failed");
      return;
    }
    setMsg("Status updated.");
    setComment("");
    setRejectReason("");
    load();
  }

  async function genPayslip() {
    setErr(null);
    setMsg(null);
    setBusy(true);
    const d = parseFloat(deduction);
    const res = await fetch(`/api/admin/timesheets/${id}/payslip`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        deductionTotal: Number.isFinite(d) && d >= 0 ? d : 0,
      }),
    });
    const j = await res.json();
    setBusy(false);
    if (!res.ok) {
      setErr(j.error ?? "Failed");
      return;
    }
    setMsg("Payslip generated.");
    load();
    if (j.payslip?.id) {
      window.location.href = `/admin/payslips/${j.payslip.id}`;
    }
  }

  if (err && !ts) return <div className="alert-error max-w-xl">{err}</div>;
  if (!ts) {
    return (
      <div className="flex items-center gap-3 text-sm text-slate-500">
        <span
          className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--color-accent-tint)] border-t-violet-600"
          aria-hidden
        />
        Loading timesheetâ€¦
      </div>
    );
  }

  return (
    <div className="page-container max-w-5xl space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link href="/admin/review" className="link-accent text-sm">
            â† Back to review queue
          </Link>
          <p className="page-eyebrow mt-3">Timesheet detail</p>
          <h1 className="page-title mt-1">{ts.employee.name}</h1>
          <p className="page-description mt-1">
            <span className="font-mono font-semibold text-[var(--color-text-secondary)]">{ts.employee.employeeCode}</span>
            <span className="text-slate-300"> Â· </span>
            {ts.employee.email}
          </p>
        </div>
        <div className="shrink-0 self-start rounded-xl border border-[var(--color-accent-tint)] bg-[var(--color-accent-soft)]/50 px-3 py-2">
          <TimesheetStatusBadge status={ts.status} />
        </div>
      </div>

      {err && <div className="alert-error">{err}</div>}
      {msg && <div className="alert-success">{msg}</div>}

      <Card>
        <h2 className="card-heading">Pay period summary</h2>
        <p className="mt-1 text-sm text-slate-600">
          {ts.payPeriod.name ?? `${shortDate(ts.payPeriod.startDate)} â€“ ${shortDate(ts.payPeriod.endDate)}`}
        </p>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-[var(--color-accent-tint)]/80 bg-[var(--color-accent-soft)]/40 px-3 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Regular</p>
            <p className="mt-1 stat-card-value !text-xl">
              {canEditHours ? liveTotals.totalRegular : ts.totalRegular}h
            </p>
          </div>
          <div className="rounded-xl border border-[var(--color-accent-tint)]/80 bg-[var(--color-accent-soft)]/40 px-3 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Overtime</p>
            <p className="mt-1 stat-card-value !text-xl">
              {canEditHours ? liveTotals.totalOvertime : ts.totalOvertime}h
            </p>
          </div>
          <div className="rounded-xl border border-[var(--color-accent-tint)]/80 bg-[var(--color-accent-soft)]/40 px-3 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Leave</p>
            <p className="mt-1 stat-card-value !text-xl">
              {canEditHours ? liveTotals.totalLeave : ts.totalLeave}h
            </p>
          </div>
          <div className="rounded-xl border border-[var(--color-accent-tint)]/80 bg-[var(--color-accent-soft)]/40 px-3 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total</p>
            <p className="mt-1 stat-card-value !text-xl">
              {canEditHours ? liveTotals.totalHours : ts.totalHours}h
            </p>
          </div>
        </div>
        {canEditHours ? (
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label-field" htmlFor="ts-hourly">
                Hourly rate (employee)
              </label>
              <input
                id="ts-hourly"
                type="number"
                step="0.01"
                min={0}
                className="input-field mt-1.5"
                value={editHourly}
                onChange={(e) => setEditHourly(e.target.value)}
              />
              <p className="mt-1 text-xs text-slate-500">Used when calculating gross pay on the payslip.</p>
            </div>
            <div>
              <label className="label-field" htmlFor="ts-ot">
                Overtime rate (employee)
              </label>
              <input
                id="ts-ot"
                type="number"
                step="0.01"
                min={0}
                className="input-field mt-1.5"
                value={editOT}
                onChange={(e) => setEditOT(e.target.value)}
              />
            </div>
          </div>
        ) : (
          <p className="mt-4 text-xs text-slate-500">
            Pay rates: {money(ts.employee.hourlyRate)} hourly Â· {money(ts.employee.overtimeRate)} OT
          </p>
        )}
      </Card>

      {canEditHours && (
        <Card>
          <h2 className="card-heading">Edit timesheet</h2>
          <p className="mt-1 text-xs text-slate-500">
            Adjust daily hours, period notes, and pay rates. Changes are logged and the employee receives a
            notification. Editing locks after a payslip exists.
          </p>
          <label className="label-field mt-4" htmlFor="ts-edit-summary">
            Note to employee (optional, shown in notification)
          </label>
          <textarea
            id="ts-edit-summary"
            className="textarea-field mt-1.5 min-h-[4.5rem]"
            rows={2}
            placeholder="e.g. Corrected Monâ€“Wed to match access logs."
            value={editSummary}
            onChange={(e) => setEditSummary(e.target.value)}
          />
          <label className="label-field mt-4" htmlFor="ts-edit-notes">
            Period notes (on record)
          </label>
          <textarea
            id="ts-edit-notes"
            className="textarea-field mt-1.5 min-h-[4.5rem]"
            rows={2}
            value={editNotes}
            onChange={(e) => setEditNotes(e.target.value)}
          />
          <Button className="mt-4" disabled={busy || editEntries.length === 0} onClick={saveEdits}>
            Save hours, notes &amp; rates
          </Button>
        </Card>
      )}

      {!canEditHours && ts.payslip && (
        <div className="alert-warn">
          Hours and rates are read-only because payslip{" "}
          <Link className="font-semibold text-amber-950 underline" href={`/admin/payslips/${ts.payslip.id}`}>
            {ts.payslip.payslipNumber}
          </Link>{" "}
          exists. To change hours you would need to remove that payslip in the database first.
        </div>
      )}

      <Card padding={false} className="overflow-hidden">
        <div className="border-b border-white/10 px-5 py-4">
          <h2 className="card-heading">Daily breakdown</h2>
          <p className="mt-0.5 text-xs text-slate-500">Day-by-day hours and notes</p>
        </div>
        <div className="overflow-x-auto">
          <table className="table-shell min-w-[880px]">
            <thead>
              <tr className="table-head">
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Regular</th>
                <th className="px-4 py-3">OT</th>
                <th className="px-4 py-3">Leave</th>
                <th className="px-4 py-3">Location</th>
                <th className="min-w-[10rem] px-4 py-3">Day notes</th>
              </tr>
            </thead>
            <tbody>
              {(canEditHours ? editEntries : ts.entries).map((e, i) => (
                <tr key={e.id} className="table-row table-row-muted">
                  <td className="px-4 py-2.5 font-medium text-[var(--color-text-secondary)]">{shortDate(e.workDate)}</td>
                  {canEditHours ? (
                    <>
                      <td className="px-4 py-2.5">
                        <input
                          type="number"
                          min={0}
                          step={0.25}
                          className="timesheet-cell-input w-[4.5rem]"
                          value={editEntries[i]?.regularHours ?? 0}
                          onChange={(ev) => updateEntry(i, "regularHours", ev.target.value)}
                        />
                      </td>
                      <td className="px-4 py-2.5">
                        <input
                          type="number"
                          min={0}
                          step={0.25}
                          className="timesheet-cell-input w-[4.5rem]"
                          value={editEntries[i]?.overtimeHours ?? 0}
                          onChange={(ev) => updateEntry(i, "overtimeHours", ev.target.value)}
                        />
                      </td>
                      <td className="px-4 py-2.5">
                        <input
                          type="number"
                          min={0}
                          step={0.25}
                          className="timesheet-cell-input w-[4.5rem]"
                          value={editEntries[i]?.leaveHours ?? 0}
                          onChange={(ev) => updateEntry(i, "leaveHours", ev.target.value)}
                        />
                      </td>
                      <td className="min-w-[9rem] px-4 py-2.5">
                        <input
                          type="text"
                          placeholder="Site / Location"
                          className="timesheet-cell-input w-full"
                          value={editEntries[i]?.location ?? ""}
                          onChange={(ev) => updateEntry(i, "location", ev.target.value)}
                        />
                      </td>
                      <td className="min-w-[10rem] max-w-[280px] px-4 py-2.5">
                        <input
                          type="text"
                          className="timesheet-cell-input w-full"
                          value={editEntries[i]?.notes ?? ""}
                          onChange={(ev) => updateEntry(i, "notes", ev.target.value)}
                        />
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-2.5 tabular-nums text-[var(--color-text-secondary)]">{e.regularHours}</td>
                      <td className="px-4 py-2.5 tabular-nums text-[var(--color-text-secondary)]">{e.overtimeHours}</td>
                      <td className="px-4 py-2.5 tabular-nums text-[var(--color-text-secondary)]">{e.leaveHours}</td>
                      <td className="max-w-[12rem] px-4 py-2.5 text-slate-400">
                        {e.location?.trim() || "â€”"}
                      </td>
                      <td className="max-w-[220px] truncate px-4 py-2.5 text-slate-500">
                        {e.notes ?? "â€”"}
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <h2 className="card-heading">Review &amp; decision</h2>
        <p className="mt-1 text-xs text-slate-500">
          Flow: Pending â†’ Verified â†’ Approved (or reject with a reason the employee will see).
        </p>
        <label className="label-field mt-4" htmlFor="ts-comment">
          Comment (optional)
        </label>
        <textarea
          id="ts-comment"
          className="textarea-field mt-1.5 min-h-[4.5rem]"
          rows={2}
          placeholder="Internal or employee-visible note"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
        <label className="label-field mt-3" htmlFor="ts-reject">
          Rejection reason (required if rejecting)
        </label>
        <textarea
          id="ts-reject"
          className="textarea-field mt-1.5 min-h-[4.5rem]"
          rows={2}
          placeholder="Explain what needs to change"
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
        />
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            disabled={busy || ts.status !== TimesheetStatus.PENDING}
            variant="secondary"
            onClick={() => approveAction("VERIFIED")}
          >
            Mark verified
          </Button>
          <Button
            disabled={
              busy ||
              (ts.status !== TimesheetStatus.PENDING && ts.status !== TimesheetStatus.VERIFIED)
            }
            onClick={() => approveAction("APPROVED")}
          >
            Approve
          </Button>
          <Button
            disabled={
              busy ||
              ts.status === TimesheetStatus.DRAFT ||
              ts.status === TimesheetStatus.APPROVED ||
              ts.status === TimesheetStatus.REJECTED
            }
            variant="danger"
            onClick={() => approveAction("REJECTED")}
          >
            Reject
          </Button>
        </div>
      </Card>

      {ts.status === TimesheetStatus.APPROVED && (
        <Card>
          <h2 className="card-heading">Generate payslip</h2>
          <p className="mt-1 text-xs text-slate-500">Available once the timesheet is approved.</p>
          {ts.payslip ? (
            <p className="mt-3 text-sm text-slate-600">
              Generated:{" "}
              <Link className="link-accent font-semibold" href={`/admin/payslips/${ts.payslip.id}`}>
                {ts.payslip.payslipNumber}
              </Link>
            </p>
          ) : (
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
              <div>
                <label className="label-field" htmlFor="ts-deduction">
                  Total deductions (USD)
                </label>
                <input
                  id="ts-deduction"
                  className="input-field mt-1.5 sm:w-44"
                  value={deduction}
                  onChange={(e) => setDeduction(e.target.value)}
                />
              </div>
              <Button disabled={busy} onClick={genPayslip}>
                Generate payslip
              </Button>
            </div>
          )}
        </Card>
      )}

      <Card>
        <h2 className="card-heading">History &amp; comments</h2>
        <ul className="mt-4 space-y-3 text-sm">
          {ts.approvals.length === 0 ? (
            <li className="rounded-xl border border-dashed border-white/12 px-4 py-8 text-center text-slate-500">
              No actions recorded yet.
            </li>
          ) : (
            ts.approvals.map((a) => (
              <li
                key={a.id}
                className="rounded-xl border border-white/10 bg-[var(--color-accent-soft)]/30 px-4 py-3 shadow-sm shadow-violet-950/[0.02]"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <TimesheetStatusBadge status={a.newStatus} />
                  <span className="text-xs text-slate-500">{shortDate(a.createdAt)}</span>
                  <span className="text-xs font-medium text-slate-700">{a.admin.name}</span>
                </div>
                {a.comment && <p className="mt-1 text-slate-700">{a.comment}</p>}
                {a.rejectionReason && (
                  <p className="mt-2 text-sm text-rose-800">
                    <span className="font-semibold">Rejection:</span> {a.rejectionReason}
                  </p>
                )}
              </li>
            ))
          )}
        </ul>
      </Card>
    </div>
  );
}
