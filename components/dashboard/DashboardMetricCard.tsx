"use client";

import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { staggerItem } from "@/lib/motion";

type IconVariant = "primary" | "success" | "warning" | "info";

type Props = {
  label: string;
  value: string | number;
  href?: string;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  iconVariant?: IconVariant;
};

export function DashboardMetricCard({
  label,
  value,
  href,
  icon: Icon,
  trend,
  trendUp = true,
  iconVariant = "primary",
}: Props) {
  const reduceMotion = useReducedMotion();

  const body = (
    <div className="dash-stat-body dash-stat-body--modern">
      <span className={`dash-stat-icon dash-stat-icon--${iconVariant}`} aria-hidden>
        <Icon className="h-5 w-5" strokeWidth={2} />
      </span>
      <div className="dash-stat-meta min-w-0 flex-1">
        <span className="dash-stat-label">{label}</span>
        <span className="dash-stat-value tabular-nums">{value}</span>
        {trend ? (
          <span className={`dash-stat-trend dash-stat-trend--inline ${trendUp ? "positive" : "negative"}`}>
            {trend}
          </span>
        ) : null}
      </div>
    </div>
  );

  const inner = href ? (
    <Link href={href} className="dash-stat-card dash-stat-card--modern group">
      {body}
    </Link>
  ) : (
    <div className="dash-stat-card dash-stat-card--modern">{body}</div>
  );

  if (reduceMotion) {
    return <div className="h-full">{inner}</div>;
  }

  return (
    <motion.div className="h-full" variants={staggerItem} whileHover={{ y: -1 }}>
      {inner}
    </motion.div>
  );
}
