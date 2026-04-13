import type { ButtonHTMLAttributes, ReactNode } from "react";

const base =
  "inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition-[background-color,border-color,color,box-shadow,transform] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0618] disabled:pointer-events-none disabled:opacity-45 active:scale-[0.98]";

const styles = {
  primary:
    "bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 text-white shadow-lg shadow-violet-600/25 hover:shadow-xl hover:shadow-violet-500/35 hover:brightness-105",
  secondary:
    "border border-white/12 bg-white/[0.06] text-slate-200 shadow-inner shadow-black/30 hover:border-violet-400/35 hover:bg-white/[0.1] hover:shadow-[0_0_20px_-8px_rgba(139,92,246,0.35)]",
  outline:
    "border border-violet-400/30 bg-transparent text-violet-200 hover:border-violet-400/50 hover:bg-violet-500/10 hover:shadow-[0_0_24px_-10px_rgba(139,92,246,0.45)]",
  danger:
    "border border-rose-500/35 bg-rose-600/90 text-white shadow-lg shadow-rose-600/20 hover:bg-rose-600 hover:shadow-rose-500/30",
  ghost:
    "text-slate-400 hover:bg-white/[0.06] hover:text-white",
};

export function Button({
  children,
  variant = "primary",
  className = "",
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: keyof typeof styles;
}) {
  return (
    <button type={type} className={`${base} ${styles[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}
