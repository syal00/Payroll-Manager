import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
  padding = true,
}: {
  children: ReactNode;
  className?: string;
  padding?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border border-white/[0.08] bg-white/[0.04] shadow-[0_0_0_1px_rgba(139,92,246,0.06),0_24px_48px_-24px_rgba(0,0,0,0.6)] ring-1 ring-inset ring-violet-500/[0.04] backdrop-blur-xl ${padding ? "p-6 md:p-7" : ""} ${className}`}
    >
      {children}
    </div>
  );
}
