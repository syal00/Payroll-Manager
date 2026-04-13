import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { UserPlus, LogIn, Sparkles } from "lucide-react";

export default function EmployeeAccessHubPage() {
  const brand = process.env.NEXT_PUBLIC_COMPANY_NAME ?? "Payroll Manager";

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <div className="pointer-events-none absolute inset-0 bg-app-pattern" aria-hidden />
      <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-12">
        <div className="mb-10 max-w-lg text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-lg shadow-violet-600/25">
            <Sparkles className="h-6 w-6" aria-hidden />
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-violet-400">{brand}</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Employee portal</h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-400">
            Create your profile once, then return anytime with your work email—no password to remember.
          </p>
        </div>

        <div className="grid w-full max-w-lg gap-4 md:max-w-3xl md:grid-cols-2">
          <Link href="/employee-access/register" className="group block outline-none">
            <Card className="h-full transition duration-200 hover:-translate-y-0.5 hover:border-violet-500/30 hover:shadow-[0_0_40px_-12px_rgba(139,92,246,0.35)]">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/30 to-indigo-600/20 text-violet-200 shadow-[0_0_32px_-8px_rgba(139,92,246,0.55)] ring-1 ring-violet-400/25">
                <UserPlus className="h-6 w-6" aria-hidden />
              </div>
              <h2 className="mt-5 text-lg font-semibold text-white">Create Employee ID</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                New here? Add your name and work email. We assign an ID (e.g. EMP001) and open your
                dashboard.
              </p>
              <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-violet-300 group-hover:gap-2">
                Get started <span aria-hidden>→</span>
              </span>
            </Card>
          </Link>

          <Link href="/employee-access/existing" className="group block outline-none">
            <Card className="h-full transition duration-200 hover:-translate-y-0.5 hover:border-indigo-500/30 hover:shadow-[0_0_40px_-12px_rgba(99,102,241,0.35)]">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-200 ring-1 ring-indigo-400/25 shadow-[0_0_28px_-8px_rgba(99,102,241,0.45)]">
                <LogIn className="h-6 w-6" aria-hidden />
              </div>
              <h2 className="mt-5 text-lg font-semibold text-white">I already have a profile</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                Enter the email you used before. We&apos;ll send you straight to your hours and payslips.
              </p>
              <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-indigo-700 group-hover:gap-2">
                Continue <span aria-hidden>→</span>
              </span>
            </Card>
          </Link>
        </div>

        <p className="mt-12 text-center text-sm text-slate-500">
          <Link href="/login" className="link-accent">
            Administrator sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
