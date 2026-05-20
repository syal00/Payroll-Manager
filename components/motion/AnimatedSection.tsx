"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { fadeUp, staggerContainer, staggerItem } from "@/lib/motion";

type AnimatedSectionProps = {
  children: ReactNode;
  className?: string;
  stagger?: boolean;
  delay?: number;
  as?: "section" | "div";
};

export function AnimatedSection({
  children,
  className = "",
  stagger = false,
  delay = 0,
  as = "section",
}: AnimatedSectionProps) {
  const reduceMotion = useReducedMotion();
  const Component = motion[as];

  if (reduceMotion) {
    const Tag = as;
    return <Tag className={className}>{children}</Tag>;
  }

  return (
    <Component
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      variants={stagger ? staggerContainer : fadeUp}
      transition={{ delay }}
    >
      {children}
    </Component>
  );
}
