"use client";

import { useEffect, useState } from "react";
import { CalendarDays } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PayPeriodStatusBadge } from "@/components/status-badges";
import { shortDate } from "@/lib/format";

type Period = {
  id: string;
  name: string | null;
  startDate: string;
  endDate: string;
  status: string;
  isCurrent: boolean;
  _count?: { timesheets: number; payslips: number };
};

export default function AdminPayPeriodsPage() {
  const [periods, setPeriods] = useState<Period[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: "",
    startDate: "",
    endDate: "",
    status: "OPEN",
    setAsCurrent: true,
  });

  function load() {
    fetch("/api/pay-periods")
      .then((r) => r.json())
      .then((j) => {
        if (j.error) setErr(j.error);
        else setPeriods(j.payPeriods ?? []);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function createPeriod(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    const start = new Date(form.startDate);
    const end = new Date(form.endDate);
    const res = await fetch("/api/pay-periods", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name || undefined,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        status: form.status,
        setAsCurrent: form.setAsCurrent,
      }),
    });
    const j = await res.json();
    if (!res.ok) {
      setErr(j.error ?? "Failed");
      return;
    }
    setMsg("Pay period created.");
    setForm({ name: "", startDate: "", endDate: "", status: "OPEN", setAsCurrent: false });
    load();
  }

  async function patch(id: string, patch: Partial<{ status: string; isCurrent: boolean }>) {
    setErr(null);
    const res = await fetch(`/api/pay-periods/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const j = await res.json();
    if (!res.ok) setErr(j.error ?? "Update failed");
    else load();
  }

  if (loading) {
    return (
      <div className="flex items-center gap-3 text-sm text-slate-500">
        <span
          className="h-4 w-4 animate-spin rounded-full border-2 border-violet-200 border-t-violet-600"
          aria-hidden
        />
        Loading pay periods…
      </div>
    );
  }

  return (
    <div className="page-container max-w-6xl space-y-8">
      <div>
        <p className="page-eyebrow">Schedule</p>
        <h1 className="page-title mt-1 flex flex-wrap items-center gap-2">
          <span className="stat-icon shrink-0">
            <CalendarDays className="h-5 w-5 text-violet-200" aria-hidden />
          </span>
          Pay periods
        </h1>
        <p className="page-description">
          Each period must be exactly 14 days. Mark one as current so employees see the right window on their
          dashboard.
        </p>
      </div>

      {err && <div className="alert-error">{err}</div>}
      {msg && <div className="alert-success">{msg}</div>}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="text-base font-semibold text-slate-100">Create period</h2>
          <p className="mt-1 text-xs text-slate-500">Define dates and initial status</p>
          <form onSubmit={createPeriod} className="mt-6 space-y-4">
            <div>
              <label className="label-field" htmlFor="pp-name">
                Label (optional)
              </label>
              <input
                id="pp-name"
                className="input-field mt-1.5"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. PP 12 — March"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label-field" htmlFor="pp-start">
                  Start date
                </label>
                <input
                  id="pp-start"
                  type="date"
                  required
                  className="input-field mt-1.5"
                  value={form.startDate}
                  onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                />
              </div>
              <div>
                <label className="label-field" htmlFor="pp-end">
                  End date (inclusive, 14 days)
                </label>
                <input
                  id="pp-end"
                  type="date"
                  required
                  className="input-field mt-1.5"
                  value={form.endDate}
                  onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <label className="label-field" htmlFor="pp-status">
                Initial status
              </label>
              <select
                id="pp-status"
                className="select-field mt-1.5"
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
              >
                <option value="OPEN">Open</option>
                <option value="PROCESSING">Processing</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-violet-100 bg-white/[0.04] px-4 py-3 text-sm text-slate-700">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 rounded border-violet-300 text-violet-600 focus:ring-violet-500"
                checked={form.setAsCurrent}
                onChange={(e) => setForm((f) => ({ ...f, setAsCurrent: e.target.checked }))}
              />
              <span>
                <span className="font-semibold text-slate-100">Set as current period</span>
                <span className="mt-0.5 block text-xs text-slate-500">
                  Clears other &quot;current&quot; flags so only this one is active.
                </span>
              </span>
            </label>
            <Button type="submit">Create pay period</Button>
          </form>
        </Card>

        <Card>
          <h2 className="text-base font-semibold text-slate-100">All periods</h2>
          <p className="mt-1 text-xs text-slate-500">Status, totals, and quick actions</p>
          <div className="mt-5 max-h-[520px] space-y-3 overflow-y-auto pr-1">
            {periods.length === 0 ? (
              <p className="rounded-xl border border-dashed border-violet-200 py-10 text-center text-sm text-slate-500">
                No pay periods yet. Create one to get started.
              </p>
            ) : (
              periods.map((p) => (
                <div
                  key={p.id}
                  className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm shadow-inner shadow-black/30"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-slate-100">
                      {p.name ?? `${shortDate(p.startDate)} – ${shortDate(p.endDate)}`}
                    </span>
                    <PayPeriodStatusBadge status={p.status} />
                    {p.isCurrent && (
                      <span className="rounded-lg bg-violet-600 px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-white">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 text-xs text-slate-500">
                    {shortDate(p.startDate)} — {shortDate(p.endDate)}
                    {p._count
                      ? ` · ${p._count.timesheets} timesheets · ${p._count.payslips} payslips`
                      : ""}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button variant="secondary" className="h-8 px-2.5 text-xs" onClick={() => patch(p.id, { status: "OPEN" })}>
                      Open
                    </Button>
                    <Button
                      variant="secondary"
                      className="h-8 px-2.5 text-xs"
                      onClick={() => patch(p.id, { status: "PROCESSING" })}
                    >
                      Processing
                    </Button>
                    <Button
                      variant="secondary"
                      className="h-8 px-2.5 text-xs"
                      onClick={() => patch(p.id, { status: "CLOSED" })}
                    >
                      Closed
                    </Button>
                    <Button
                      variant="secondary"
                      className="h-8 px-2.5 text-xs"
                      onClick={() => patch(p.id, { isCurrent: true })}
                    >
                      Make current
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
