"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { KeyRound, Shield, UserCircle } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function AdminProfilePage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((j) => {
        if (j.user) {
          setName(j.user.name);
          setPhone(j.user.phone ?? "");
          setEmail(j.user.email);
        }
      });
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone: phone || null }),
    });
    const j = await res.json();
    if (!res.ok) setMsg(j.error ?? "Failed");
    else setMsg("Profile updated.");
  }

  const initialsSource = name.trim() || email.trim() || "?";
  const parts = initialsSource.replace(/[^a-zA-Z\u00C0-\u00FF\s@.]/g, " ").split(/\s+/).filter(Boolean);
  const initials =
    parts.length >= 2
      ? `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase()
      : parts[0]!.slice(0, 2).toUpperCase();

  return (
    <div className="page-container max-w-3xl space-y-8">
      <PageHeader
        eyebrow="Account"
        title="Administrator profile"
        description="Your visible identity when signing timesheets, emitting payslips, and recording compliance events."
      />

      <div className="relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-gradient-to-br from-white via-violet-50/60 to-white p-6 shadow-[0_12px_42px_rgba(15,23,42,0.08)] backdrop-blur-md sm:p-8">
        <div className="absolute -right-24 -top-28 h-52 w-52 rounded-full bg-[var(--color-accent)]/25 blur-3xl" aria-hidden />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--color-accent-hover)] to-[var(--color-accent-deep)] text-lg font-bold text-white shadow-lg shadow-violet-500/35">
            {initialsSource === "?" ? <UserCircle className="h-10 w-10" strokeWidth={1.75} aria-hidden /> : initials}
          </div>
          <div className="min-w-0">
            <p className="text-lg font-extrabold text-[var(--color-text-primary)]">{name || "Administrator"}</p>
            <p className="truncate text-sm font-medium text-[var(--color-text-secondary)]">{email}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="rounded-2xl border-[var(--color-border)] !bg-[var(--color-bg-card)]/95 backdrop-blur-md">
          <div className="mb-4 flex items-center gap-2">
            <Shield className="h-4 w-4 text-[var(--color-accent-light)]" aria-hidden strokeWidth={2} />
            <h2 className="text-sm font-bold uppercase tracking-wide text-[var(--color-text-muted)]">Contact record</h2>
          </div>
          <form onSubmit={save} className="space-y-5">
            <div>
              <label className="label-field" htmlFor="prof-email">
                Email
              </label>
              <input id="prof-email" disabled className="input-field mt-1.5 cursor-not-allowed opacity-60" value={email} />
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">Email is anchored to your organization directory.</p>
            </div>
            <div>
              <label className="label-field" htmlFor="prof-name">
                Display name
              </label>
              <input id="prof-name" className="input-field mt-1.5" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <label className="label-field" htmlFor="prof-phone">
                Phone
              </label>
              <input
                id="prof-phone"
                className="input-field mt-1.5"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Optional"
              />
            </div>
            {msg ? (
              <p className={`text-sm font-medium ${msg.includes("Failed") ? "text-rose-700" : "text-emerald-700"}`}>{msg}</p>
            ) : null}
            <Button type="submit" className="h-11 rounded-xl">
              Save changes
            </Button>
          </form>
        </Card>

        <div className="space-y-5">
          <Card className="rounded-2xl border-[var(--color-border)] border-dashed !bg-[var(--color-accent-soft)]/80 backdrop-blur-sm">
            <div className="flex items-start gap-3">
              <KeyRound className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-text-muted)]" aria-hidden strokeWidth={2} />
              <div>
                <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Credential security</h3>
                <p className="mt-1 text-xs leading-relaxed text-[var(--color-text-muted)]">
                  Password rotations are issued by your identity owner. SSO and SCIM controls land in a future enterprise
                  bundle.
                </p>
                <p className="mt-3 text-xs font-semibold text-[var(--color-text-secondary)]">Protected by encrypted session tokens.</p>
              </div>
            </div>
          </Card>

          <Card className="rounded-2xl border-[var(--color-border)] !bg-[var(--color-bg-card)]/95 backdrop-blur-md">
            <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Activity surface</h3>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">See every administrative footstep in the audit trail.</p>
            <Link
              href="/admin/history"
              className="mt-4 inline-flex rounded-xl border border-[var(--color-accent-tint)] bg-[var(--color-accent-soft)] px-4 py-2 text-xs font-semibold text-[var(--color-accent-light)] transition hover:bg-[var(--color-accent-tint)]"
            >
              Jump to history â†’
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
