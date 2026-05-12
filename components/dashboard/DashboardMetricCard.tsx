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
  violet: "from-violet-600 via-violet-500 to-purple-500",
  indigo: "from-indigo-500 via-violet-600 to-purple-600",
  fuchsia: "from-purple-600 via-fuchsia-500 to-violet-500",
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
        className="group relative flex h-full min-h-[128px] flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-[0_4px_20px_rgba(15,23,42,0.06)] transition-[box-shadow,border-color] duration-300 hover:border-violet-200/80 hover:shadow-[0_12px_40px_rgba(124,58,237,0.12)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
      >
        <div
          className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${gradients[gradient]} opacity-[0.07] transition-opacity duration-300 group-hover:opacity-[0.12]`}
          aria-hidden
        />
        <div
          className={`pointer-events-none absolute -right-6 -top-10 h-24 w-24 rounded-full bg-gradient-to-br ${gradients[gradient]} opacity-20 blur-2xl`}
          aria-hidden
        />
        <div className="relative flex flex-1 flex-col justify-between gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">{label}</p>
              <p className="mt-2 text-3xl font-extrabold tracking-tight text-[#0f172a] tabular-nums">{value}</p>
              {hint ? <p className="mt-1 text-xs font-medium text-[var(--color-text-secondary)]">{hint}</p> : null}
            </div>
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-lg shadow-violet-500/30">
              <Icon className="h-5 w-5" aria-hidden strokeWidth={2} />
            </span>
          </div>
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[var(--color-text-secondary)] transition-colors group-hover:bg-violet-50 group-hover:text-violet-700">
              {hasTrend ? <TrendingUp className="h-3 w-3 text-emerald-500" aria-hidden /> : <Minus className="h-3 w-3 text-slate-400" aria-hidden />}
              {hasTrend ? <span>{trend}</span> : <span>Overview</span>}
            </span>
            <span className="translate-x-0 text-violet-600 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100 lg:opacity-100">
              Open →
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
