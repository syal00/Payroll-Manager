"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Building2,
  ExternalLink,
  Globe,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserCog,
  Users,
} from "lucide-react";
import { formatCompanySubdomain } from "@/lib/company-subdomain-display";
import { ClearTenantActingCookie } from "@/components/super-admin/TenantActingCookie";
import { CreateCompanyModal } from "@/components/super-admin/CreateCompanyModal";
import { CompanyLogoField } from "@/components/super-admin/CompanyLogoField";
import { normalizeWebsiteUrl } from "@/lib/website-url";

type CompanyRow = {
  id: string;
  name: string;
  slug: string;
  websiteUrl: string | null;
  logoUrl: string | null;
  primaryColor: string | null;
  createdAt: string;
  employeeCount: number;
  managerCount: number;
  timesheetPendingCount: number;
};

type FormMode = "edit" | null;

type CompanyFormState = {
  name: string;
  slug: string;
  websiteUrl: string;
  logoUrl: string;
  primaryColor: string;
};

const emptyEditForm = (): CompanyFormState => ({
  name: "",
  slug: "",
  websiteUrl: "",
  logoUrl: "",
  primaryColor: "",
});

export default function SuperAdminCompaniesPage() {
  const [companies, setCompanies] = useState<CompanyRow[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [formMode, setFormMode] = useState<FormMode>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CompanyFormState>(emptyEditForm);
  const [formErr, setFormErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CompanyRow | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");

  const load = useCallback(() => {
    setErr(null);
    fetch("/api/super-admin/companies")
      .then((r) => r.json())
      .then((j) => {
        if (j.error) {
          setErr(j.error);
          setCompanies([]);
          return;
        }
        setCompanies(j.companies ?? []);
      })
      .catch(() => {
        setErr("Failed to load companies");
        setCompanies([]);
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    if (!companies) return null;
    const q = search.trim().toLowerCase();
    if (!q) return companies;
    return companies.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q) ||
        formatCompanySubdomain(c.slug, c.websiteUrl).toLowerCase().includes(q)
    );
  }, [companies, search]);

  const totals = useMemo(() => {
    if (!companies) return null;
    return {
      companies: companies.length,
      employees: companies.reduce((s, c) => s + c.employeeCount, 0),
      pending: companies.reduce((s, c) => s + c.timesheetPendingCount, 0),
    };
  }, [companies]);

  function openCreate() {
    setCreateOpen(true);
    setFormErr(null);
  }

  function openEdit(row: CompanyRow) {
    setFormMode("edit");
    setEditingId(row.id);
    setForm({
      name: row.name,
      slug: row.slug,
      websiteUrl: row.websiteUrl ?? "",
      logoUrl: row.logoUrl ?? "",
      primaryColor: row.primaryColor ?? "",
    });
    setFormErr(null);
  }

  function closeForm() {
    setFormMode(null);
    setEditingId(null);
    setFormErr(null);
  }

  async function submitEdit(e: React.FormEvent) {
    e.preventDefault();
    setFormErr(null);
    setBusy(true);

    try {
      if (formMode === "edit" && editingId) {
        const res = await fetch(`/api/super-admin/companies/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name.trim(),
            slug: form.slug.trim(),
            websiteUrl: form.websiteUrl.trim() || null,
            logoUrl: form.logoUrl.trim() || null,
            primaryColor: form.primaryColor.trim() || null,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setFormErr(data.error ?? "Could not update company");
          return;
        }
        closeForm();
        load();
      }
    } catch {
      setFormErr("Network error");
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setBusy(true);
    setFormErr(null);
    try {
      const res = await fetch(`/api/super-admin/companies/${deleteTarget.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmName: deleteConfirmName }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormErr(data.error ?? "Delete failed");
        return;
      }
      setDeleteTarget(null);
      setDeleteConfirmName("");
      load();
    } catch {
      setFormErr("Network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page-container space-y-6">
      <ClearTenantActingCookie />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--sa-accent)]">
            Platform control
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--sa-heading)]">
            Tenant workspaces
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-[var(--sa-muted)]">
            Create and manage company workspaces. Each tenant gets an isolated subdomain — staff and
            employees only see their own company; platform access stays invisible to them.
          </p>
        </div>
        <button type="button" className="sa-btn-primary shrink-0" onClick={openCreate}>
          <Plus className="h-4 w-4" aria-hidden />
          Create company
        </button>
      </div>

      {totals ? (
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { label: "Companies", value: totals.companies },
            { label: "Total employees", value: totals.employees },
            { label: "Pending timesheets", value: totals.pending },
          ].map((s) => (
            <div key={s.label} className="sa-panel px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--sa-muted)]">{s.label}</p>
              <p className="mt-1 text-2xl font-bold text-[var(--sa-heading)]">{s.value}</p>
            </div>
          ))}
        </div>
      ) : null}

      <div className="sa-panel p-4">
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--sa-muted)]" />
          <input
            className="sa-input pl-9"
            placeholder="Search by name or subdomain…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {err ? <div className="alert-error max-w-xl">{err}</div> : null}

      <div className="sa-panel overflow-hidden">
        {!filtered ? (
          <div className="p-8 text-center text-sm text-[var(--sa-muted)]">Loading workspaces…</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Building2 className="mx-auto h-10 w-10 text-[var(--sa-muted)]" strokeWidth={1.5} />
            <p className="mt-3 font-semibold text-[var(--sa-heading)]">No companies yet</p>
            <p className="mt-1 text-sm text-[var(--sa-muted)]">Create your first tenant workspace to get started.</p>
            <button type="button" className="sa-btn-primary mt-5" onClick={openCreate}>
              Create company
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="sa-table min-w-[880px]">
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Subdomain</th>
                  <th>Roster</th>
                  <th>Pending</th>
                  <th>Created</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        {c.logoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={c.logoUrl} alt="" width={36} height={36} className="rounded-lg object-contain" />
                        ) : (
                          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--sa-accent-soft)] text-[var(--sa-accent)]">
                            <Building2 className="h-4 w-4" />
                          </span>
                        )}
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="font-semibold text-[var(--sa-heading)]">{c.name}</p>
                            {c.websiteUrl ? (
                              <a
                                href={c.websiteUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[var(--sa-accent)] hover:opacity-80"
                                title={c.websiteUrl}
                                aria-label={`Open ${c.name} website`}
                              >
                                <Globe className="h-3.5 w-3.5" aria-hidden />
                              </a>
                            ) : null}
                          </div>
                          {c.primaryColor ? (
                            <span className="mt-0.5 inline-flex items-center gap-1 text-xs text-[var(--sa-muted)]">
                              <span
                                className="inline-block h-2.5 w-2.5 rounded-full border border-[var(--sa-border)]"
                                style={{ background: c.primaryColor }}
                              />
                              Brand color
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td>
                      <code className="sa-mono text-[var(--sa-accent)]">{formatCompanySubdomain(c.slug, c.websiteUrl)}</code>
                      <p className="mt-0.5 text-xs text-[var(--sa-muted)]">slug: {c.slug}</p>
                    </td>
                    <td>
                      <div className="flex flex-col gap-1 text-xs">
                        <span className="sa-stat-pill">
                          <Users className="h-3.5 w-3.5" /> <strong>{c.employeeCount}</strong> employees
                        </span>
                        <span className="sa-stat-pill">
                          <UserCog className="h-3.5 w-3.5" /> <strong>{c.managerCount}</strong> managers
                        </span>
                      </div>
                    </td>
                    <td>
                      {c.timesheetPendingCount > 0 ? (
                        <span className="sa-badge">{c.timesheetPendingCount} pending</span>
                      ) : (
                        <span className="text-xs text-[var(--sa-muted)]">—</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap text-xs text-[var(--sa-muted)]">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <div className="flex flex-wrap justify-end gap-1">
                        <Link
                          href={`/super-admin/companies/${c.id}/dashboard`}
                          className="sa-btn-ghost text-[var(--sa-accent)]"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          Open
                        </Link>
                        <button type="button" className="sa-btn-ghost" onClick={() => openEdit(c)}>
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </button>
                        <button
                          type="button"
                          className="sa-btn-ghost sa-btn-danger"
                          onClick={() => {
                            setDeleteTarget(c);
                            setDeleteConfirmName("");
                            setFormErr(null);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
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

      <CreateCompanyModal
        open={createOpen}
        existingCompanies={companies ?? []}
        onClose={() => setCreateOpen(false)}
        onCreated={load}
      />

      {formMode === "edit" ? (
        <div className="sa-modal-overlay" role="dialog" aria-modal="true">
          <div className="sa-modal">
            <h2 className="text-lg font-bold text-[var(--sa-heading)]">Edit company</h2>
            <p className="mt-1 text-sm text-[var(--sa-muted)]">
              Updating the subdomain changes the tenant URL. Existing login usernames are not renamed.
            </p>

            {formErr ? <div className="alert-error mt-4">{formErr}</div> : null}

            <form onSubmit={submitEdit} className="mt-5 space-y-4">
              <div>
                <label className="sa-label" htmlFor="co-name">
                  Company name
                </label>
                <input
                  id="co-name"
                  className="sa-input"
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="sa-label" htmlFor="edit-co-website">
                  Company website
                </label>
                <input
                  id="edit-co-website"
                  className="sa-input"
                  value={form.websiteUrl}
                  placeholder="https://example.com"
                  onChange={(e) => setForm((f) => ({ ...f, websiteUrl: e.target.value }))}
                  onBlur={() => {
                    if (form.websiteUrl.trim()) {
                      setForm((f) => ({ ...f, websiteUrl: normalizeWebsiteUrl(f.websiteUrl) }));
                    }
                  }}
                />
              </div>
              <div>
                <label className="sa-label" htmlFor="edit-co-slug">
                  Subdomain slug
                </label>
                <input
                  id="edit-co-slug"
                  className="sa-input sa-mono"
                  required
                  pattern="[a-z0-9]+(-[a-z0-9]+)*"
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value.toLowerCase() }))}
                />
                {form.slug ? (
                  <p className="mt-1 text-xs text-[var(--sa-muted)]">
                    Tenant URL: <code className="sa-mono">{formatCompanySubdomain(form.slug, form.websiteUrl)}</code>
                  </p>
                ) : null}
              </div>
              <div>
                <label className="sa-label" htmlFor="edit-co-logo">
                  Company logo (optional)
                </label>
                <CompanyLogoField
                  inputId="edit-co-logo"
                  value={form.logoUrl}
                  onChange={(logoUrl) => setForm((f) => ({ ...f, logoUrl }))}
                />
              </div>
              <div>
                <label className="sa-label" htmlFor="co-color">
                  Primary color (optional)
                </label>
                <input
                  id="co-color"
                  className="sa-input sa-mono"
                  value={form.primaryColor}
                  onChange={(e) => setForm((f) => ({ ...f, primaryColor: e.target.value }))}
                  placeholder="#c5a021"
                  pattern="#[0-9a-fA-F]{6}"
                />
              </div>

              <div className="flex flex-wrap justify-end gap-2 pt-2">
                <button type="button" className="sa-btn-ghost" disabled={busy} onClick={closeForm}>
                  Cancel
                </button>
                <button type="submit" className="sa-btn-primary" disabled={busy}>
                  {busy ? "Saving…" : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {deleteTarget ? (
        <div className="sa-modal-overlay" role="dialog" aria-modal="true">
          <div className="sa-modal">
            <h2 className="text-lg font-bold text-[var(--sa-danger)]">Delete company</h2>
            <p className="mt-2 text-sm text-[var(--sa-muted)]">
              This permanently removes <strong className="text-[var(--sa-heading)]">{deleteTarget.name}</strong>{" "}
              and all staff accounts, employees, timesheets, and payslips for this tenant. This cannot be undone.
            </p>
            <p className="mt-3 text-xs text-[var(--sa-muted)]">
              {deleteTarget.employeeCount} employees · {deleteTarget.managerCount} managers ·{" "}
              {deleteTarget.timesheetPendingCount} pending timesheets
            </p>
            {formErr ? <div className="alert-error mt-4">{formErr}</div> : null}
            <div className="mt-4">
              <label className="sa-label" htmlFor="del-confirm">
                Type <strong>{deleteTarget.name}</strong> to confirm
              </label>
              <input
                id="del-confirm"
                className="sa-input"
                value={deleteConfirmName}
                onChange={(e) => setDeleteConfirmName(e.target.value)}
              />
            </div>
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                className="sa-btn-ghost"
                disabled={busy}
                onClick={() => setDeleteTarget(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="sa-btn-primary !bg-[var(--sa-danger)] !text-white"
                disabled={busy || deleteConfirmName !== deleteTarget.name}
                onClick={() => void confirmDelete()}
              >
                {busy ? "Deleting…" : "Delete permanently"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
