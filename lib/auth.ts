import { getSession, type SessionUser } from "@/lib/session";
import { Role } from "@/lib/enums";

/** Returns the signed-in user from the session cookie, or null. */
export async function verifyAuth(): Promise<SessionUser | null> {
  return getSession();
}

export async function verifyAdmin(): Promise<SessionUser | null> {
  const u = await getSession();
  if (!u || u.role !== Role.ADMIN) return null;
  return u;
}
