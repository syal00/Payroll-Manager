"use client";

import { motion } from "framer-motion";
import {
  CalendarRange,
  ClipboardList,
  FileCheck,
  FileText,
  History,
  Lock,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { landingReveal, landingViewport } from "@/lib/landing-motion";

const FEATURES: {
  num: string;
  icon: LucideIcon;
  title: string;
  desc: string;
  span: string;
}[] = [
  {
    num: "01",
    icon: Lock,
    title: "Role-based access",
    desc: "Separate portals for admins, managers, supervisors, and employees — each person sees only what they need.",
    span: "md:col-span-7",
  },
  {
    num: "02",
    icon: ClipboardList,
    title: "Timesheet tracking",
    desc: "Employees submit regular, overtime, and leave hours per pay period. Managers review submissions in one queue.",
    span: "md:col-span-5",
  },
  {
    num: "03",
    icon: FileText,
    title: "Payslips & PDFs",
    desc: "Generate payslips from approved timesheets with earnings and deductions, then download or share as PDF.",
    span: "md:col-span-5",
  },
  {
    num: "04",
    icon: CalendarRange,
    title: "Pay periods",
    desc: "Open and close bi-weekly or custom pay cycles. Track which timesheets and payslips belong to each period.",
    span: "md:col-span-7",
  },
  {
    num: "05",
    icon: Users,
    title: "Employee roster",
    desc: "Register employees, assign managers, set hourly rates, and approve new hires before they can submit hours.",
    span: "md:col-span-4",
  },
  {
    num: "06",
    icon: FileCheck,
    title: "Approval workflow",
    desc: "Route timesheets from pending to under review to approved, with comments and a record of who signed off.",
    span: "md:col-span-4",
  },
  {
    num: "07",
    icon: History,
    title: "Audit log",
    desc: "Every approval, payslip generation, and admin action is logged so you can trace changes when questions come up.",
    span: "md:col-span-4",
  },
];

const reveal = landingReveal;

export function FeaturesBento() {
  return (
    <section className="lp-section" id="features" data-testid="features-section">
      <div className="lp-container">
        <motion.div
          className="mb-16 max-w-2xl"
          initial="hidden"
          whileInView="visible"
          viewport={landingViewport}
          custom={0}
          variants={reveal}
        >
          <p className="lp-overline">What WorkLedger does</p>
          <h2 className="lp-display mt-6 text-[clamp(2rem,5vw,3rem)]">
            Built for hours, approvals, and <em className="lp-copper-italic">payslips</em>
          </h2>
        </motion.div>

        <div className="lp-bento">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.article
                key={f.num}
                className={`lp-bento-card ${f.span}`}
                initial="hidden"
                whileInView="visible"
                viewport={landingViewport}
                custom={i}
                variants={reveal}
                data-testid={`feature-card-${f.num}`}
              >
                <p className="lp-bento-num">— {f.num}</p>
                <div className="lp-bento-icon">
                  <Icon className="h-5 w-5" strokeWidth={1.5} />
                </div>
                <h3 className="lp-bento-title">{f.title}</h3>
                <p className="lp-bento-desc">{f.desc}</p>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
