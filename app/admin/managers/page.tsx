"use client";

import { useCallback, useEffect, useState } from "react";
import { UserPlus } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

type ManagerRow = {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  createdByEmail: string | null;
};

export default function AdminManagersPage() {
  const [managers, setManagers] = useState<ManagerRow[]>([]);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [formErr, setFormErr] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoadErr(null);
    fetch("/api/admin/managers")
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) {
          setLoadErr(j.error ?? "Could not load managers");
          setManagers([]);
          return;
        }
        setManagers(j.managers ?? []);
      })
      .catch(() => {
        setLoadErr("Network error");
        setManagers([]);
      });
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormErr(null);
    setSuccess(null);
    setBusy(true);
    try {
      const res = await fetch("/api/admin/managers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
        }),
      });
      const j = await res.json();
      if (!res.ok) {
        setFormErr(j.error ?? "Create failed");
        return;
      }
      setSuccess(
        `Manager account created for ${j.manager.email}. Send them this email and temporary password so they can sign in at /login → Sign in as admin.`,
      );
      setName("");
      setEmail("");
      setPassword("");
      void load();
    } catch {
      setFormErr("Network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page-container max-w-3xl space-y-8">
      <PageHeader
        eyebrow="Access"
        title="Management accounts"
        description="Create manager logins (email + temporary password). Managers sign in at the same admin login page, then only see employees assigned to them and review workflows."
      />

      <Card className="border-[var(--color-border)] !bg-[var(--color-bg-card)]/80 p-6 backdrop-blur-md">
        <div className="flex items-center gap-2 text-[var(--color-text-primary)]">
          <UserPlus className="h-5 w-5 text-[var(--color-accent)]" aria-hidden />
          <h2 className="text-base font-bold">Add a manager</h2>
        </div>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">
          Email must be unique. Password is stored hashed; share it with the manager securely (email, chat, or in person). They should change it after first login when you add that flow.
        </p>
        {formErr && <div className="alert-error mt-4 text-sm">{formErr}</div>}
        {success && (
          <div className="mt-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-[var(--color-text-primary)]">
            {success}
          </div>
        )}
        <form onSubmit={onCreate} className="mt-6 space-y-4">
          <div>
            <label className="label-field" htmlFor="mgr-name">
              Full name
            </label>
            <input
              id="mgr-name"
              className="input-field mt-1.5 w-full"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              required
            />
          </div>
          <div>
            <label className="label-field" htmlFor="mgr-email">
              Work email
            </label>
            <input
              id="mgr-email"
              type="email"
              className="input-field mt-1.5 w-full"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>
          <div>
            <label className="label-field" htmlFor="mgr-password">
              Temporary password
            </label>
            <input
              id="mgr-password"
              type="password"
              className="input-field mt-1.5 w-full"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
            />
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">At least 8 characters.</p>
          </div>
          <Button type="submit" className="mt-2" disabled={busy}>
            {busy ? "Creating…" : "Create manager account"}
          </Button>
        </form>
      </Card>

      <Card className="border-[var(--color-border)] !bg-[var(--color-bg-card)]/80 p-6 backdrop-blur-md">
        <h2 className="text-base font-bold text-[var(--color-text-primary)]">Existing managers</h2>
        {loadErr && <p className="mt-3 text-sm text-rose-400">{loadErr}</p>}
        {!loadErr && managers.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--color-text-muted)]">No manager accounts yet.</p>
        ) : null}
        {!loadErr && managers.length > 0 ? (
          <ul className="mt-4 divide-y divide-[var(--color-border)]">
            {managers.map((m) => (
              <li key={m.id} className="flex flex-col gap-1 py-3 first:pt-0 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-[var(--color-text-primary)]">{m.name}</p>
                  <p className="text-sm text-[var(--color-accent-light)]">{m.email}</p>
                </div>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Added {new Date(m.createdAt).toLocaleString()}
                  {m.createdByEmail ? ` · by ${m.createdByEmail}` : ""}
                </p>
              </li>
            ))}
          </ul>
        ) : null}
      </Card>
    </div>
  );
}
