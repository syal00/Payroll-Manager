"use client";

import { useCallback, useEffect, useState } from "react";
import { Copy, Pencil, Trash2, UserPlus } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

function splitDisplayName(name: string): { firstName: string; lastName: string } {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "user", lastName: "account" };
  if (parts.length === 1) return { firstName: parts[0]!, lastName: "user" };
  return { firstName: parts[0]!, lastName: parts.slice(1).join(" ") };
}

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
      {copied ? "Copied" : "Copy email"}
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
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [formErr, setFormErr] = useState<string | null>(null);
  const [createdUsername, setCreatedUsername] = useState<string | null>(null);
  const [editManager, setEditManager] = useState<ManagerRow | null>(null);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editContactEmail, setEditContactEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editErr, setEditErr] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ManagerRow | null>(null);
  const [deleteErr, setDeleteErr] = useState<string | null>(null);

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

  function openEdit(m: ManagerRow) {
    const { firstName: fn, lastName: ln } = splitDisplayName(m.name);
    setEditManager(m);
    setEditFirstName(fn);
    setEditLastName(ln);
    setEditContactEmail(m.contactEmail);
    setEditPassword("");
    setEditErr(null);
  }

  function closeEdit() {
    setEditManager(null);
    setEditErr(null);
    setEditPassword("");
  }

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

  async function onUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editManager) return;
    setEditErr(null);
    setPendingId(editManager.id);
    try {
      const payload: Record<string, string> = {
        firstName: editFirstName.trim(),
        lastName: editLastName.trim(),
        contactEmail: editContactEmail.trim(),
      };
      if (editPassword.trim()) payload.password = editPassword;

      const res = await fetch(`/api/admin/managers/${editManager.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await res.json();
      if (!res.ok) {
        setEditErr(j.error ?? "Update failed");
        return;
      }
      closeEdit();
      void load();
    } catch {
      setEditErr("Network error");
    } finally {
      setPendingId(null);
    }
  }

  async function confirmDeleteManager() {
    if (!confirmDelete) return;
    setDeleteErr(null);
    setPendingId(confirmDelete.id);
    try {
      const res = await fetch(`/api/admin/managers/${confirmDelete.id}`, { method: "DELETE" });
      const j = await res.json();
      if (!res.ok) {
        setDeleteErr(j.error ?? "Delete failed");
        return;
      }
      setConfirmDelete(null);
      void load();
    } catch {
      setDeleteErr("Network error");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="page-container max-w-3xl space-y-8">
      <PageHeader
        eyebrow="Access"
        title="Management accounts"
        description="Create, update, or remove manager logins. Staff sign in with their contact email."
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
              Sign-in email: <code className="font-mono">{createdUsername}</code>
            </p>
            <div className="mt-2">
              <CopyUsernameButton value={createdUsername} />
            </div>
            <p className="mt-2 text-xs text-[var(--color-text-muted)]">
              Share the sign-in email and temporary password securely.
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
              <li
                key={m.id}
                className="flex flex-col gap-3 py-4 first:pt-0 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-[var(--color-text-primary)]">{m.name}</p>
                  <p className="font-mono text-sm text-[var(--color-accent-light)]">{m.username}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">{m.contactEmail}</p>
                  <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                    Added {new Date(m.createdAt).toLocaleString()}
                    {m.createdByUsername ? ` · by ${m.createdByUsername}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <CopyUsernameButton value={m.username} />
                  <Button
                    type="button"
                    variant="secondary"
                    className="h-9 px-3 text-xs"
                    disabled={pendingId === m.id}
                    onClick={() => openEdit(m)}
                  >
                    <Pencil className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    className="h-9 px-3 text-xs"
                    disabled={pendingId === m.id}
                    onClick={() => {
                      setDeleteErr(null);
                      setConfirmDelete(m);
                    }}
                  >
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                    Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </Card>

      {editManager && (
        <div className="modal-overlay z-[1100]" role="dialog" aria-modal="true" aria-labelledby="edit-manager-title">
          <Card className="modal w-full max-w-md border-[var(--color-border)] !shadow-[var(--shadow-modal)]">
            <h2 id="edit-manager-title" className="modal-title text-lg">
              Edit manager
            </h2>
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">
              Login email <code className="font-mono text-xs">{editManager.username}</code> cannot be changed.
            </p>
            {editErr && <div className="alert-error mt-4 text-sm">{editErr}</div>}
            <form onSubmit={onUpdate} className="mt-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label-field" htmlFor="edit-mgr-first">
                    First name
                  </label>
                  <input
                    id="edit-mgr-first"
                    className="input-field mt-1.5 w-full"
                    value={editFirstName}
                    onChange={(e) => setEditFirstName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="label-field" htmlFor="edit-mgr-last">
                    Last name
                  </label>
                  <input
                    id="edit-mgr-last"
                    className="input-field mt-1.5 w-full"
                    value={editLastName}
                    onChange={(e) => setEditLastName(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="label-field" htmlFor="edit-mgr-email">
                  Contact email
                </label>
                <input
                  id="edit-mgr-email"
                  type="email"
                  className="input-field mt-1.5 w-full"
                  value={editContactEmail}
                  onChange={(e) => setEditContactEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="label-field" htmlFor="edit-mgr-password">
                  New temporary password (optional)
                </label>
                <input
                  id="edit-mgr-password"
                  type="password"
                  className="input-field mt-1.5 w-full"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  autoComplete="new-password"
                  minLength={8}
                  placeholder="Leave blank to keep current password"
                />
              </div>
              <div className="flex flex-wrap justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" disabled={pendingId === editManager.id} onClick={closeEdit}>
                  Cancel
                </Button>
                <Button type="submit" disabled={pendingId === editManager.id}>
                  {pendingId === editManager.id ? "Saving…" : "Save changes"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {confirmDelete && (
        <div className="modal-overlay z-[1100]" role="dialog" aria-modal="true" aria-labelledby="delete-manager-title">
          <Card className="modal w-full max-w-md border-[var(--color-border)] !shadow-[var(--shadow-modal)]">
            <h2 id="delete-manager-title" className="modal-title text-lg">
              Delete manager?
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-secondary)]">
              This permanently removes {confirmDelete.name}&apos;s login. Employees assigned to this manager will become
              unassigned. Approval history will be kept under your account.
            </p>
            <p className="mt-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-page-bg)] px-3 py-2 text-sm text-[var(--color-text-secondary)]">
              <span className="font-semibold">{confirmDelete.name}</span>
              <span className="text-[var(--color-text-muted)]"> · </span>
              <span className="font-mono text-xs">{confirmDelete.username}</span>
            </p>
            {deleteErr && <div className="alert-error mt-4 text-sm">{deleteErr}</div>}
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                disabled={pendingId === confirmDelete.id}
                onClick={() => {
                  setConfirmDelete(null);
                  setDeleteErr(null);
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                disabled={pendingId === confirmDelete.id}
                onClick={() => void confirmDeleteManager()}
              >
                {pendingId === confirmDelete.id ? "Deleting…" : "Delete manager"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
