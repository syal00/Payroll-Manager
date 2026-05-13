"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, Palette, Shield, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function AdminSettingsPage() {
  const [taxRate, setTaxRate] = useState("20");
  const [taxMsg, setTaxMsg] = useState<string | null>(null);
  const [taxErr, setTaxErr] = useState<string | null>(null);
  const [taxBusy, setTaxBusy] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((j) => {
        if (typeof j.taxRate === "number") setTaxRate(String(j.taxRate));
      })
      .catch(() => {});
  }, []);

  async function saveTax() {
    setTaxBusy(true);
    setTaxErr(null);
    setTaxMsg(null);
    const n = parseFloat(taxRate);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taxRate: n }),
      });
      const j = await res.json();
      if (!res.ok) {
        setTaxErr(j.error ?? "Save failed");
        return;
      }
      setTaxMsg("Tax rate saved. Future payslips will use this rate for estimated deductions.");
    } catch {
      setTaxErr("Network error");
    } finally {
      setTaxBusy(false);
    }
  }

  return (
    <div className="page-container max-w-3xl space-y-8">
      <PageHeader
        eyebrow="Configuration"
        title="Workspace preferences"
        description="Organizational controls and personalization. Sensitive account edits stay routed through secure profile tooling."
      />

      <div className="space-y-5">
        <Card className="border-[var(--color-border)] !bg-[var(--color-bg-card)]/80 backdrop-blur-md">
          <h2 className="text-base font-bold text-[var(--color-text-primary)]">Tax rate (%)</h2>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Used for estimated deductions on new payslips when no custom deduction total is entered. Default 20%.
          </p>
          {taxErr && <div className="alert-error mt-3 text-sm">{taxErr}</div>}
          {taxMsg && <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-950">{taxMsg}</div>}
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
            <div>
              <label className="label-field" htmlFor="tax-rate">
                Tax Rate (%)
              </label>
              <input
                id="tax-rate"
                type="number"
                min={0}
                max={100}
                step={0.5}
                className="input-field mt-1.5 sm:w-40"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
              />
            </div>
            <Button type="button" className="h-11" disabled={taxBusy} onClick={() => void saveTax()}>
              {taxBusy ? "Saving…" : "Save"}
            </Button>
          </div>
        </Card>

        <Card className="border-[var(--color-border)] !bg-[var(--color-bg-card)]/80 backdrop-blur-md">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--color-accent-tint)] text-[var(--color-accent-light)]">
              <Bell className="h-5 w-5" strokeWidth={2} aria-hidden />
            </div>
            <div className="min-w-0 flex-1 space-y-3">
              <div>
                <h2 className="text-base font-bold text-[var(--color-text-primary)]">Notifications</h2>
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                  Control digest frequency for approvals, anomalies, and delivery receipts.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 opacity-70">
                <button
                  type="button"
                  disabled
                  className="rounded-xl border border-[var(--color-border)] bg-[var(--color-accent-soft)] px-4 py-2 text-xs font-semibold text-[var(--color-text-muted)]"
                >
                  Immediate alerts (soon)
                </button>
                <button
                  type="button"
                  disabled
                  className="rounded-xl border border-[var(--color-border)] bg-[var(--color-accent-soft)] px-4 py-2 text-xs font-semibold text-[var(--color-text-muted)]"
                >
                  Daily digest (soon)
                </button>
              </div>
            </div>
          </div>
        </Card>

        <Card className="border-[var(--color-border)] !bg-[var(--color-bg-card)]/80 backdrop-blur-md">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--color-accent-soft)] border border-[var(--color-accent-tint)] text-[var(--color-accent-light)]">
              <Palette className="h-5 w-5" strokeWidth={2} aria-hidden />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--color-text-primary)]">Appearance</h2>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                Density and contrast presets follow system defaults automatically in this rollout.
              </p>
              <span className="mt-4 inline-flex items-center rounded-full bg-[var(--color-bg-elevated)] px-3 py-1 text-xs font-semibold text-[var(--color-text-muted)]">
                Premium light theme enforced
              </span>
            </div>
          </div>
        </Card>

        <Card className="border-[var(--color-border)] !border-[var(--color-accent-tint)]/80 !bg-gradient-to-br from-[var(--color-accent-hover)]/12 via-white to-transparent backdrop-blur-md">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--color-bg-card)]/80 text-[var(--color-accent-light)] shadow-sm shadow-violet-200/70">
              <Shield className="h-5 w-5" strokeWidth={2} aria-hidden />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-[var(--color-text-primary)]">Identity & profile</h2>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                Update your display identity, verification phone, and how you surface in approvals.
              </p>
              <Link
                href="/admin/profile"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[var(--color-accent-hover)] to-[var(--color-accent-deep)] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/30 transition hover:scale-[1.02]"
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
