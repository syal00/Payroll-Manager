import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import * as jose from "jose";
import { prisma } from "@/lib/prisma";
import { isStaffRole, isSuperAdminRole, isSupervisorRole } from "@/lib/roles";
import { trackApiRequestFireAndForget } from "@/lib/usage-tracker";

const COOKIE_NAME = "hr_session";

/** Subdomains that never resolve to a tenant (marketing/app shell, generic www). */
const RESERVED_SUBDOMAINS = new Set(["app", "www"]);

/** Base domain requests are served on; a single leading label in front of this is the tenant slug. */
const ROOT_DOMAIN = process.env.ROOT_DOMAIN ?? "localhost";

type ResolvedCompany = { id: string; name: string; logoUrl: string | null };

/**
 * Tiny size-capped, TTL'd company-by-slug cache. Proxy (Next 16's renamed Middleware) runs on
 * every matched request and defaults to the Node.js runtime, so a Prisma call is affordable, but
 * still worth avoiding on every hit — this is a lightweight LRU-ish approximation, not a real one.
 */
const COMPANY_CACHE_TTL_MS = 30_000;
const COMPANY_CACHE_MAX_ENTRIES = 200;
const companyCache = new Map<string, { company: ResolvedCompany | null; expiresAt: number }>();

function extractSubdomain(host: string | null): string | null {
  if (!host) return null;
  const hostname = host.split(":")[0]!.toLowerCase();
  if (hostname === ROOT_DOMAIN) return null;
  const suffix = `.${ROOT_DOMAIN}`;
  if (!hostname.endsWith(suffix)) return null;
  const sub = hostname.slice(0, -suffix.length);
  if (!sub || sub.includes(".")) return null; // only a single-level subdomain is a tenant slug
  return sub;
}

async function resolveCompanyBySlug(slug: string): Promise<ResolvedCompany | null> {
  const now = Date.now();
  const cached = companyCache.get(slug);
  if (cached && cached.expiresAt > now) {
    // refresh recency (Map preserves insertion order; re-inserting moves it to the end)
    companyCache.delete(slug);
    companyCache.set(slug, cached);
    return cached.company;
  }

  const row = await prisma.company.findUnique({
    where: { slug },
    select: { id: true, name: true, logoUrl: true },
  });
  const company = row ?? null;

  if (companyCache.size >= COMPANY_CACHE_MAX_ENTRIES) {
    const oldestKey = companyCache.keys().next().value;
    if (oldestKey !== undefined) companyCache.delete(oldestKey);
  }
  companyCache.set(slug, { company, expiresAt: now + COMPANY_CACHE_TTL_MS });
  return company;
}

function isPublicPath(pathname: string) {
  if (pathname.startsWith("/api/auth/login") || pathname.startsWith("/api/auth/logout")) return true;
  if (pathname.startsWith("/api/auth/forgot")) return true;
  if (pathname.startsWith("/api/public/")) return true;
  if (pathname === "/login" || pathname === "/admin/login" || pathname === "/employees") return true;
  if (pathname === "/employee-access" || pathname.startsWith("/employee-access/")) return true;
  if (pathname === "/employee" || pathname.startsWith("/employee/")) return true;
  return false;
}

function withPathname(response: NextResponse, pathname: string) {
  response.headers.set("x-pathname", pathname);
  return response;
}

function withCompanyHeaders(response: NextResponse, company: ResolvedCompany | null) {
  if (company) {
    response.headers.set("x-company-id", company.id);
    response.headers.set("x-company-name", company.name);
    if (company.logoUrl) response.headers.set("x-company-logo", company.logoUrl);
  }
  return response;
}

