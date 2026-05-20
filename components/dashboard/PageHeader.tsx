"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { fadeUp } from "@/lib/motion";

export function PageHeader({
  eyebrow,
  title,
  description,
  children,
  subtitleOnly = false,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: ReactNode;
  /** When true, only renders description + actions (title lives in shell topbar). */
  subtitleOnly?: boolean;
}) {
  const reduceMotion = useReducedMotion();

  if (subtitleOnly && !description && !children) {
    return null;
  }

  const content = (
    <header
      className={`flex flex-col gap-5 ${subtitleOnly ? "mb-6" : "mb-8"} sm:flex-row sm:items-end sm:justify-between`}
    >
      <div className="min-w-0">
        {!subtitleOnly && eyebrow ? <p className="page-eyebrow">{eyebrow}</p> : null}
        {!subtitleOnly ? <h1 className="page-title mt-1">{title}</h1> : null}
        {description ? (
          <p className={`page-description max-w-2xl ${subtitleOnly ? "mt-0" : "mt-2"}`}>{description}</p>
        ) : null}
      </div>
      {children ? <div className="page-header-actions flex flex-shrink-0 flex-wrap items-center gap-2">{children}</div> : null}
    </header>
  );

  if (reduceMotion) {
    return content;
  }

  return (
    <motion.div initial="hidden" animate="visible" variants={fadeUp}>
      {content}
    </motion.div>
  );
}
