"use client";

import { motion } from "framer-motion";
import { ClipboardList, Eye, Send } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { landingReveal, landingViewport } from "@/lib/landing-motion";

const STEPS: {
  num: string;
  meta: string;
  title: string;
  desc: string;
  icon: LucideIcon;
}[] = [
  {
    num: "I",
    meta: "Step one",
    title: "Employees submit hours.",
    desc: "Staff log regular, overtime, and leave hours for the current pay period through the employee portal.",
    icon: ClipboardList,
  },
  {
    num: "II",
    meta: "Step two",
    title: "Managers review and approve.",
    desc: "Admins and managers check submissions, move them through review, and approve hours before payroll runs.",
    icon: Eye,
  },
  {
    num: "III",
    meta: "Step three",
    title: "Generate and distribute payslips.",
    desc: "Create payslips from approved timesheets, then employees download PDF copies from their dashboard.",
    icon: Send,
  },
];

export function ProtocolSection() {
  return (
    <section className="lp-section lp-section--navy" id="process" data-testid="process-section">
      <div className="lp-container">
        <div className="lp-protocol-grid">
          <motion.div
            className="lp-protocol-sticky"
            initial="hidden"
            whileInView="visible"
            viewport={landingViewport}
            custom={0}
            variants={landingReveal}
          >
            <p className="lp-overline">How it works</p>
            <h2 className="lp-display mt-6 text-[clamp(2rem,5vw,3.25rem)]">
              From hours to <em className="lp-copper-italic">payslip</em>
            </h2>
            <p className="lp-protocol-time">Three steps, one workspace</p>
          </motion.div>

          <div className="lp-protocol-steps">
            <div className="lp-protocol-timeline">
              {STEPS.map((step, i) => {
                const Icon = step.icon;
                return (
                  <motion.div
                    key={step.num}
                    className="lp-protocol-step"
                    initial="hidden"
                    whileInView="visible"
                    viewport={landingViewport}
                    custom={i + 1}
                    variants={landingReveal}
                    data-testid={`protocol-step-${step.num}`}
                  >
                    <span className="lp-protocol-badge">{step.num}</span>
                    <div className="lp-protocol-card lp-glass">
                      <Icon className="mb-3 h-5 w-5 text-copper" strokeWidth={1.5} />
                      <p className="lp-protocol-meta">{step.meta}</p>
                      <h3 className="lp-bento-title">{step.title}</h3>
                      <p className="lp-bento-desc">{step.desc}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
