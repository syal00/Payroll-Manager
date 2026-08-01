"use client";

import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatDateTime } from "@/lib/format";
import {
  formatAuditAction,
  formatAuditActorName,
  formatAuditDetails,
  shortenEntityId,
} from "@/lib/audit-log-scope";

type Item = {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  details: string | null;
  createdAt: string;
  actor: { name: string; contactEmail: string } | null;
};

export default function AdminAuditPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 25;
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
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
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
  }, [applied, page, pageSize]);

  useEffect(() => {
    load();
  }, [load]);

  function applyFilters() {
    setPage(1);
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
        description="Company-scoped activity for your tenant. Platform provisioning for other companies is excluded."
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
          <Button type="button" onClick={applyFilters}>
            Apply filters
          </Button>
        </div>
      </Card>

      {err && <div className="alert-error">{err}</div>}

      <Card padding={false} className="overflow-hidden rounded-2xl border-[var(--color-border)] !bg-[var(--color-bg-card)]/95">
        <div className="overflow-x-auto">
          <table className="table-shell min-w-[960px]">
            <thead>
              <tr className="table-head">
                <th className="px-4 py-3.5">Date</th>
                <th className="px-4 py-3.5">Actor</th>
                <th className="px-4 py-3.5">Action</th>
                <th className="px-4 py-3.5">Target</th>
                <th className="min-w-[280px] px-4 py-3.5">Details</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-[var(--color-text-muted)]">
                    Loading…
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-[var(--color-text-muted)]">
                    No entries match these filters.
                  </td>
                </tr>
              ) : (
                items.map((row) => {
                  const details = formatAuditDetails(row.details);
                  const actorName = formatAuditActorName(row.actor, row.action);
                  return (
                    <tr key={row.id} className="table-row table-row-muted align-top">
                      <td className="whitespace-nowrap px-4 py-3.5 text-xs text-[var(--color-text-secondary)]">
                        {formatDateTime(row.createdAt)}
                      </td>
                      <td className="px-4 py-3.5 text-sm text-[var(--color-text-primary)]">
                        {actorName}
                        {row.actor?.contactEmail ? (
                          <span className="mt-0.5 block text-[11px] text-[var(--color-text-muted)]">
                            {row.actor.contactEmail}
                          </span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="font-mono text-[11px] font-bold uppercase tracking-wide text-[var(--color-accent-light)]">
                          {row.action}
                        </span>
                        <span className="mt-1 block text-[11px] text-[var(--color-text-muted)]">
                          {formatAuditAction(row.action)}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-[var(--color-text-secondary)]">
                        {row.entityType}
                        {row.entityId ? (
                          <span
                            className="mt-0.5 block font-mono text-[10px] text-[var(--color-text-muted)]"
                            title={row.entityId}
                          >
                            {shortenEntityId(row.entityId)}
                          </span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-[var(--color-text-secondary)]">
                        {details ? (
                          <pre className="max-h-36 overflow-y-auto overflow-x-hidden whitespace-pre-wrap break-words rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-sidebar)] p-2.5 font-mono text-[11px] leading-relaxed">
                            {details}
                          </pre>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-border)] px-4 py-3.5 text-sm text-[var(--color-text-secondary)]">
          <span>
            Total {total} · Page {page}
          </span>
          <div className="flex gap-2">
            <Button variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
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
