"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Copy, Loader2 } from "lucide-react";
import { z } from "zod";
import { formatCompanySubdomain } from "@/lib/company-subdomain-display";
import { slugFromCompanyName } from "@/lib/company-slug";
import { buildCompanyLoginEmail } from "@/lib/company-login-email";
import { DEFAULT_INITIAL_STAFF_PASSWORD } from "@/lib/default-staff-password";
import {
  COMPANY_TIMEZONE_OPTIONS,
  DEFAULT_COMPANY_TIMEZONE,
  type PayPeriodProvisionType,
} from "@/lib/company-timezones";
import { isValidCompanyLogoUrl } from "@/lib/company-logo-url";
import { CompanyLogoField } from "@/components/super-admin/CompanyLogoField";
import { defaultBiweeklyPayPeriodWindow } from "@/lib/pay-period-window";
import { isValidWebsiteUrl, normalizeWebsiteUrl } from "@/lib/website-url";

type ExistingCompany = { id: string; name: string; slug: string };

type SlugCheckStatus = "idle" | "checking" | "available" | "taken" | "invalid_format" | "reserved" | "too_short";

type CreateSuccess = {
  company: { id: string; name: string; slug: string; websiteUrl?: string | null };
  initialAdmin?: {
    id?: string;
    username: string;
    contactEmail: string;
    name: string;
    role: string;
    password: string;
    welcomeEmailSent?: boolean;
    welcomeEmailDetail?: string;
  } | null;
  payPeriod?: { name: string | null; startDate: string; endDate: string } | null;
};

type InitialStaffRole = "MAIN_ADMIN" | "MANAGER";

type Step = "form" | "confirm" | "success";

const emailSchema = z.string().trim().email();

