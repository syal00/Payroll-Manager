"use client";

import { useEffect, useState } from "react";
import { DemoRequestModal } from "@/components/marketing/DemoRequestModal";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { Hero } from "@/components/landing/Hero";
import { MarqueeStrip } from "@/components/landing/MarqueeStrip";
import { FeaturesBento } from "@/components/landing/FeaturesBento";
import { ProtocolSection } from "@/components/landing/ProtocolSection";
import { StatsSection } from "@/components/landing/StatsSection";
import { FaqSection } from "@/components/landing/FaqSection";
import { CtaBanner } from "@/components/landing/CtaBanner";
import { LandingFooter } from "@/components/landing/LandingFooter";
import "./landing.css";

export default function LandingPage() {
  const [demoOpen, setDemoOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const openDemo = () => setDemoOpen(true);

  return (
    <div className="lp-root lp-grain lp-bg-radial" data-testid="landing-page">
      <LandingHeader
        scrolled={scrolled}
        mobileOpen={mobileOpen}
        onToggleMobile={() => setMobileOpen((v) => !v)}
        onCloseMobile={() => setMobileOpen(false)}
        onBookDemo={openDemo}
      />
      <main>
        <Hero onBookDemo={openDemo} />
        <MarqueeStrip />
        <FeaturesBento />
        <ProtocolSection />
        <StatsSection />
        <FaqSection />
        <CtaBanner onBookDemo={openDemo} />
      </main>
      <LandingFooter />
      <DemoRequestModal open={demoOpen} onClose={() => setDemoOpen(false)} />
    </div>
  );
}
