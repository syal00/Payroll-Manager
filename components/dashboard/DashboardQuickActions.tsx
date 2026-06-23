"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ClipboardCheck,
  CalendarPlus,
  Receipt,
  BarChart3,
  Users,
  Inbox,
  History,
} from "lucide-react";

type Action = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
  badge?: number;
};

type Props = {
  pendingSubmissions: number;
  pendingEmployeeApprovals: number;
  demoRequestCount: number;
  isMainAdmin: boolean;
};

export function DashboardQuickActions({
  pendingSubmissions,
  pendingEmployeeApprovals,
  demoRequestCount,
  isMainAdmin,
}: Props) {
  const actions: Action[] = [
    {
      href: "/admin/review",
      label: "Review timesheets",
      description: "Approve or reject submissions",
      icon: ClipboardCheck,
      badge: pendingSubmissions > 0 ? pendingSubmissions : undefined,
    },
    {
      href: "/admin/employees",
      label: "Manage employees",
      description: "Add, edit, or archive staff",
      icon: Users,
      badge: pendingEmployeeApprovals > 0 ? pendingEmployeeApprovals : undefined,
    },
    {
      href: "/admin/pay-periods",
      label: "Pay periods",
      description: "Open or close payroll cycles",
      icon: CalendarPlus,
    },
    {
      href: "/admin/payslips",
      label: "Payslips",
      description: "Generate and send slips",
      icon: Receipt,
    },
    {
      href: "/admin/reports",
      label: "Reports",
      description: "Export payroll summaries",
      icon: BarChart3,
    },
    isMainAdmin
      ? {
          href: "/admin/demo-requests",
          label: "Demo requests",
          description: "Inbound product inquiries",
          icon: Inbox,
          badge: demoRequestCount > 0 ? demoRequestCount : undefined,
        }
      : {
          href: "/admin/history",
          label: "History",
          description: "Past approvals and changes",
          icon: History,
        },
  ];

  return (
    <div className="dash-quick-actions">
      {actions.map(({ href, label, description, icon: Icon, badge }) => (
        <Link key={href + label} href={href} className="dash-quick-action">
          <span className="dash-quick-action-icon" aria-hidden>
            <Icon className="h-5 w-5" strokeWidth={2} />
          </span>
          <span className="dash-quick-action-text">
            <span className="dash-quick-action-label">
              {label}
              {badge != null ? <span className="dash-quick-action-badge">{badge}</span> : null}
            </span>
            <span className="dash-quick-action-desc">{description}</span>
          </span>
        </Link>
      ))}
    </div>
  );
}