function formatDateInput(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function SlugStatusHint({ status, message }: { status: SlugCheckStatus; message: string }) {
  if (status === "idle" || !message) return null;
  const className =
    status === "checking"
      ? "sa-hint-muted"
      : status === "available"
        ? "sa-hint-success"
        : "sa-hint-error";
  return (
    <p className={`mt-1 text-xs ${className}`}>
      {status === "checking" ? "Checking availability…" : message}
    </p>
  );
}

export function CreateCompanyModal({
  open,
  existingCompanies,
  onClose,
  onCreated,
}: {
  open: boolean;
  existingCompanies: ExistingCompany[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [step, setStep] = useState<Step>("form");
  const [busy, setBusy] = useState(false);
  const [formErr, setFormErr] = useState<string | null>(null);
  const [success, setSuccess] = useState<CreateSuccess | null>(null);
  const [copied, setCopied] = useState(false);
  const [resendBusy, setResendBusy] = useState(false);
  const [resendMsg, setResendMsg] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [logoUrl, setLogoUrl] = useState("");
  const [timezone, setTimezone] = useState(DEFAULT_COMPANY_TIMEZONE);
  const [payPeriodType, setPayPeriodType] = useState<PayPeriodProvisionType>("biweekly");
  const [payPeriodStart, setPayPeriodStart] = useState("");
  const [payPeriodEnd, setPayPeriodEnd] = useState("");

  const [includeAdmin, setIncludeAdmin] = useState(true);
  const [adminRole, setAdminRole] = useState<InitialStaffRole>("MAIN_ADMIN");
  const [adminName, setAdminName] = useState("");
  const [adminContactEmail, setAdminContactEmail] = useState("");
  const [forcePasswordChange, setForcePasswordChange] = useState(true);

  const [slugStatus, setSlugStatus] = useState<SlugCheckStatus>("idle");
  const [slugMessage, setSlugMessage] = useState("");

  const biweeklyPreview = useMemo(() => defaultBiweeklyPayPeriodWindow(), []);

  useEffect(() => {
    if (!open) return;
    setStep("form");
    setBusy(false);
    setFormErr(null);
    setSuccess(null);
    setCopied(false);
    setResendBusy(false);
    setResendMsg(null);
    setName("");
    setWebsiteUrl("");
    setSlug("");
    setSlugTouched(false);
    setLogoUrl("");
    setTimezone(DEFAULT_COMPANY_TIMEZONE);
    setPayPeriodType("biweekly");
    const { start, end } = defaultBiweeklyPayPeriodWindow();
    setPayPeriodStart(formatDateInput(start));
    setPayPeriodEnd(formatDateInput(end));
    setIncludeAdmin(true);
    setAdminRole("MAIN_ADMIN");
    setAdminName("");
    setAdminContactEmail("");
    setForcePasswordChange(true);
    setSlugStatus("idle");
    setSlugMessage("");
  }, [open]);

  useEffect(() => {
    if (!slugTouched && name) {
      setSlug(slugFromCompanyName(name));
    }
  }, [name, slugTouched]);

  useEffect(() => {
    if (!slug.trim()) {
      setSlugStatus("idle");
      setSlugMessage("");
      return;
    }
    setSlugStatus("checking");
    const handle = window.setTimeout(() => {
      void fetch(`/api/super-admin/companies/check-slug?slug=${encodeURIComponent(slug.trim())}`)
        .then((r) => r.json())
        .then((j) => {
          setSlugStatus(j.status ?? (j.available ? "available" : "taken"));
          setSlugMessage(j.message ?? "");
        })
        .catch(() => {
          setSlugStatus("idle");
          setSlugMessage("Could not verify slug availability.");
        });
    }, 400);
    return () => window.clearTimeout(handle);
  }, [slug]);

  const duplicateNameWarning = useMemo(() => {
    const trimmed = name.trim();
    if (!trimmed) return null;
    const match = existingCompanies.find((c) => c.name.trim().toLowerCase() === trimmed.toLowerCase());
    return match ? match.name : null;
  }, [name, existingCompanies]);

  const emailValid = useMemo(() => {
    if (!includeAdmin || !adminContactEmail.trim()) return null;
    return emailSchema.safeParse(adminContactEmail.trim()).success;
  }, [includeAdmin, adminContactEmail]);

  const logoUrlError = useMemo(() => {
    if (!logoUrl.trim()) return null;
    return isValidCompanyLogoUrl(logoUrl) ? null : "Enter a valid URL or upload an image file.";
  }, [logoUrl]);

  const websiteUrlError = useMemo(() => {
    if (!websiteUrl.trim()) return null;
    return isValidWebsiteUrl(websiteUrl) ? null : "Enter a valid website URL.";
  }, [websiteUrl]);

  const adminFirstName = useMemo(() => adminName.trim().split(/\s+/)[0] ?? "", [adminName]);

  const companyLoginPreview = useMemo(() => {
    if (!includeAdmin || !adminFirstName || !slug.trim()) return "";
    return buildCompanyLoginEmail(adminRole, adminFirstName, slug.trim());
  }, [includeAdmin, adminRole, adminFirstName, slug]);

  const slugReady = slugStatus === "available";
  const canProceedForm =
    name.trim().length > 0 &&
    slugReady &&
    !logoUrlError &&
    !websiteUrlError &&
    (!includeAdmin || (adminName.trim().length > 0 && emailValid === true)) &&
    (payPeriodType === "biweekly" || (payPeriodStart && payPeriodEnd));

  function goToConfirm(e: React.FormEvent) {
    e.preventDefault();
    setFormErr(null);
    if (!canProceedForm) {
      setFormErr("Fix validation errors before continuing.");
      return;
    }
    setStep("confirm");
  }

  async function submitCreate() {
    setFormErr(null);
    setBusy(true);
    try {
      const payload: Record<string, unknown> = {
        name: name.trim(),
        slug: slug.trim(),
        websiteUrl: websiteUrl.trim() ? normalizeWebsiteUrl(websiteUrl) : null,
        logoUrl: logoUrl.trim() || null,
        timezone,
        payPeriod: {
          type: payPeriodType,
          ...(payPeriodType === "custom"
            ? { startDate: payPeriodStart, endDate: payPeriodEnd }
            : {}),
        },
      };
      if (includeAdmin) {
        payload.initialAdmin = {
          name: adminName.trim(),
          contactEmail: adminContactEmail.trim(),
          role: adminRole,
          password: DEFAULT_INITIAL_STAFF_PASSWORD,
          mustChangePassword: forcePasswordChange,
        };
      }

      const res = await fetch("/api/super-admin/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormErr(data.error ?? "Could not create company");
        setStep("form");
        return;
      }

      setSuccess({
        company: data.company,
        initialAdmin: data.initialAdmin
          ? {
              id: data.initialAdmin.id,
              username: data.initialAdmin.username,
              contactEmail: data.initialAdmin.contactEmail,
              name: data.initialAdmin.name,
              role: data.initialAdmin.role ?? adminRole,
              password: DEFAULT_INITIAL_STAFF_PASSWORD,
              welcomeEmailSent: data.initialAdmin.welcomeEmailSent,
              welcomeEmailDetail: data.initialAdmin.welcomeEmailDetail,
            }
          : null,
        payPeriod: data.payPeriod ?? null,
      });
      setStep("success");
      onCreated();
    } catch {
      setFormErr("Network error");
      setStep("form");
    } finally {
      setBusy(false);
    }
  }

  const credentialsText = useMemo(() => {
    if (!success) return "";
    const lines = [
      `Company: ${success.company.name}`,
      `Subdomain: ${formatCompanySubdomain(success.company.slug, websiteUrl || success.company.websiteUrl)}`,
      `Slug: ${success.company.slug}`,
    ];
    if (success.company.websiteUrl) {
      lines.push(`Website: ${success.company.websiteUrl}`);
    }
    if (success.initialAdmin) {
      const roleLabel = success.initialAdmin.role === "MANAGER" ? "Manager" : "Main admin";
      lines.push(
        "",
        `Initial ${roleLabel.toLowerCase()}:`,
        `  Name: ${success.initialAdmin.name}`,
        `  Company login: ${success.initialAdmin.username}`,
        `  Personal email: ${success.initialAdmin.contactEmail}`,
        `  Temporary password: ${success.initialAdmin.password}`,
        success.initialAdmin.welcomeEmailSent
          ? "  Welcome email: sent to personal email"
          : `  Welcome email: not sent${success.initialAdmin.welcomeEmailDetail ? ` (${success.initialAdmin.welcomeEmailDetail})` : ""}`
      );
    }
    if (success.payPeriod) {
      lines.push(
        "",
        `Pay period: ${success.payPeriod.name ?? "Open period"}`,
        `  ${success.payPeriod.startDate.slice(0, 10)} → ${success.payPeriod.endDate.slice(0, 10)}`
      );
    }
    return lines.join("\n");
  }, [success]);

  const copyCredentials = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(credentialsText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }, [credentialsText]);

  async function resendWelcomeEmail() {
    if (!success?.initialAdmin?.id || !success.company.id) return;
    setResendBusy(true);
    setResendMsg(null);
    try {
      const res = await fetch(`/api/super-admin/companies/${success.company.id}/resend-welcome`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: success.initialAdmin.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResendMsg(data.error ?? "Could not resend email");
        return;
      }
      setResendMsg(
        data.welcomeEmailSent
          ? `Welcome email sent to ${data.to}`
          : data.welcomeEmailDetail ?? "Email still not configured — add SMTP settings to .env"
      );
      if (data.welcomeEmailSent && success.initialAdmin) {
        setSuccess({
          ...success,
          initialAdmin: { ...success.initialAdmin, welcomeEmailSent: true },
        });
      }
    } catch {
      setResendMsg("Network error");
    } finally {
      setResendBusy(false);
    }
  }

  if (!open) return null;

  return (
    <div className="sa-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="create-co-title">
      <div className="sa-modal sa-modal-lg">
        <h2 id="create-co-title" className="text-lg font-bold text-[var(--sa-heading)]">
          Create company
        </h2>
        <p className="mt-1 text-sm text-[var(--sa-muted)]">
          Provision a new isolated tenant workspace with its own subdomain.
        </p>

        {formErr ? <div className="alert-error mt-4">{formErr}</div> : null}

        {step === "success" && success ? (
          <div className="mt-5 space-y-4">
            <div className="rounded-lg border border-[var(--sa-accent)]/40 bg-[var(--sa-accent-soft)] p-4 text-sm">
              <p className="font-semibold text-[var(--sa-heading)]">Company created</p>
              <p className="mt-2 text-[var(--sa-text)]">
                <strong>{success.company.name}</strong> is live at{" "}
                <code className="sa-mono text-[var(--sa-accent)]">
                  {formatCompanySubdomain(success.company.slug, websiteUrl || success.company.websiteUrl)}
                </code>
              </p>
              {success.initialAdmin ? (
                <dl className="mt-3 space-y-1 text-[var(--sa-text)]">
                  <div>
                    <dt className="text-xs text-[var(--sa-muted)]">Company login</dt>
                    <dd>
                      <code className="sa-mono text-[var(--sa-accent)]">{success.initialAdmin.username}</code>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-[var(--sa-muted)]">Personal email</dt>
                    <dd>{success.initialAdmin.contactEmail}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-[var(--sa-muted)]">Temporary password</dt>
                    <dd>
                      <code className="sa-mono">{success.initialAdmin.password}</code>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-[var(--sa-muted)]">Welcome email</dt>
                    <dd>
                      {success.initialAdmin.welcomeEmailSent ? (
                        <span className="text-[var(--sa-success)]">Sent to personal email</span>
                      ) : (
                        <span className="text-[var(--sa-danger)]">
                          {success.initialAdmin.welcomeEmailDetail ??
                            "Not sent — email is not configured on the server"}
                        </span>
                      )}
                    </dd>
                  </div>
                </dl>
              ) : null}
              {success.initialAdmin && !success.initialAdmin.welcomeEmailSent ? (
                <div className="alert-error mt-3 text-xs leading-relaxed">
                  Add SMTP settings to your <code className="sa-mono">.env</code> file and restart the dev
                  server, then click <strong>Resend welcome email</strong> below. Until then, copy credentials
                  and share them manually.
                </div>
              ) : null}
              {success.payPeriod ? (
                <p className="mt-3 text-xs text-[var(--sa-muted)]">
                  Open pay period: {success.payPeriod.startDate.slice(0, 10)} –{" "}
                  {success.payPeriod.endDate.slice(0, 10)}
                </p>
              ) : null}
            </div>
            {resendMsg ? (
              <p
                className={`text-sm ${resendMsg.includes("sent to") ? "text-[var(--sa-success)]" : "text-[var(--sa-danger)]"}`}
              >
                {resendMsg}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <button type="button" className="sa-btn-primary" onClick={() => void copyCredentials()}>
                <Copy className="h-4 w-4" aria-hidden />
                {copied ? "Copied!" : "Copy credentials"}
              </button>
              {success.initialAdmin?.id && !success.initialAdmin.welcomeEmailSent ? (
                <button
                  type="button"
                  className="sa-btn-ghost"
                  disabled={resendBusy}
                  onClick={() => void resendWelcomeEmail()}
                >
                  {resendBusy ? "Sending…" : "Resend welcome email"}
                </button>
              ) : null}
              <button type="button" className="sa-btn-ghost" onClick={onClose}>
                Done
              </button>
            </div>
          </div>
        ) : step === "confirm" ? (
          <div className="mt-5 space-y-4">
            <div className="rounded-lg border border-[var(--sa-border)] bg-[var(--sa-surface-raised)] p-4 text-sm">
              <p className="font-semibold text-[var(--sa-heading)]">Confirm provisioning</p>
              <ul className="mt-3 list-inside list-disc space-y-1 text-[var(--sa-text)]">
                <li>
                  Company <strong>{name.trim()}</strong> at{" "}
                  <code className="sa-mono">{formatCompanySubdomain(slug.trim(), websiteUrl)}</code>
                </li>
                {websiteUrl.trim() ? (
                  <li>
                    Website:{" "}
                    <a
                      href={normalizeWebsiteUrl(websiteUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--sa-accent)] underline-offset-2 hover:underline"
                    >
                      {normalizeWebsiteUrl(websiteUrl)}
                    </a>
                  </li>
                ) : null}
                <li>Timezone: {timezone}</li>
                <li>
                  Pay period:{" "}
                  {payPeriodType === "biweekly"
                    ? `Bi-weekly (${formatDateInput(biweeklyPreview.start)} → ${formatDateInput(biweeklyPreview.end)})`
                    : `Custom (${payPeriodStart} → ${payPeriodEnd})`}
                </li>
                {includeAdmin ? (
                  <li>
                    Initial {adminRole === "MANAGER" ? "manager" : "main admin"}{" "}
                    <strong>{adminName.trim()}</strong> — company login{" "}
                    <code className="sa-mono">{companyLoginPreview || "…"}</code>, welcome email to{" "}
                    {adminContactEmail.trim()}
                  </li>
                ) : (
                  <li>No initial staff account — add one later from the admin console.</li>
                )}
              </ul>
              <p className="mt-3 text-xs text-[var(--sa-muted)]">
                This provisions a new tenant in the database. It cannot be undone from this screen (only
                deleted separately).
              </p>
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <button type="button" className="sa-btn-ghost" disabled={busy} onClick={() => setStep("form")}>
                Back
              </button>
              <button type="button" className="sa-btn-primary" disabled={busy} onClick={() => void submitCreate()}>
                {busy ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    Creating…
                  </>
                ) : (
                  "Create company"
                )}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={goToConfirm} className="mt-5 space-y-4">
            <div>
              <label className="sa-label" htmlFor="co-name">
                Company name
              </label>
              <input
                id="co-name"
                className="sa-input"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              {duplicateNameWarning ? (
                <p className="sa-hint-warn mt-1 text-xs">
                  A company with a similar name already exists ({duplicateNameWarning}). You can still
                  proceed.
                </p>
              ) : null}
            </div>

            <div>
              <label className="sa-label" htmlFor="co-website">
                Company website
              </label>
              <input
                id="co-website"
                className="sa-input"
                type="text"
                inputMode="url"
                value={websiteUrl}
                placeholder="https://example.com"
                onChange={(e) => setWebsiteUrl(e.target.value)}
                onBlur={() => {
                  if (websiteUrl.trim()) setWebsiteUrl(normalizeWebsiteUrl(websiteUrl));
                }}
              />
              {websiteUrlError ? <p className="sa-hint-error mt-1 text-xs">{websiteUrlError}</p> : null}
            </div>

            <div>
              <label className="sa-label" htmlFor="co-slug">
                Subdomain slug
              </label>
              <input
                id="co-slug"
                className="sa-input sa-mono"
                required
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(e.target.value.toLowerCase());
                }}
              />
              {slug ? (
                <p className="mt-1 text-xs text-[var(--sa-muted)]">
                  Tenant URL:{" "}
                  <code className="sa-mono text-[var(--sa-accent)]">{formatCompanySubdomain(slug, websiteUrl)}</code>
                </p>
              ) : null}
              <SlugStatusHint status={slugStatus} message={slugMessage} />
            </div>

            <div>
              <label className="sa-label" htmlFor="co-logo">
                Company logo (optional)
              </label>
              <CompanyLogoField inputId="co-logo" value={logoUrl} onChange={setLogoUrl} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="sa-label" htmlFor="co-timezone">
                  Timezone
                </label>
                <select
                  id="co-timezone"
                  className="sa-input"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                >
                  {COMPANY_TIMEZONE_OPTIONS.map((tz) => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="sa-label" htmlFor="co-pay-type">
                  Default pay period
                </label>
                <select
                  id="co-pay-type"
                  className="sa-input"
                  value={payPeriodType}
                  onChange={(e) => setPayPeriodType(e.target.value as PayPeriodProvisionType)}
                >
                  <option value="biweekly">Bi-weekly (14 days, starting today)</option>
                  <option value="custom">Custom 14-day window</option>
                </select>
              </div>
            </div>

            {payPeriodType === "custom" ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="sa-label" htmlFor="co-pp-start">
                    Period start
                  </label>
                  <input
                    id="co-pp-start"
                    type="date"
                    className="sa-input"
                    required
                    value={payPeriodStart}
                    onChange={(e) => setPayPeriodStart(e.target.value)}
                  />
                </div>
                <div>
                  <label className="sa-label" htmlFor="co-pp-end">
                    Period end
                  </label>
                  <input
                    id="co-pp-end"
                    type="date"
                    className="sa-input"
                    required
                    value={payPeriodEnd}
                    onChange={(e) => setPayPeriodEnd(e.target.value)}
                  />
                </div>
              </div>
            ) : (
              <p className="text-xs text-[var(--sa-muted)]">
                Bi-weekly period: {formatDateInput(biweeklyPreview.start)} →{" "}
                {formatDateInput(biweeklyPreview.end)} (set as current open period)
              </p>
            )}

            <div className="rounded-lg border border-[var(--sa-border)] p-4">
              <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-[var(--sa-heading)]">
                <input
                  type="checkbox"
                  checked={includeAdmin}
                  onChange={(e) => setIncludeAdmin(e.target.checked)}
                />
                Create initial staff account for this company
              </label>
              {includeAdmin ? (
                <div className="mt-4 space-y-3">
                  <div>
                    <label className="sa-label" htmlFor="co-admin-role">
                      Role
                    </label>
                    <select
                      id="co-admin-role"
                      className="sa-input"
                      value={adminRole}
                      onChange={(e) => setAdminRole(e.target.value as InitialStaffRole)}
                    >
                      <option value="MAIN_ADMIN">Main admin</option>
                      <option value="MANAGER">Manager</option>
                    </select>
                  </div>
                  <div>
                    <label className="sa-label" htmlFor="co-admin-name">
                      Display name
                    </label>
                    <input
                      id="co-admin-name"
                      className="sa-input"
                      required={includeAdmin}
                      placeholder="Rakesh Syal"
                      value={adminName}
                      onChange={(e) => setAdminName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="sa-label" htmlFor="co-admin-email">
                      Personal email
                    </label>
                    <input
                      id="co-admin-email"
                      className="sa-input"
                      type="email"
                      required={includeAdmin}
                      placeholder="name@gmail.com"
                      value={adminContactEmail}
                      onChange={(e) => setAdminContactEmail(e.target.value)}
                    />
                    <p className="mt-1 text-xs text-[var(--sa-muted)]">
                      Welcome email with login details is sent here. Requires SMTP or Resend in server{" "}
                      <code className="sa-mono">.env</code>.
                    </p>
                    {adminContactEmail.trim() && emailValid === false ? (
                      <p className="sa-hint-error mt-1 text-xs">Enter a valid personal email address.</p>
                    ) : null}
                  </div>
                  {companyLoginPreview ? (
                    <div className="rounded-md border border-[var(--sa-border)] bg-[var(--sa-surface-raised)] px-3 py-2">
                      <p className="text-xs font-semibold text-[var(--sa-muted)]">Company login (username)</p>
                      <code className="sa-mono text-sm text-[var(--sa-accent)]">{companyLoginPreview}</code>
                    </div>
                  ) : null}
                  <div>
                    <label className="sa-label" htmlFor="co-admin-pass">
                      Temporary password
                    </label>
                    <input
                      id="co-admin-pass"
                      className="sa-input sa-mono"
                      readOnly
                      value={DEFAULT_INITIAL_STAFF_PASSWORD}
                    />
                    <p className="mt-1 text-xs text-[var(--sa-muted)]">
                      Standard onboarding password for all new staff accounts.
                    </p>
                    <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm text-[var(--sa-text)]">
                      <input
                        type="checkbox"
                        checked={forcePasswordChange}
                        onChange={(e) => setForcePasswordChange(e.target.checked)}
                      />
                      Require password change on first login
                    </label>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="flex flex-wrap justify-end gap-2 pt-2">
              <button type="button" className="sa-btn-ghost" disabled={busy} onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="sa-btn-primary" disabled={!canProceedForm || busy}>
                Review & create
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
