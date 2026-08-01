import { cookies } from "next/headers";
import * as jose from "jose";
import { prisma } from "@/lib/prisma";

const COOKIE_NAME = "hr_session";

export type SessionUser = {
  id: string;
  /** Login handle — never used for outbound email. */
  username: string;
  /** Deliverable address for notifications (stored as `email` in JWT for backward compatibility). */
  email: string;
  role: "SUPER_ADMIN" | "MAIN_ADMIN" | "MANAGER" | "SUPERVISOR" | "EMPLOYEE" | "ADMIN";
  name: string;
  /** Tenant this session is scoped to. Always null for SUPER_ADMIN. */
  companyId: string | null;
};

export async function createSession(user: SessionUser) {
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { tokenVersion: true },
  });
  const tv = dbUser?.tokenVersion ?? 0;
  const secret = new TextEncoder().encode(getSecret());
  const token = await new jose.SignJWT({
    username: user.username,
    email: user.email,
    role: user.role,
    name: user.name,
    companyId: user.companyId,
    tv,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setExpirationTime("7d")
    .setIssuedAt()
    .sign(secret);

  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function destroySession() {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

export async function getSession(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const secret = new TextEncoder().encode(getSecret());
    const { payload } = await jose.jwtVerify(token, secret);
    const id = payload.sub as string;
    const tvClaim = Number(payload.tv ?? 0);
    const dbUser = await prisma.user.findUnique({
      where: { id },
      select: { tokenVersion: true, username: true, contactEmail: true, role: true, name: true, companyId: true, deletedAt: true },
    });
    if (!dbUser) return null;
    if (dbUser.deletedAt) return null;
    if (dbUser.tokenVersion !== tvClaim) return null;
    return {
      id,
      username: dbUser.username,
      email: dbUser.contactEmail,
      role: dbUser.role as SessionUser["role"],
      name: dbUser.name,
      companyId: dbUser.companyId,
    };
  } catch {
    return null;
  }
}

function getSecret() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) {
    throw new Error("AUTH_SECRET must be set and at least 32 characters");
  }
  return s;
}
