"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatDateTime } from "@/lib/format";
import { formatAuditAction, formatAuditActorName, formatAuditDetails, shortenEntityId } from "@/lib/audit-log-scope";

type Log = {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  details: string | null;
  createdAt: string;
  actor: { name: string; contactEmail: string } | null;
};

export function AdminAuditTrailPanel() {
  const [items, setItems] = useState<Log[]>([]);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 25;

  function load() {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (q.trim()) params.set("q", q.trim());
    fetch(`/api/admin/audit-logs?${params}`)
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
  }, [page]);

  return (
    <>
      <Card className="rounded-2xl border-[var(--color-border)] !bg-[var(--color-bg-card)]/95 backdrop-blur-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1 sm:max-w-md">
            <label className="label-field" htmlFor="audit-q">
              Search action or entity
            </label>
            <input
              id="audit-q"
              className="input-field mt-1.5"
              value={q}
              placeholder="e.g. TIMESHEET, Employee, EMP001"
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (setPage(1), load())}
            />
          </div>
          <Button variant="secondary" className="sm:mb-0.5" onClick={() => (setPage(1), load())}>
            Search
          </Button>
        </div>
      </Card>

      <Card padding={false} className="overflow-hidden rounded-2xl border-[var(--color-border)] !bg-[var(--color-bg-card)]/95 backdrop-blur-sm">
        <div className="divide-y divide-[var(--color-border)]">
          {items.length === 0 ? (
            <div className="px-4 py-14 text-center text-sm text-[var(--color-text-muted)]">
              <p className="font-medium text-[var(--color-text-primary)]">No log entries match</p>
              <p className="mt-1 text-xs">Try a broader search or a different page.</p>
            </div>
          ) : (
            items.map((row) => {
              const details = formatAuditDetails(row.details);
              const entityIdShort = shortenEntityId(row.entityId);
              return (
                <div key={row.id} className="px-4 py-4 text-sm transition hover:bg-[var(--color-accent-soft)]/40">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="rounded-md bg-[var(--color-accent-soft)] px-2 py-0.5 font-mono text-[11px] font-bold uppercase tracking-wide text-[var(--color-accent-light)]">
                      {row.action}
                    </span>
                    <span className="text-xs text-[var(--color-text-muted)]">{formatDateTime(row.createdAt)}</span>
                    <span className="text-xs font-medium text-[var(--color-text-secondary)]">
                      {formatAuditActorName(row.actor, row.action)}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs text-[var(--color-text-muted)]">
                    <span className="font-medium text-[var(--color-text-secondary)]">{formatAuditAction(row.action)}</span>
                    {" · "}
                    {row.entityType}
                    {entityIdShort ? (
                      <>
                        {" · "}
                        <span className="font-mono" title={row.entityId ?? undefined}>
                          {entityIdShort}
                        </span>
                      </>
                    ) : null}
                  </p>
                  {details && (
                    <pre className="mt-2 max-h-40 overflow-y-auto overflow-x-hidden whitespace-pre-wrap break-words rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-sidebar)] p-3 font-mono text-[11px] leading-relaxed text-[var(--color-text-secondary)]">
                      {details}
                    </pre>
                  )}
                </div>
              );
            })
          )}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-border)] px-4 py-3.5 text-sm text-[var(--color-text-secondary)]">
          <span>Total {total}</span>
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
    </>
  );
}
