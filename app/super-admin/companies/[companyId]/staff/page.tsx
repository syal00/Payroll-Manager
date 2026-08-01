"use client";

import { use, useCallback, useEffect, useState } from "react";
import { Mail, Pencil, RotateCcw, Trash2, UserMinus, UserPlus } from "lucide-react";
import { Role } from "@/lib/enums";
import { STAFF_ROLE_SUGGESTIONS, staffRoleDisplayLabel } from "@/lib/staff-roles";
import { employeeSignInEmail } from "@/lib/display-name";
import { openStaffWelcomeMail } from "@/lib/staff-welcome-mailto";

type StaffRow = {
  id: string;
  username: string;
  contactEmail: string;
  name: string;
  role: string;
  createdAt: string;
  deletedAt: string | null;
  suspended: boolean;
  mustChangePassword: boolean;
  assignedEmployeeCount: number;
  createdByUsername: string | null;
};

type CompanyMailContext = {
  name: string;
  slug: string;
  websiteUrl: string | null;
};

type PendingWelcomeMail = {
  staff: Pick<StaffRow, "contactEmail" | "name" | "role" | "username">;
  temporaryPassword: string;
};

function splitDisplayName(name: string): { firstName: string; lastName: string } {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "user", lastName: "account" };
  if (parts.length === 1) return { firstName: parts[0]!, lastName: "user" };
  return { firstName: parts[0]!, lastName: parts.slice(1).join(" ") };
}

function roleLabel(role: string): string {
  return staffRoleDisplayLabel(role);
}

