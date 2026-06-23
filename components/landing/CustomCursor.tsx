"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

const LERP = 0.18;
const INTERACTIVE = "a, button, input, textarea, select, [role='button'], .lp-copper-btn, .lp-outline-btn";

export function CustomCursor() {
  const reduceMotion = useReducedMotion();
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const mouse = useRef({ x: 0, y: 0 });
  const ring = useRef({ x: 0, y: 0 });
  const raf = useRef<number>(0);
  const hovering = useRef(false);

  useEffect(() => {
    if (reduceMotion || typeof window === "undefined") return;
    if (window.matchMedia("(max-width: 900px)").matches) return;

    const onMove = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY };
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
      }
      const target = e.target as HTMLElement | null;
      const isInteractive = !!target?.closest(INTERACTIVE);
      if (isInteractive !== hovering.current) {
        hovering.current = isInteractive;
        ringRef.current?.classList.toggle("is-hover", isInteractive);
      }
    };

    const tick = () => {
      ring.current.x += (mouse.current.x - ring.current.x) * LERP;
      ring.current.y += (mouse.current.y - ring.current.y) * LERP;
      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${ring.current.x}px, ${ring.current.y}px)`;
      }
      raf.current = requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    raf.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf.current);
    };
  }, [reduceMotion]);

  if (reduceMotion) return null;

  return (
    <>
      <div ref={dotRef} className="lp-cursor-dot" data-testid="custom-cursor-dot" aria-hidden />
      <div ref={ringRef} className="lp-cursor-ring" data-testid="custom-cursor-ring" aria-hidden />
    </>
  );
}
