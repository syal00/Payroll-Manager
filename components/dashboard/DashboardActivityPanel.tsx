"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { shortDate } from "@/lib/format";
import { formatAuditAction } from "@/lib/format";
import { CheckCircle2 } from "lucide-react";

type Approval = {
  id: string;
  newStatus: string;
  createdAt: string;
  admin: { name: string };
  timesheet: {
    id: string;
    employee: { name: string };
  };
};

type AuditLog = {
  id: string;
  action: string;
  entityType: string;
  createdAt: string;
  actor: { name: string } | null;
};

type Props = {
  recentApprovals: Approval[];
  recentAuditLogs: AuditLog[];
  isMainAdmin: boolean;
};

function formatApprovalAction(status: string) {
  switch (status) {
    case "APPROVED":
      return "approved";
    case "REJECTED":
      return "rejected";
    case "UNDER_REVIEW":
      return "marked under review";
    default:
      return status.toLowerCase();
  }
}

export function DashboardActivityPanel({ recentApprovals, recentAuditLogs, isMainAdmin }: Props) {
  const approvalItems = recentApprovals.slice(0, 4);
  const auditItems = isMainAdmin ? recentAuditLogs.slice(0, 3) : [];
  const hasItems = approvalItems.length > 0 || auditItems.length > 0;

  return (
    <Card className="ui-panel dash-panel !rounded-2xl !border-[var(--elite-border)] !shadow-sm">
      <div className="card-header !mb-0 flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="card-heading text-base text-[var(--elite-heading)]">Recent activity</h2>
          <p className="card-subtitle">Approvals and system events</p>
        </div>
        <Link href="/admin/history" className="link-accent shrink-0 text-sm font-semibold">
          Full history
        </Link>
      </div>

      {!hasItems ? (
        <p className="mt-5 rounded-xl bg-[var(--elite-accent-soft)]/40 px-4 py-8 text-center text-sm text-[var(--text-muted)]">
          Activity will appear here as payroll work is processed.
        </p>
      ) : (
        <ul className="mt-5 divide-y divide-[var(--elite-border)]">
          {approvalItems.map((a) => (
            <li key={`approval-${a.id}`} className="flex gap-3 py-3.5 first:pt-0">
              <span className="dash-activity-icon dash-activity-icon--success mt-0.5 shrink-0" aria-hidden>
                <CheckCircle2 className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-[var(--elite-text)]">
                  <span className="font-medium">{a.admin.name}</span> {formatApprovalAction(a.newStatus)}{" "}
                  <Link href={`/admin/timesheets/${a.timesheet.id}`} className="text-[var(--elite-accent)] hover:underline">
                    {a.timesheet.employee.name}
                  </Link>
                </p>
                <p className="mt-0.5 text-xs text-[var(--text-muted)]">{shortDate(a.createdAt)}</p>
              </div>
            </li>
          ))}
          {auditItems.map((log) => (
            <li key={`audit-${log.id}`} className="py-3.5">
              <p className="text-sm text-[var(--elite-text)]">
                <span className="font-medium">{log.actor?.name ?? "System"}</span>
                <span className="text-[var(--text-muted)]"> · {formatAuditAction(log.action)}</span>
              </p>
              <p className="mt-0.5 text-xs text-[var(--text-muted)]">{shortDate(log.createdAt)}</p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
