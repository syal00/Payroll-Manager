"use client";

import { useRef, type ReactNode, type MouseEvent } from "react";
import { useReducedMotion } from "framer-motion";

type MagneticButtonProps = {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  "data-testid"?: string;
};

export function MagneticButton({
  children,
  className = "lp-copper-btn",
  onClick,
  type = "button",
  "data-testid": testId,
}: MagneticButtonProps) {
  const reduceMotion = useReducedMotion();
  const outerRef = useRef<HTMLButtonElement>(null);
  const innerRef = useRef<HTMLSpanElement>(null);

  function handleMove(e: MouseEvent<HTMLButtonElement>) {
    if (reduceMotion || !outerRef.current || !innerRef.current) return;
    const rect = outerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    outerRef.current.style.transform = `translate3d(${x * 0.1}px, ${y * 0.12}px, 0)`;
    innerRef.current.style.transform = `translate3d(${x * 0.22}px, ${y * 0.28}px, 0)`;
  }

  function handleLeave() {
    if (!outerRef.current || !innerRef.current) return;
    outerRef.current.style.transform = "";
    innerRef.current.style.transform = "";
  }

  return (
    <button
      ref={outerRef}
      type={type}
      className={className}
      onClick={onClick}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      data-testid={testId}
    >
      <span ref={innerRef} className="lp-magnetic-inner">
        {children}
      </span>
    </button>
  );
}
