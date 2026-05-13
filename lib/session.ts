import { cookies } from "next/headers";
import * as jose from "jose";
import { prisma } from "@/lib/prisma";

const COOKIE_NAME = "hr_session";

export type SessionUser = {
  id: string;
  email: string;
  role: "MAIN_ADMIN" | "MANAGER" | "EMPLOYEE" | "ADMIN";
  name: string;
};

export async function createSession(user: SessionUser) {
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { tokenVersion: true },
  });
  const tv = dbUser?.tokenVersion ?? 0;
  const secret = new TextEncoder().encode(getSecret());
  const token = await new jose.SignJWT({
    email: user.email,
    role: user.role,
    name: user.name,
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
      select: { tokenVersion: true, email: true, role: true, name: true },
    });
    if (!dbUser) return null;
    if (dbUser.tokenVersion !== tvClaim) return null;
    return {
      id,
      email: dbUser.email,
      role: dbUser.role as SessionUser["role"],
      name: dbUser.name,
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
