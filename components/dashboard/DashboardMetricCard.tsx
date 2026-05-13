"use client";

import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { TrendingUp, Minus } from "lucide-react";

type Props = {
  label: string;
  value: string | number;
  hint?: string;
  href: string;
  icon: LucideIcon;
  trend?: string;
  gradient?: "violet" | "indigo" | "fuchsia";
};

const gradients = {
  violet: "from-[#f07828] via-[#e8650a] to-[#c4540a]",
  indigo: "from-[#ffa563] via-[#f07828] to-[#e8650a]",
  fuchsia: "from-[#e8650a] via-[#c4540a] to-[#8a3a08]",
};

export function DashboardMetricCard({ label, value, hint, href, icon: Icon, trend, gradient = "violet" }: Props) {
  const hasTrend = trend && trend !== "—";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      whileHover={{ y: -3 }}
      className="h-full"
    >
      <Link
        href={href}
        className="group relative flex h-full min-h-[128px] flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.5)] transition-[box-shadow,border-color] duration-300 hover:border-[var(--color-accent-tint)] hover:shadow-[0_12px_40px_rgba(232,101,10,0.18)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
      >
        <span
          className="pointer-events-none absolute left-0 right-0 top-0 h-[3px] bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-light)]"
          aria-hidden
        />
        <div
          className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${gradients[gradient]} opacity-[0.06] transition-opacity duration-300 group-hover:opacity-[0.12]`}
          aria-hidden
        />
        <div
          className={`pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-gradient-to-br ${gradients[gradient]} opacity-25 blur-2xl`}
          aria-hidden
        />
        <div className="relative flex flex-1 flex-col justify-between gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="card-title text-[var(--color-text-muted)]">{label}</p>
              <p className="stat-value mt-2 tabular-nums text-[var(--color-text-primary)]">
                {value}
              </p>
              {hint ? <p className="mt-1 text-xs font-medium text-[var(--color-text-secondary)]">{hint}</p> : null}
            </div>
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--color-accent-hover)] to-[var(--color-accent-deep)] text-white shadow-lg shadow-[rgba(232,101,10,0.4)]">
              <Icon className="h-5 w-5" aria-hidden strokeWidth={2} />
            </span>
          </div>
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-accent-soft)] border border-[var(--color-accent-tint)] px-2 py-0.5 text-[var(--color-accent-light)] transition-colors">
              {hasTrend ? (
                <TrendingUp className="h-3 w-3 text-emerald-400" aria-hidden />
              ) : (
                <Minus className="h-3 w-3 text-[var(--color-text-muted)]" aria-hidden />
              )}
              {hasTrend ? <span>{trend}</span> : <span>Overview</span>}
            </span>
            <span className="translate-x-0 text-[var(--color-accent-light)] opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100 lg:opacity-100">
              Open →
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
