"use client";

import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card } from "@/components/ui/Card";

type Item = {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  details: string | null;
  createdAt: string;
  actor: { name: string; email: string } | null;
};

export default function AdminAuditPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [total, setTotal] = useState(0);
  const [draftAction, setDraftAction] = useState("");
  const [draftFrom, setDraftFrom] = useState("");
  const [draftTo, setDraftTo] = useState("");
  const [draftQ, setDraftQ] = useState("");
  const [applied, setApplied] = useState({ q: "", action: "", from: "", to: "" });
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    setErr(null);
    const params = new URLSearchParams();
    if (applied.q.trim()) params.set("q", applied.q.trim());
    if (applied.action.trim()) params.set("action", applied.action.trim());
    if (applied.from) params.set("from", applied.from);
    if (applied.to) params.set("to", applied.to);
    fetch(`/api/admin/audit-logs?${params}`)
      .then((r) => r.json())
      .then((j) => {
        if (j.error) setErr(j.error);
        else {
          setItems(j.items ?? []);
          setTotal(j.total ?? 0);
        }
      })
      .catch(() => setErr("Failed to load audit log"))
      .finally(() => setLoading(false));
  }, [applied]);

  useEffect(() => {
    load();
  }, [load]);

  function applyFilters() {
    setApplied({
      q: draftQ,
      action: draftAction,
      from: draftFrom,
      to: draftTo,
    });
  }

  return (
    <div className="page-container max-w-6xl space-y-8">
      <PageHeader
        eyebrow="Compliance"
        title="Audit log"
        description="Most recent events first. Filter by action or date range."
      />

      <Card className="space-y-4 rounded-2xl border-[var(--color-border)] !bg-[var(--color-bg-card)]/95 p-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="label-field" htmlFor="audit-q">
              Search
            </label>
            <input
              id="audit-q"
              className="input-field mt-1.5"
              value={draftQ}
              onChange={(e) => setDraftQ(e.target.value)}
              placeholder="Action or entity"
            />
          </div>
          <div>
            <label className="label-field" htmlFor="audit-action">
              Action (exact)
            </label>
            <input
              id="audit-action"
              className="input-field mt-1.5"
              value={draftAction}
              onChange={(e) => setDraftAction(e.target.value)}
              placeholder="e.g. GENERATE_PAYSLIP"
            />
          </div>
          <div>
            <label className="label-field" htmlFor="audit-from">
              From
            </label>
            <input
              id="audit-from"
              type="date"
              className="input-field mt-1.5"
              value={draftFrom}
              onChange={(e) => setDraftFrom(e.target.value)}
            />
          </div>
          <div>
            <label className="label-field" htmlFor="audit-to">
              To
            </label>
            <input
              id="audit-to"
              type="date"
              className="input-field mt-1.5"
              value={draftTo}
              onChange={(e) => setDraftTo(e.target.value)}
            />
          </div>
        </div>
        <div className="flex justify-end">
          <button type="button" className="btn btn-primary h-10 px-4 text-sm font-semibold" onClick={applyFilters}>
            Apply filters
          </button>
        </div>
      </Card>

      {err && <div className="alert-error">{err}</div>}

      <Card padding={false} className="overflow-hidden rounded-2xl border-[var(--color-border)]">
        <div className="overflow-x-auto">
          <table className="table-shell min-w-[900px]">
            <thead>
              <tr className="table-head">
                <th className="px-4 py-3.5">Date</th>
                <th className="px-4 py-3.5">Admin</th>
                <th className="px-4 py-3.5">Action</th>
                <th className="px-4 py-3.5">Target</th>
                <th className="px-4 py-3.5">Details</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-500">
                    Loading…
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-500">
                    No entries match these filters.
                  </td>
                </tr>
              ) : (
                items.map((row) => (
                  <tr key={row.id} className="table-row table-row-muted">
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-600">
                      {new Date(row.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--color-text-primary)]">
                      {row.actor?.name ?? "—"}
                      {row.actor?.email ? (
                        <span className="mt-0.5 block text-[11px] text-slate-500">{row.actor.email}</span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-[var(--color-accent-light)]">
                      {row.action}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-700">
                      {row.entityType}
                      {row.entityId ? <span className="block font-mono text-[10px] text-slate-500">{row.entityId}</span> : null}
                    </td>
                    <td className="max-w-md px-4 py-3 text-xs text-slate-600">
                      <span className="line-clamp-3 break-all">{row.details ?? "—"}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <p className="border-t border-[var(--color-border)] px-4 py-3 text-xs text-slate-500">
          Showing {items.length} of {total} entries (first page).
        </p>
      </Card>
    </div>
  );
}
