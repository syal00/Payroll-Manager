"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { shortDate } from "@/lib/format";
import { CheckCircle2, ClipboardList, Inbox, UserPlus } from "lucide-react";

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

type DemoRequest = {
  id: string;
  name: string;
  email: string;
  company: string | null;
  createdAt: string;
};

type Props = {
  recentApprovals: Approval[];
  recentAuditLogs: AuditLog[];
  recentDemoRequests: DemoRequest[];
  demoRequestCount: number;
  pendingEmployeeApprovals: number;
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

export function DashboardActivityPanel({
  recentApprovals,
  recentAuditLogs,
  recentDemoRequests,
  demoRequestCount,
  pendingEmployeeApprovals,
  isMainAdmin,
}: Props) {
  const alerts = [
    pendingEmployeeApprovals > 0
      ? {
          icon: UserPlus,
          label: `${pendingEmployeeApprovals} employee registration${pendingEmployeeApprovals === 1 ? "" : "s"} awaiting approval`,
          href: "/admin/employees",
        }
      : null,
    isMainAdmin && demoRequestCount > 0
      ? {
          icon: Inbox,
          label: `${demoRequestCount} demo request${demoRequestCount === 1 ? "" : "s"} in the last 30 days`,
          href: "/admin/demo-requests",
        }
      : null,
  ].filter(Boolean) as { icon: typeof UserPlus; label: string; href: string }[];

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="ui-panel !rounded-xl !border-[var(--elite-border)] !shadow-sm">
        <div className="card-header !mb-0 flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="card-heading text-base text-[var(--elite-heading)]">Recent activity</h2>
            <p className="card-subtitle">Latest approvals and changes</p>
          </div>
          <Link href="/admin/history" className="link-accent shrink-0 text-sm font-semibold">
            History →
          </Link>
        </div>

        <ul className="mt-5 space-y-3">
          {recentApprovals.length === 0 && recentAuditLogs.length === 0 ? (
            <li className="rounded-xl border border-dashed border-[var(--elite-border)] px-4 py-8 text-center text-sm text-[var(--text-muted)]">
              Activity will appear here as work is processed.
            </li>
          ) : null}

          {recentApprovals.slice(0, 4).map((a) => (
            <li key={`approval-${a.id}`} className="dash-activity-item">
              <span className="dash-activity-icon dash-activity-icon--success" aria-hidden>
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

          {isMainAdmin
            ? recentAuditLogs.slice(0, 3).map((log) => (
                <li key={`audit-${log.id}`} className="dash-activity-item">
                  <span className="dash-activity-icon" aria-hidden>
                    <ClipboardList className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-[var(--elite-text)]">
                      <span className="font-medium">{log.actor?.name ?? "System"}</span> — {log.action}{" "}
                      <span className="text-[var(--text-muted)]">({log.entityType})</span>
                    </p>
                    <p className="mt-0.5 text-xs text-[var(--text-muted)]">{shortDate(log.createdAt)}</p>
                  </div>
                </li>
              ))
            : null}
        </ul>
      </Card>

      <Card className="ui-panel !rounded-xl !border-[var(--elite-border)] !shadow-sm">
        <div className="card-header !mb-0 flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="card-heading text-base text-[var(--elite-heading)]">Alerts & requests</h2>
            <p className="card-subtitle">Items that may need attention</p>
          </div>
          {isMainAdmin ? (
            <Link href="/admin/audit" className="link-accent shrink-0 text-sm font-semibold">
              Audit log →
            </Link>
          ) : null}
        </div>

        <div className="mt-5 space-y-3">
          {alerts.length === 0 && recentDemoRequests.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--elite-border)] px-4 py-8 text-center text-sm text-[var(--text-muted)]">
              No alerts right now.
            </div>
          ) : null}

          {alerts.map(({ icon: Icon, label, href }) => (
            <Link key={href} href={href} className="dash-alert-row">
              <span className="dash-alert-icon" aria-hidden>
                <Icon className="h-4 w-4" />
              </span>
              <span className="text-sm font-medium text-[var(--elite-text)]">{label}</span>
            </Link>
          ))}

          {isMainAdmin
            ? recentDemoRequests.map((d) => (
                <Link key={d.id} href="/admin/demo-requests" className="dash-demo-row">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[var(--elite-text)]">{d.name}</p>
                    <p className="truncate text-xs text-[var(--text-muted)]">
                      {d.email}
                      {d.company ? ` · ${d.company}` : ""}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-[var(--text-muted)]">{shortDate(d.createdAt)}</span>
                </Link>
              ))
            : null}
        </div>
      </Card>
    </div>
  );
}
