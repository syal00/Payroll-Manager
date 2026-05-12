"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarClock, CalendarDays, Timer, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
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

  const current = periods.find((p) => p.isCurrent);
  const upcoming = useMemo(() => {
    const openFuture = periods
      .filter((p) => p.status === "OPEN" && !p.isCurrent)
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    return openFuture[0] ?? null;
  }, [periods]);

  const submissionProgress =
    current && current._count
      ? Math.min(
          100,
          Math.round((current._count.timesheets / Math.max(current._count.timesheets + 8, 1)) * 100),
        )
      : 0;

  if (loading) {
    return (
      <div className="flex items-center gap-3 text-sm text-[var(--color-text-muted)]">
        <span
          className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--color-accent-tint)] border-t-violet-600"
          aria-hidden
        />
        Loading pay periodsâ€¦
      </div>
    );
  }

  return (
    <div className="page-container max-w-6xl space-y-8">
      <PageHeader
        eyebrow="Schedule"
        title="Pay period orchestration"
        description="Cadence-aligned windows define how employees submitâ€”and how payroll batches stay auditable across every fortnight cycle."
      />

      {err && <div className="alert-error rounded-2xl">{err}</div>}
      {msg && <div className="alert-success rounded-2xl">{msg}</div>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-[var(--color-border)] bg-gradient-to-br from-[var(--color-bg-card)] to-[var(--color-accent-soft)] p-4 shadow-[0_4px_18px_rgba(0,0,0,0.4)]">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[var(--color-accent-light)]">
            <CalendarDays className="h-4 w-4" aria-hidden />
            Current window
          </div>
          <p className="mt-3 text-lg font-extrabold text-[var(--color-text-primary)]">{current?.name ?? "Not assigned"}</p>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
            {current ? `${shortDate(current.startDate)} â€” ${shortDate(current.endDate)}` : "Set a period as current"}
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)]/90 p-4 shadow-[0_4px_18px_rgba(15,23,42,0.05)] backdrop-blur-sm">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            <CalendarClock className="h-4 w-4 text-[var(--color-accent-light)]" aria-hidden />
            Next open period
          </div>
          <p className="mt-3 text-lg font-extrabold text-[var(--color-text-primary)]">
            {upcoming ? upcoming.name ?? "Open period" : "â€”"}
          </p>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
            {upcoming ? `${shortDate(upcoming.startDate)} onward` : "Create another open window"}
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)]/90 p-4 shadow-[0_4px_18px_rgba(15,23,42,0.05)] backdrop-blur-sm">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            <Timer className="h-4 w-4 text-amber-500" aria-hidden />
            Payroll cutoff
          </div>
          <p className="mt-3 text-lg font-extrabold text-[var(--color-text-primary)]">{current ? shortDate(current.endDate) : "â€”"}</p>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">Lock adjustments before close-out</p>
        </div>
        <div className="rounded-2xl border border-[var(--color-accent-tint)] bg-gradient-to-br from-[var(--color-bg-sidebar)] via-[var(--color-bg-card)] to-[var(--color-accent-deep)] p-4 text-white shadow-[0_8px_32px_rgba(0,0,0,0.45)]">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[var(--color-accent)]">
            <TrendingUp className="h-4 w-4" aria-hidden />
            Submission throughput
          </div>
          <p className="mt-3 text-3xl font-black tabular-nums">{submissionProgress}%</p>
          <div className="mt-3 h-2 rounded-full bg-[var(--color-bg-card)]/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[var(--color-accent-hover)] to-[var(--color-accent-light)] transition-all"
              style={{ width: `${submissionProgress}%` }}
            />
          </div>
          <p className="mt-2 text-[11px] text-slate-300">
            Derived from filings vs. heuristic capacity for the highlighted period.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-2xl border-[var(--color-border)] !bg-[var(--color-bg-card)]/95 backdrop-blur-sm">
          <h2 className="card-heading">Create period</h2>
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
                placeholder="e.g. PP 12 â€” March"
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
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[var(--color-accent-tint)] bg-[var(--color-bg-card)]/4 px-4 py-3 text-sm text-slate-700">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 rounded border-[var(--color-accent)] text-[var(--color-accent-light)] focus:ring-[var(--color-accent)]"
                checked={form.setAsCurrent}
                onChange={(e) => setForm((f) => ({ ...f, setAsCurrent: e.target.checked }))}
              />
              <span>
                <span className="font-semibold text-[var(--color-text-primary)]">Set as current period</span>
                <span className="mt-0.5 block text-xs text-slate-500">
                  Clears other &quot;current&quot; flags so only this one is active.
                </span>
              </span>
            </label>
            <Button type="submit">Create pay period</Button>
          </form>
        </Card>

        <Card className="rounded-2xl border-[var(--color-border)] !bg-[var(--color-bg-card)]/95 backdrop-blur-sm">
          <h2 className="card-heading">All periods</h2>
          <p className="mt-1 text-xs text-slate-500">Status, totals, and quick actions</p>
          <div className="mt-5 max-h-[520px] space-y-3 overflow-y-auto pr-1">
            {periods.length === 0 ? (
              <p className="rounded-xl border border-dashed border-[var(--color-accent-tint)] bg-[var(--color-accent-soft)]/40 py-10 text-center text-sm text-slate-500">
                No pay periods yet. Create one to get started.
              </p>
            ) : (
              periods.map((p) => (
                <div
                  key={p.id}
                  className={`rounded-2xl border p-4 text-sm shadow-sm ${
                    p.isCurrent ? "border-[var(--color-accent)] bg-[var(--color-accent-tint)]/60" : "border-[var(--color-accent-tint)] bg-[var(--color-accent-soft)]/40"
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-[var(--color-text-primary)]">
                      {p.name ?? `${shortDate(p.startDate)} â€“ ${shortDate(p.endDate)}`}
                    </span>
                    <PayPeriodStatusBadge status={p.status} />
                    {p.isCurrent && (
                      <span className="rounded-lg bg-[var(--color-accent)] px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-white">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 text-xs text-slate-500">
                    {shortDate(p.startDate)} â€” {shortDate(p.endDate)}
                    {p._count
                      ? ` Â· ${p._count.timesheets} timesheets Â· ${p._count.payslips} payslips`
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
