import { getSession, type SessionUser } from "@/lib/session";
import { Role } from "@/lib/enums";

/**
 * Authenticated session for API routes. Prefer `requireAdmin` / `requireSession` / `requireEmployee`
 * for consistent 401/403 handling; `verifyAuth` in `lib/auth.ts` wraps the same session lookup.
 */

export async function requireSession(): Promise<SessionUser> {
  const s = await getSession();
  if (!s) {
    const err = new Error("Unauthorized");
    (err as Error & { status: number }).status = 401;
    throw err;
  }
  return s;
}

export async function requireAdmin(): Promise<SessionUser> {
  const s = await requireSession();
  if (s.role !== Role.ADMIN) {
    const err = new Error("Forbidden");
    (err as Error & { status: number }).status = 403;
    throw err;
  }
  return s;
}

export async function requireEmployee(): Promise<SessionUser> {
  const s = await requireSession();
  if (s.role !== Role.EMPLOYEE) {
    const err = new Error("Forbidden");
    (err as Error & { status: number }).status = 403;
    throw err;
  }
  return s;
}
