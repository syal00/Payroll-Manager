"use client";

import Link from "next/link";
import { Bell, Palette, Shield, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card } from "@/components/ui/Card";

export default function AdminSettingsPage() {
  return (
    <div className="page-container max-w-3xl space-y-8">
      <PageHeader
        eyebrow="Configuration"
        title="Workspace preferences"
        description="Organizational controls and personalization. Sensitive account edits stay routed through secure profile tooling."
      />

      <div className="space-y-5">
        <Card className="border-[var(--color-border)] !bg-white/80 backdrop-blur-md">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
              <Bell className="h-5 w-5" strokeWidth={2} aria-hidden />
            </div>
            <div className="min-w-0 flex-1 space-y-3">
              <div>
                <h2 className="text-base font-bold text-[#0f172a]">Notifications</h2>
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                  Control digest frequency for approvals, anomalies, and delivery receipts.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 opacity-70">
                <button type="button" disabled className="rounded-xl border border-[var(--color-border)] bg-slate-50 px-4 py-2 text-xs font-semibold text-[var(--color-text-muted)]">
                  Immediate alerts (soon)
                </button>
                <button type="button" disabled className="rounded-xl border border-[var(--color-border)] bg-slate-50 px-4 py-2 text-xs font-semibold text-[var(--color-text-muted)]">
                  Daily digest (soon)
                </button>
              </div>
            </div>
          </div>
        </Card>

        <Card className="border-[var(--color-border)] !bg-white/80 backdrop-blur-md">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
              <Palette className="h-5 w-5" strokeWidth={2} aria-hidden />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#0f172a]">Appearance</h2>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                Density and contrast presets follow system defaults automatically in this rollout.
              </p>
              <span className="mt-4 inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-[var(--color-text-muted)]">
                Premium light theme enforced
              </span>
            </div>
          </div>
        </Card>

        <Card className="border-[var(--color-border)] !border-violet-200/80 !bg-gradient-to-br from-violet-500/12 via-white to-transparent backdrop-blur-md">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/80 text-violet-700 shadow-sm shadow-violet-200/70">
              <Shield className="h-5 w-5" strokeWidth={2} aria-hidden />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-[#0f172a]">Identity & profile</h2>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                Update your display identity, verification phone, and how you surface in approvals.
              </p>
              <Link
                href="/admin/profile"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/30 transition hover:scale-[1.02]"
              >
                <Sparkles className="h-4 w-4" aria-hidden />
                Open secure profile editor
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