export default function CompanyStaffPage({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = use(params);
  const apiBase = `/api/super-admin/companies/${companyId}/staff`;

  const [status, setStatus] = useState<"active" | "suspended" | "all">("active");
  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [formErr, setFormErr] = useState<string | null>(null);
  const [formOk, setFormOk] = useState<string | null>(null);
  const [pendingWelcomeMail, setPendingWelcomeMail] = useState<PendingWelcomeMail | null>(null);
  const [companyMail, setCompanyMail] = useState<CompanyMailContext | null>(null);
  const [creating, setCreating] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [password, setPassword] = useState("Security123!");
  const [role, setRole] = useState("Manager");

  const [editRow, setEditRow] = useState<StaffRow | null>(null);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editContactEmail, setEditContactEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editErr, setEditErr] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<StaffRow | null>(null);
  const [deleteErr, setDeleteErr] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setLoadErr(null);
    fetch(`${apiBase}?status=${status}`)
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) {
          setLoadErr(j.error ?? "Could not load staff");
          setStaff([]);
          return;
        }
        setStaff(j.staff ?? []);
      })
      .catch(() => {
        setLoadErr("Failed to load staff");
        setStaff([]);
      })
      .finally(() => setLoading(false));
  }, [apiBase, status]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    fetch(`/api/super-admin/companies/${companyId}`)
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok || !j.company) return;
        setCompanyMail({
          name: j.company.name,
          slug: j.company.slug,
          websiteUrl: j.company.websiteUrl ?? null,
        });
      })
      .catch(() => {});
  }, [companyId]);

  function openWelcomeMail(
    staff: Pick<StaffRow, "contactEmail" | "name" | "role" | "username">,
    temporaryPassword?: string
  ) {
    if (!companyMail) {
      setLoadErr("Company details not loaded yet — refresh the page.");
      return;
    }
    openStaffWelcomeMail({
      to: staff.contactEmail,
      staffDisplayName: staff.name,
      role: staff.role,
      loginEmail: staff.username,
      companyName: companyMail.name,
      companySlug: companyMail.slug,
      companyWebsiteUrl: companyMail.websiteUrl,
      temporaryPassword,
    });
  }

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormErr(null);
    setFormOk(null);
    setPendingWelcomeMail(null);
    setCreating(true);
    try {
      const res = await fetch(apiBase, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          contactEmail: contactEmail.trim(),
          password,
          role,
        }),
      });
      const j = await res.json();
      if (!res.ok) {
        setFormErr(j.error ?? "Create failed");
        if (j.hint === "suspended_staff" || j.hint === "active_staff") {
          setStatus(j.hint === "suspended_staff" ? "suspended" : "active");
        }
        return;
      }
      setFormOk(
        j.reactivated
          ? `${roleLabel(j.staff.role)} restored — sign-in email: ${j.staff.username}. Click Email in Outlook to send the welcome message manually.`
          : `${roleLabel(j.staff.role)} created — sign-in email: ${j.staff.username}. Click Email in Outlook to send the welcome message manually.`
      );
      if (j.temporaryPassword) {
        setPendingWelcomeMail({
          staff: j.staff,
          temporaryPassword: j.temporaryPassword,
        });
      }
      if (j.company) {
        setCompanyMail({
          name: j.company.name,
          slug: j.company.slug,
          websiteUrl: j.company.websiteUrl ?? null,
        });
      }
      setFirstName("");
      setLastName("");
      setContactEmail("");
      setPassword("Security123!");
      setRole("Manager");
      void load();
    } catch {
      setFormErr("Network error");
    } finally {
      setCreating(false);
    }
  }

  function openEdit(row: StaffRow) {
    const { firstName: fn, lastName: ln } = splitDisplayName(row.name);
    setEditRow(row);
    setEditFirstName(fn);
    setEditLastName(ln);
    setEditContactEmail(row.contactEmail);
    setEditPassword("");
    setEditErr(null);
  }

  async function onUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editRow) return;
    setEditErr(null);
    setBusyId(editRow.id);
    try {
      const payload: Record<string, string> = {
        firstName: editFirstName.trim(),
        lastName: editLastName.trim(),
        contactEmail: editContactEmail.trim(),
      };
      if (editPassword.trim()) payload.password = editPassword;

      const res = await fetch(`${apiBase}/${editRow.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await res.json();
      if (!res.ok) {
        setEditErr(j.error ?? "Update failed");
        return;
      }
      setEditRow(null);
      void load();
    } catch {
      setEditErr("Network error");
    } finally {
      setBusyId(null);
    }
  }

  async function setSuspended(row: StaffRow, suspended: boolean) {
    setBusyId(row.id);
    setLoadErr(null);
    try {
      const res = await fetch(`${apiBase}/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: suspended ? "suspended" : "active" }),
      });
      const j = await res.json();
      if (!res.ok) {
        setLoadErr(j.error ?? "Action failed");
        return;
      }
      void load();
    } catch {
      setLoadErr("Network error");
    } finally {
      setBusyId(null);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleteErr(null);
    setBusyId(deleteTarget.id);
    try {
      const res = await fetch(`${apiBase}/${deleteTarget.id}`, { method: "DELETE" });
      const j = await res.json();
      if (!res.ok) {
        setDeleteErr(j.error ?? "Delete failed");
        return;
      }
      setDeleteTarget(null);
      void load();
    } catch {
      setDeleteErr("Network error");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="page-container space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[var(--sa-heading)]">Staff</h1>
        <p className="mt-1 text-sm text-[var(--sa-muted)]">
          Main admins and managers for this company. Use Email to open Outlook with a welcome template. Suspend
          temporarily or delete permanently.
        </p>
      </div>

      <div className="sa-panel p-5">
        <div className="flex items-center gap-2 text-[var(--sa-heading)]">
          <UserPlus className="h-5 w-5 text-[var(--sa-accent)]" aria-hidden />
          <h2 className="text-base font-semibold">Add staff account</h2>
        </div>
        {formErr && (
          <div className="alert-error mt-4 text-sm">
            <p>{formErr}</p>
            {status !== "suspended" && formErr.toLowerCase().includes("suspended") && (
              <button
                type="button"
                className="login-forgot-link mt-2 text-xs"
                onClick={() => setStatus("suspended")}
              >
                View suspended accounts →
              </button>
            )}
            {status !== "all" && formErr.toLowerCase().includes("active tab") && (
              <button type="button" className="login-forgot-link mt-2 text-xs" onClick={() => setStatus("active")}>
                View active staff →
              </button>
            )}
          </div>
        )}
        {formOk && (
          <div className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
            <p>{formOk}</p>
            {pendingWelcomeMail && (
              <button
                type="button"
                className="sa-btn-primary mt-3 inline-flex items-center gap-2 !py-2 text-sm"
                onClick={() => openWelcomeMail(pendingWelcomeMail.staff, pendingWelcomeMail.temporaryPassword)}
              >
                <Mail className="h-4 w-4" aria-hidden />
                Email in Outlook
              </button>
            )}
          </div>
        )}
        <form onSubmit={onCreate} className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="sa-label" htmlFor="sa-staff-first">
              First name
            </label>
            <input
              id="sa-staff-first"
              className="sa-input mt-1.5 w-full"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="sa-label" htmlFor="sa-staff-last">
              Last name
            </label>
            <input
              id="sa-staff-last"
              className="sa-input mt-1.5 w-full"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="sa-label" htmlFor="sa-staff-email">
              Contact email
            </label>
            <input
              id="sa-staff-email"
              type="email"
              className="sa-input mt-1.5 w-full"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="sa-label" htmlFor="sa-staff-role">
              Role
            </label>
            <input
              id="sa-staff-role"
              list="sa-staff-role-suggestions"
              className="sa-input mt-1.5 w-full"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="Type or pick: Manager, Main admin, Supervisor"
              required
            />
            <datalist id="sa-staff-role-suggestions">
              {STAFF_ROLE_SUGGESTIONS.map((r) => (
                <option key={r} value={r} />
              ))}
            </datalist>
            <p className="mt-1 text-xs text-[var(--sa-muted)]">
              Type a role name or choose a suggestion. Accepted: Manager, Main admin, Supervisor.
            </p>
          </div>
          <div className="sm:col-span-2">
            <label className="sa-label" htmlFor="sa-staff-password">
              Temporary password
            </label>
            <input
              id="sa-staff-password"
              type="password"
              className="sa-input mt-1.5 w-full max-w-md"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
            />
          </div>
          <div className="sm:col-span-2">
            <button type="submit" className="sa-btn-primary" disabled={creating}>
              {creating ? "Creating…" : "Create account"}
            </button>
          </div>
        </form>
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["active", "Active"],
            ["suspended", "Suspended"],
            ["all", "All"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setStatus(value)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
              status === value
                ? "bg-[var(--sa-accent-soft)] text-[var(--sa-accent)]"
                : "text-[var(--sa-muted)] hover:bg-white/5"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loadErr && <div className="alert-error max-w-xl text-sm">{loadErr}</div>}

      <div className="sa-panel overflow-hidden">
        {loading ? (
          <p className="p-8 text-center text-sm text-[var(--sa-muted)]">Loading…</p>
        ) : staff.length === 0 ? (
          <p className="p-8 text-center text-sm text-[var(--sa-muted)]">No staff accounts in this filter.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="sa-table min-w-[900px]">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Role</th>
                  <th className="px-4 py-3 text-left">Sign-in email</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Assigned</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {staff.map((row) => (
                  <tr key={row.id}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-[var(--sa-heading)]">{row.name}</p>
                      <p className="text-xs text-[var(--sa-muted)]">
                        Added {new Date(row.createdAt).toLocaleDateString()}
                        {row.createdByUsername ? ` · by ${row.createdByUsername}` : ""}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="sa-badge">{roleLabel(row.role)}</span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-[var(--sa-accent)]">
                      {employeeSignInEmail(row.username, row.contactEmail)}
                    </td>
                    <td className="px-4 py-3">
                      {row.suspended ? (
                        <span className="rounded-full bg-rose-500/15 px-2 py-0.5 text-xs font-semibold text-rose-300">
                          Suspended
                        </span>
                      ) : (
                        <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-300">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-sm text-[var(--sa-muted)]">
                      {row.role === Role.MANAGER || row.role === Role.SUPERVISOR
                        ? `${row.assignedEmployeeCount} employees`
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        className="sa-btn-ghost inline-flex items-center gap-1.5 !px-2.5 !py-1.5 text-xs text-[var(--sa-accent)]"
                        disabled={busyId === row.id || !companyMail}
                        onClick={() => openWelcomeMail(row)}
                        title={`Email welcome message to ${row.contactEmail}`}
                      >
                        <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        Email
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap justify-end gap-1.5">
                        <button
                          type="button"
                          className="sa-btn-ghost !px-2 !py-1 text-xs"
                          disabled={busyId === row.id}
                          onClick={() => openEdit(row)}
                          title="Edit"
                        >
                          <Pencil className="h-3.5 w-3.5" aria-hidden />
                        </button>
                        {row.suspended ? (
                          <button
                            type="button"
                            className="sa-btn-ghost !px-2 !py-1 text-xs text-emerald-300"
                            disabled={busyId === row.id}
                            onClick={() => void setSuspended(row, false)}
                            title="Restore access"
                          >
                            <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="sa-btn-ghost !px-2 !py-1 text-xs text-amber-300"
                            disabled={busyId === row.id}
                            onClick={() => void setSuspended(row, true)}
                            title="Suspend temporarily"
                          >
                            <UserMinus className="h-3.5 w-3.5" aria-hidden />
                          </button>
                        )}
                        <button
                          type="button"
                          className="sa-btn-ghost sa-btn-danger !px-2 !py-1 text-xs"
                          disabled={busyId === row.id}
                          onClick={() => {
                            setDeleteErr(null);
                            setDeleteTarget(row);
                          }}
                          title="Delete permanently"
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editRow && (
        <div className="sa-modal-overlay" role="dialog" aria-modal="true">
          <div className="sa-modal">
            <h2 className="text-lg font-semibold text-[var(--sa-heading)]">Edit {roleLabel(editRow.role)}</h2>
            {editErr && <div className="alert-error mt-4 text-sm">{editErr}</div>}
            <form onSubmit={onUpdate} className="mt-5 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="sa-label" htmlFor="edit-first">
                    First name
                  </label>
                  <input
                    id="edit-first"
                    className="sa-input mt-1.5 w-full"
                    value={editFirstName}
                    onChange={(e) => setEditFirstName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="sa-label" htmlFor="edit-last">
                    Last name
                  </label>
                  <input
                    id="edit-last"
                    className="sa-input mt-1.5 w-full"
                    value={editLastName}
                    onChange={(e) => setEditLastName(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="sa-label" htmlFor="edit-email">
                  Contact email
                </label>
                <input
                  id="edit-email"
                  type="email"
                  className="sa-input mt-1.5 w-full"
                  value={editContactEmail}
                  onChange={(e) => setEditContactEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="sa-label" htmlFor="edit-password">
                  New temporary password (optional)
                </label>
                <input
                  id="edit-password"
                  type="password"
                  className="sa-input mt-1.5 w-full"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  minLength={8}
                  placeholder="Leave blank to keep current"
                />
              </div>
              {companyMail && (
                <div className="rounded-lg border border-[var(--sa-border)] bg-black/20 px-3 py-3">
                  <p className="text-xs text-[var(--sa-muted)]">
                    Send a welcome email to{" "}
                    <span className="font-medium text-[var(--sa-heading)]">{editContactEmail || editRow.contactEmail}</span>
                    {editPassword.trim()
                      ? " with the new temporary password below."
                      : " (set a new temporary password above to include it in the email)."}
                  </p>
                  <button
                    type="button"
                    className="sa-btn-ghost mt-2 inline-flex items-center gap-1.5 !px-2.5 !py-1.5 text-xs text-[var(--sa-accent)]"
                    onClick={() =>
                      openWelcomeMail(
                        {
                          contactEmail: editContactEmail.trim() || editRow.contactEmail,
                          name: `${editFirstName.trim()} ${editLastName.trim()}`.trim() || editRow.name,
                          role: editRow.role,
                          username: editRow.username,
                        },
                        editPassword.trim() || undefined
                      )
                    }
                  >
                    <Mail className="h-3.5 w-3.5" aria-hidden />
                    Email in Outlook
                  </button>
                </div>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="sa-btn-ghost" onClick={() => setEditRow(null)}>
                  Cancel
                </button>
                <button type="submit" className="sa-btn-primary" disabled={busyId === editRow.id}>
                  {busyId === editRow.id ? "Saving…" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="sa-modal-overlay" role="dialog" aria-modal="true">
          <div className="sa-modal">
            <h2 className="text-lg font-semibold text-[var(--sa-heading)]">Delete permanently?</h2>
            <p className="mt-3 text-sm text-[var(--sa-muted)]">
              This removes {deleteTarget.name}&apos;s login forever. Suspended accounts can be restored instead — use
              delete only when the account should never return.
            </p>
            <p className="mt-3 rounded-lg border border-[var(--sa-border)] bg-black/20 px-3 py-2 text-sm">
              <span className="font-medium text-[var(--sa-heading)]">{deleteTarget.name}</span>
              <span className="text-[var(--sa-muted)]"> · </span>
              <span className="font-mono text-xs">{deleteTarget.username}</span>
            </p>
            {deleteErr && <div className="alert-error mt-4 text-sm">{deleteErr}</div>}
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" className="sa-btn-ghost" onClick={() => setDeleteTarget(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="sa-btn-primary sa-btn-danger"
                disabled={busyId === deleteTarget.id}
                onClick={() => void confirmDelete()}
              >
                {busyId === deleteTarget.id ? "Deleting…" : "Delete permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