/** Clears a session that no longer matches the resolved tenant, forcing re-login rather than trusting either source. */
function clearSessionResponse(request: NextRequest, pathname: string) {
  const response = pathname.startsWith("/api/")
    ? NextResponse.json({ error: "Session no longer valid for this workspace." }, { status: 401 })
    : NextResponse.redirect(new URL("/login", request.url));
  response.cookies.delete(COOKIE_NAME);
  return response;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/")) {
    trackApiRequestFireAndForget();
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;
  const secret = process.env.AUTH_SECRET;

  /* Marketing home at `/` is always the landing page (no auto-redirect when logged in). */
  if (pathname === "/") {
    return NextResponse.next();
  }

  // --- Multi-tenant subdomain resolution (runs before any role-based routing below) ---
  const subdomain = extractSubdomain(request.headers.get("host"));
  let company: ResolvedCompany | null = null;
  if (subdomain && !RESERVED_SUBDOMAINS.has(subdomain)) {
    company = await resolveCompanyBySlug(subdomain);
    if (!company) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Unknown company." }, { status: 404 });
      }
      return NextResponse.redirect(new URL(`/company-not-found?slug=${encodeURIComponent(subdomain)}`, request.url));
    }
  }

  let payload: jose.JWTPayload | null = null;
  if (token && secret && secret.length >= 32) {
    try {
      const key = new TextEncoder().encode(secret);
      payload = (await jose.jwtVerify(token, key)).payload;
    } catch {
      payload = null;
    }
  }

  if (payload && company) {
    const sessionRole = payload.role as string;
    const sessionCompanyId = (payload.companyId as string | null | undefined) ?? null;
    if (!isSuperAdminRole(sessionRole) && sessionCompanyId !== company.id) {
      return clearSessionResponse(request, pathname);
    }
  }

  if (isPublicPath(pathname)) {
    return withCompanyHeaders(withPathname(NextResponse.next(), pathname), company);
  }

  if (!token || !secret || secret.length < 32) {
    if (pathname.startsWith("/api/")) {
      if (!secret || secret.length < 32) {
        console.error("FATAL: AUTH_SECRET not set or too short");
        return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
      }
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (!payload) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const role = payload.role as string;

  if (pathname === "/login" || pathname === "/admin/login") {
    // SUPER_ADMIN's dashboard is the cross-company list, never the single-tenant /admin app —
    // checked first since isStaffRole(role) is also true for SUPER_ADMIN.
    if (isSuperAdminRole(role)) {
      return NextResponse.redirect(new URL("/super-admin/companies", request.url));
    }
    if (isStaffRole(role) || isSupervisorRole(role)) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return NextResponse.redirect(new URL("/employee-access", request.url));
  }

  // The legacy /admin app scopes queries via session.companyId, which is always null for
  // SUPER_ADMIN — reaching it would mix every tenant's rows together (the bug the /super-admin
  // route group exists to prevent). Keep the two surfaces mutually exclusive.
  if (pathname.startsWith("/admin") && isSuperAdminRole(role)) {
    return NextResponse.redirect(new URL("/super-admin/companies", request.url));
  }

  // Tenant-scoped APIs also use session.companyId — block SUPER_ADMIN from them so mixed rows
  // can't leak via direct fetch. Platform operators use /api/super-admin/* only.
  if (
    isSuperAdminRole(role) &&
    pathname.startsWith("/api/") &&
    !pathname.startsWith("/api/super-admin/") &&
    !pathname.startsWith("/api/auth/")
  ) {
    return NextResponse.json(
      { error: "Super admin must use /api/super-admin/companies routes" },
      { status: 403 }
    );
  }

  if (pathname.startsWith("/admin") && !isStaffRole(role) && !isSupervisorRole(role)) {
    return NextResponse.redirect(new URL("/employee-access", request.url));
  }

  if (pathname.startsWith("/super-admin") && !isSuperAdminRole(role)) {
    if (isStaffRole(role) || isSupervisorRole(role)) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return NextResponse.redirect(new URL("/employee-access", request.url));
  }

  return withCompanyHeaders(withPathname(NextResponse.next(), pathname), company);
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/employees",
    "/employee-access",
    "/employee-access/:path*",
    "/employee",
    "/employee/:path*",
    "/admin/:path*",
    "/super-admin/:path*",
    "/api/:path*",
  ],
};
