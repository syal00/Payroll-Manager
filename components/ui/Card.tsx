"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
  padding = true,
  animate = false,
}: {
  children: ReactNode;
  className?: string;
  padding?: boolean;
  /** Subtle entrance animation when true */
  animate?: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const classes = `card ${padding ? "" : "!p-0"} ${className}`.trim();

  if (!animate || reduceMotion) {
    return <div className={classes}>{children}</div>;
  }

  return (
    <motion.div
      className={classes}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
