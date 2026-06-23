"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { MagneticButton } from "@/components/landing/MagneticButton";

import { landingReveal, landingViewport } from "@/lib/landing-motion";

type CtaBannerProps = {
  onBookDemo: () => void;
};

export function CtaBanner({ onBookDemo }: CtaBannerProps) {
  return (
    <section className="lp-section lp-section--navy" id="cta" data-testid="cta-section">
      <div className="lp-container">
        <motion.div
          className="lp-cta-panel"
          initial="hidden"
          whileInView="visible"
          viewport={landingViewport}
          custom={0}
          variants={landingReveal}
        >
          <div className="lp-cta-rings" aria-hidden>
            <div className="lp-cta-ring lp-cta-ring--1" />
            <div className="lp-cta-ring lp-cta-ring--2" />
          </div>

          <p className="lp-overline">Get started</p>
          <h2 className="lp-display mt-6 max-w-2xl text-[clamp(2rem,5vw,3rem)]">
            Ready to simplify your <em className="lp-copper-italic">payroll</em>?
          </h2>
          <p className="lp-cta-lead mt-4 max-w-lg">
            Book a demo with our team and see how Syal Operations Group keeps payroll
            accurate, compliant, and calm.
          </p>

          <div className="lp-cta-actions">
            <MagneticButton onClick={onBookDemo} data-testid="cta-book-demo-btn">
              Book a Demo
              <ArrowRight className="h-4 w-4" strokeWidth={2} />
            </MagneticButton>
            <Link href="/login" className="lp-outline-btn" data-testid="cta-portal-link">
              Sign In
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
