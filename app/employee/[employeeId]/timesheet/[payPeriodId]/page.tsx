"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TimesheetStatusBadge } from "@/components/status-badges";
import { shortDate } from "@/lib/format";
import { sumEntries } from "@/lib/timesheet-math";

type Entry = {
  workDate: string;
  regularHours: number;
  overtimeHours: number;
  leaveHours: number;
  location: string;
  notes: string;
};

type ApiErrorBody = {
  error?: unknown;
  issues?: { path?: unknown; message?: string }[];
};

function timesheetActionErrorMessage(res: Response, j: ApiErrorBody, fallback: string): string {
  if (typeof j.error === "string" && j.error.length > 0) return j.error;
  const first = Array.isArray(j.issues) ? j.issues[0] : undefined;
  if (first && typeof first.message === "string") {
    const p = Array.isArray(first.path) ? first.path.map(String).filter(Boolean).join(".") : "";
    return p ? `${first.message} (${p})` : first.message;
  }
  return `${fallback} (${res.status})`;
}

export default function PublicTimesheetEntryPage({
  params,
}: {
  params: Promise<{ employeeId: string; payPeriodId: string }>;
}) {
  const { employeeId, payPeriodId } = use(params);
  const base = `/employee/${employeeId}`;
  const apiBase = `/api/public/employees/${employeeId}/timesheets/${payPeriodId}`;

  const [period, setPeriod] = useState<{
    name: string | null;
    startDate: string;
    endDate: string;
  } | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("");
  const [editable, setEditable] = useState(true);
  const [rejectReason, setRejectReason] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function load() {
    fetch(apiBase)
      .then(async (r) => {
        let j: Record<string, unknown> = {};
        try {
          j = (await r.json()) as Record<string, unknown>;
        } catch {
          /* non-JSON body */
        }
        const apiErr = typeof j.error === "string" ? j.error : null;
        if (!r.ok || apiErr) {
          setErr(apiErr ?? `Could not load timesheet (${r.status}).`);
          setPeriod(null);
          setEntries([]);
          setNotes("");
          setStatus("");
          return;
        }
        setErr(null);
        const payPeriod = j.payPeriod as {
          name: string | null;
          startDate: string;
          endDate: string;
        };
        const sheet = j.timesheet as {
          notes: string | null;
          status: string;
          entries: (Entry & { workDate: string; location?: string | null })[];
          approvals?: { newStatus: string; rejectionReason: string | null }[];
        };
        setPeriod(payPeriod);
        setNotes(sheet.notes ?? "");
        setStatus(sheet.status);
        setEditable(Boolean(j.editable));
        setEntries(
          sheet.entries.map((e) => ({
            workDate: new Date(e.workDate).toISOString().slice(0, 10),
            regularHours: e.regularHours,
            overtimeHours: e.overtimeHours,
            leaveHours: e.leaveHours,
            location: e.location ?? "",
            notes: e.notes ?? "",
          }))
        );
        const rej = sheet.approvals?.find?.((a) => a.newStatus === "REJECTED");
        setRejectReason(rej?.rejectionReason ?? null);
      })
      .catch(() => {
        setErr("Network error while loading timesheet.");
        setPeriod(null);
        setEntries([]);
      });
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId, payPeriodId]);

  function updateEntry(
    index: number,
    field: "regularHours" | "overtimeHours" | "leaveHours" | "location" | "notes",
    value: string
  ) {
    setEntries((prev) => {
      const next = [...prev];
      const row = { ...next[index]! };
      if (field === "notes" || field === "location") row[field] = value;
      else row[field] = Number(value) || 0;
      next[index] = row;
      return next;
    });
  }

  const totals = sumEntries(entries);

  async function saveDraft() {
    setErr(null);
    setMsg(null);
    setBusy(true);
    const body = {
      notes,
      entries: entries.map((e) => ({
        ...e,
        workDate: e.workDate,
      })),
    };
    const res = await fetch(apiBase, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const j = (await res.json().catch(() => ({}))) as ApiErrorBody;
    setBusy(false);
    if (!res.ok) setErr(timesheetActionErrorMessage(res, j, "Save failed"));
    else {
      setMsg("Draft saved.");
      load();
    }
  }

  async function submitFinal() {
    setErr(null);
    setMsg(null);
    setBusy(true);
    const body = {
      notes,
      entries: entries.map((e) => ({
        ...e,
        workDate: e.workDate,
      })),
    };
    const res = await fetch(`${apiBase}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const j = (await res.json().catch(() => ({}))) as ApiErrorBody & {
      timesheet?: { status: string };
    };
    setBusy(false);
    if (!res.ok) setErr(timesheetActionErrorMessage(res, j, "Submit failed"));
    else {
      setMsg("Submitted for review.");
      setEditable(false);
      setStatus(j.timesheet?.status ?? "PENDING");
      load();
    }
  }

  if (err && !period) return <div className="alert-error max-w-xl">{err}</div>;
  if (!period) {
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
      <div>
        <Link href={`${base}/dashboard`} className="link-accent text-sm">
          â† Dashboard
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h1 className="page-title">Submit your hours</h1>
          <TimesheetStatusBadge status={status} />
        </div>
        <p className="page-description mt-1">
          {period.name ?? `${shortDate(period.startDate)} â€“ ${shortDate(period.endDate)}`}
        </p>
      </div>

      {rejectReason && (
        <div className="alert-error">
          <p className="font-semibold text-rose-900">Revision requested</p>
          <p className="mt-1 text-rose-800">{rejectReason}</p>
        </div>
      )}

      {err && <div className="alert-error">{err}</div>}
      {msg && <div className="alert-success">{msg}</div>}

      <Card>
        <label className="label-field" htmlFor="emp-ts-notes">
          Period notes (optional)
        </label>
        <textarea
          id="emp-ts-notes"
          disabled={!editable}
          className="textarea-field mt-1.5 min-h-[4.5rem] disabled:cursor-not-allowed disabled:bg-[var(--color-bg-card)]/[0.04]"
          rows={2}
          placeholder="Anything your manager should know about this period"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </Card>

      <Card padding={false} className="overflow-hidden">
        <div className="border-b border-white/10 bg-[var(--color-bg-card)]/[0.03] px-5 py-3">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-slate-500">
            Period totals
          </p>
          <div className="mt-2 flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <span className="text-slate-400">
              Regular{" "}
              <strong className="ml-1 tabular-nums text-[var(--color-text-primary)]">{totals.totalRegular}h</strong>
            </span>
            <span className="text-slate-400">
              Overtime{" "}
              <strong className="ml-1 tabular-nums text-[var(--color-text-primary)]">{totals.totalOvertime}h</strong>
            </span>
            <span className="text-slate-400">
              Leave{" "}
              <strong className="ml-1 tabular-nums text-[var(--color-text-primary)]">{totals.totalLeave}h</strong>
            </span>
            <span className="text-slate-400">
              Total{" "}
              <strong className="ml-1 tabular-nums text-[var(--color-primary)]">{totals.totalHours}h</strong>
            </span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="table-shell min-w-[800px]">
            <thead>
              <tr className="table-head">
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Regular</th>
                <th className="px-4 py-3">OT</th>
                <th className="px-4 py-3">Leave</th>
                <th className="w-[9rem] max-w-[9rem] px-4 py-3">Location</th>
                <th className="min-w-[8rem] max-w-[14rem] px-4 py-3">Day notes</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e, i) => (
                <tr key={e.workDate} className="table-row table-row-muted">
                  <td className="whitespace-nowrap px-4 py-2.5 font-medium text-[var(--color-text-secondary)]">
                    {shortDate(e.workDate)}
                  </td>
                  {editable ? (
                    <>
                      <td className="px-4 py-2.5">
                        <input
                          type="number"
                          min={0}
                          step={0.25}
                          disabled={!editable}
                          className="timesheet-cell-input w-[4.5rem] disabled:cursor-not-allowed disabled:opacity-50"
                          value={entries[i]?.regularHours ?? 0}
                          onChange={(ev) => updateEntry(i, "regularHours", ev.target.value)}
                        />
                      </td>
                      <td className="px-4 py-2.5">
                        <input
                          type="number"
                          min={0}
                          step={0.25}
                          disabled={!editable}
                          className="timesheet-cell-input w-[4.5rem] disabled:cursor-not-allowed disabled:opacity-50"
                          value={entries[i]?.overtimeHours ?? 0}
                          onChange={(ev) => updateEntry(i, "overtimeHours", ev.target.value)}
                        />
                      </td>
                      <td className="px-4 py-2.5">
                        <input
                          type="number"
                          min={0}
                          step={0.25}
                          disabled={!editable}
                          className="timesheet-cell-input w-[4.5rem] disabled:cursor-not-allowed disabled:opacity-50"
                          value={entries[i]?.leaveHours ?? 0}
                          onChange={(ev) => updateEntry(i, "leaveHours", ev.target.value)}
                        />
                      </td>
                      <td className="w-[9rem] max-w-[9rem] px-4 py-2.5">
                        <input
                          type="text"
                          disabled={!editable}
                          placeholder="Site / Location"
                          className="timesheet-cell-input w-full max-w-[8.5rem] disabled:cursor-not-allowed disabled:opacity-50"
                          value={entries[i]?.location ?? ""}
                          onChange={(ev) => updateEntry(i, "location", ev.target.value)}
                        />
                      </td>
                      <td className="min-w-[8rem] max-w-[14rem] px-4 py-2.5">
                        <input
                          type="text"
                          disabled={!editable}
                          className="timesheet-cell-input w-full max-w-[13.5rem] disabled:cursor-not-allowed disabled:opacity-50"
                          value={entries[i]?.notes ?? ""}
                          onChange={(ev) => updateEntry(i, "notes", ev.target.value)}
                        />
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-2.5 tabular-nums text-[var(--color-text-muted)]">{e.regularHours}</td>
                      <td className="px-4 py-2.5 tabular-nums text-[var(--color-text-muted)]">{e.overtimeHours}</td>
                      <td className="px-4 py-2.5 tabular-nums text-[var(--color-text-muted)]">{e.leaveHours}</td>
                      <td className="max-w-[12rem] px-4 py-2.5 text-slate-400">{e.location?.trim() || "â€”"}</td>
                      <td className="max-w-[14rem] px-4 py-2.5 text-slate-500">{e.notes || "â€”"}</td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {editable ? (
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" disabled={busy} onClick={saveDraft}>
            Save draft
          </Button>
          <Button disabled={busy} onClick={submitFinal}>
            Submit for review
          </Button>
        </div>
      ) : (
        <Card className="border-white/10 bg-[var(--color-bg-card)]/[0.04]">
          <p className="text-sm leading-relaxed text-slate-300">
            This timesheet is locked while it&apos;s under review or finalized. If it was rejected, you can
            edit and submit again from this page.
          </p>
        </Card>
      )}
    </div>
  );
}
