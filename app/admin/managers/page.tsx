"use client";

import { useCallback, useEffect, useState } from "react";
import { Copy, UserPlus } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

type ManagerRow = {
  id: string;
  username: string;
  contactEmail: string;
  name: string;
  createdAt: string;
  createdByUsername: string | null;
};

function CopyUsernameButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button
      type="button"
      onClick={() => void copy()}
      className="inline-flex items-center gap-1 rounded-md border border-[var(--color-border)] px-2 py-1 text-xs font-semibold text-[var(--color-accent)] hover:bg-[var(--color-accent-tint)]"
    >
      <Copy className="h-3.5 w-3.5" aria-hidden />
      {copied ? "Copied" : "Copy username"}
    </button>
  );
}

export default function AdminManagersPage() {
  const [managers, setManagers] = useState<ManagerRow[]>([]);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [formErr, setFormErr] = useState<string | null>(null);
  const [createdUsername, setCreatedUsername] = useState<string | null>(null);

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
    setCreatedUsername(null);
    setBusy(true);
    try {
      const res = await fetch("/api/admin/managers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          contactEmail: contactEmail.trim(),
          password,
        }),
      });
      const j = await res.json();
      if (!res.ok) {
        setFormErr(j.error ?? "Create failed");
        return;
      }
      setCreatedUsername(j.manager.username);
      setFirstName("");
      setLastName("");
      setContactEmail("");
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
        description="Create manager logins with a contact email (for notifications) and a temporary password. The login username is generated automatically."
      />

      <Card className="border-[var(--color-border)] !bg-[var(--color-bg-card)]/80 p-6 backdrop-blur-md">
        <div className="flex items-center gap-2 text-[var(--color-text-primary)]">
          <UserPlus className="h-5 w-5 text-[var(--color-accent)]" aria-hidden />
          <h2 className="text-base font-bold">Add a manager</h2>
        </div>
        {formErr && <div className="alert-error mt-4 text-sm">{formErr}</div>}
        {createdUsername ? (
          <div className="mt-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-[var(--color-text-primary)]">
            <p className="font-semibold">Manager created</p>
            <p className="mt-1">
              Login username: <code className="font-mono">{createdUsername}</code>
            </p>
            <div className="mt-2">
              <CopyUsernameButton value={createdUsername} />
            </div>
            <p className="mt-2 text-xs text-[var(--color-text-muted)]">
              Share the username and temporary password securely. OTPs and notifications go to the
              contact email — never to the username.
            </p>
          </div>
        ) : null}
        <form onSubmit={onCreate} className="mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label-field" htmlFor="mgr-first">
                First name
              </label>
              <input
                id="mgr-first"
                className="input-field mt-1.5 w-full"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label-field" htmlFor="mgr-last">
                Last name
              </label>
              <input
                id="mgr-last"
                className="input-field mt-1.5 w-full"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
          </div>
          <div>
            <label className="label-field" htmlFor="mgr-contact-email">
              Contact email (for OTP / notifications)
            </label>
            <input
              id="mgr-contact-email"
              type="email"
              className="input-field mt-1.5 w-full"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
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
                  <p className="font-mono text-sm text-[var(--color-accent-light)]">{m.username}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">{m.contactEmail}</p>
                </div>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Added {new Date(m.createdAt).toLocaleString()}
                  {m.createdByUsername ? ` · by ${m.createdByUsername}` : ""}
                </p>
              </li>
            ))}
          </ul>
        ) : null}
      </Card>
    </div>
  );
}
