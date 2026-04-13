export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#05020c] bg-app-pattern text-slate-400">
      <span
        className="h-5 w-5 animate-spin rounded-full border-2 border-violet-500/30 border-t-violet-300"
        aria-hidden
      />
      <p className="text-sm font-medium text-slate-300">Redirecting…</p>
    </div>
  );
}
