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
    title: "Bring your week in.",
    desc: "Employees submit timesheets. Managers see entries in real time — no chasing, no gaps.",
    icon: ClipboardList,
  },
  {
    num: "II",
    meta: "Step two",
    title: "Reconcile, with eyes open.",
    desc: "Route submissions through review with role-based sign-offs and a full audit trail.",
    icon: Eye,
  },
  {
    num: "III",
    meta: "Step three",
    title: "Run, sign, send.",
    desc: "Generate payslips from approved hours, dual-authorize the run, and distribute with confidence.",
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
            <p className="lp-overline">The Syal Protocol</p>
            <h2 className="lp-display mt-6 text-[clamp(2rem,5vw,3.25rem)]">
              How it <em className="lp-copper-italic">works</em>
            </h2>
            <p className="lp-protocol-time">~37 min average run time</p>
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
