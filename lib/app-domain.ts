/**
 * DISPLAY ONLY — tenant subdomain labels for super-admin UI, modals, and copy text.
 *
 * Uses NEXT_PUBLIC_APP_DOMAIN in production (e.g. "payrun.app").
 * In local dev, shows `{slug}.{tld}` using the company website TLD (e.g. unison.ca) or `.com` by default.
 * Do NOT use for request routing — proxy.ts resolves tenants from the real Host header + ROOT_DOMAIN.
 */

import { normalizeWebsiteUrl } from "@/lib/website-url";

const DEFAULT_DISPLAY_TLD = "com";

function isLocalDevAppDomain(domain: string): boolean {
  const d = domain.toLowerCase();
  return d === "localhost" || d.startsWith("localhost:") || d.includes("127.0.0.1");
}

/** Full host suffix after the tenant slug from env (may be localhost:3000 in dev). */
export function getAppDomain(): string {
  const configured = process.env.NEXT_PUBLIC_APP_DOMAIN?.trim();
  if (configured) return configured;

  const legacyRoot = process.env.NEXT_PUBLIC_ROOT_DOMAIN?.trim();
  if (legacyRoot && legacyRoot !== "localhost") return legacyRoot;

  return "localhost:3000";
}

/** TLD from company website hostname (e.g. https://unisonsecurity.ca → "ca"). */
export function extractTldFromWebsite(websiteUrl: string | null | undefined): string | null {
  if (!websiteUrl?.trim()) return null;
  try {
    const host = new URL(normalizeWebsiteUrl(websiteUrl)).hostname.toLowerCase().replace(/^www\./, "");
    const parts = host.split(".").filter(Boolean);
    if (parts.length < 2) return null;
    const tld = parts[parts.length - 1]!;
    if (!/^[a-z]{2,24}$/.test(tld)) return null;
    return tld;
  } catch {
    return null;
  }
}

/**
 * Domain suffix for UI display. Production env → full app domain; local dev → website TLD or .com.
 */
export function getDisplayDomainSuffix(websiteUrl?: string | null): string {
  const configured = getAppDomain();
  if (!isLocalDevAppDomain(configured)) return configured;

  return extractTldFromWebsite(websiteUrl) ?? DEFAULT_DISPLAY_TLD;
}

/** Human-readable tenant host: `{slug}.{domain}` (no protocol). */
export function formatCompanySubdomain(slug: string, websiteUrl?: string | null): string {
  const normalized = slug.trim().toLowerCase();
  const suffix = getDisplayDomainSuffix(websiteUrl);
  if (!normalized) return suffix;
  return `${normalized}.${suffix}`;
}

/** Clickable tenant URL with protocol. */
export function formatCompanySubdomainUrl(slug: string, websiteUrl?: string | null): string {
  const host = formatCompanySubdomain(slug, websiteUrl);
  const suffix = getDisplayDomainSuffix(websiteUrl);
  const protocol = isLocalDevAppDomain(getAppDomain()) && !suffix.includes(":") ? "https" : (
    getAppDomain().startsWith("localhost") ? "http" : "https"
  );
  return `${protocol}://${host}`;
}

/** Admin sign-in URL for staff welcome emails — production link, not localhost tenant URLs. */
export function staffWelcomeSignInUrl(): string {
  const configured =
    process.env.NEXT_PUBLIC_STAFF_SIGN_IN_URL?.trim() ??
    process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) {
    const normalized = configured.replace(/\/+$/, "");
    return normalized.endsWith("/login") ? normalized : `${normalized}/login`;
  }
  return "https://payroll-manager-lake.vercel.app/login";
}

/** Tenant login URL for emails — dev uses `{slug}.{NEXT_PUBLIC_APP_DOMAIN}/login`. */
export function formatTenantLoginUrl(slug: string, websiteUrl?: string | null): string {
  const appDomain = getAppDomain();
  const normalized = slug.trim().toLowerCase();
  if (isLocalDevAppDomain(appDomain)) {
    return `http://${normalized}.${appDomain}/login`;
  }
  return `${formatCompanySubdomainUrl(slug, websiteUrl)}/login`;
}
