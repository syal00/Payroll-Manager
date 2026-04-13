const variants: Record<string, string> = {
  default: "bg-white/10 text-slate-200 ring-white/15",
  success: "bg-emerald-500/15 text-emerald-200 ring-emerald-400/25 shadow-[0_0_12px_-4px_rgba(52,211,153,0.35)]",
  warning: "bg-amber-500/15 text-amber-100 ring-amber-400/30 shadow-[0_0_12px_-4px_rgba(251,191,36,0.25)]",
  danger: "bg-rose-500/15 text-rose-200 ring-rose-400/25 shadow-[0_0_12px_-4px_rgba(251,113,133,0.3)]",
  info: "bg-indigo-500/15 text-indigo-200 ring-indigo-400/25",
  navy: "bg-violet-500/15 text-violet-200 ring-violet-400/25 shadow-[0_0_12px_-4px_rgba(139,92,246,0.3)]",
};

export function Badge({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
  variant?: keyof typeof variants;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${variants[variant] ?? variants.default}`}
    >
      {children}
    </span>
  );
}
