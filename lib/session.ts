import { cookies } from "next/headers";
import * as jose from "jose";

const COOKIE_NAME = "hr_session";

export type SessionUser = {
  id: string;
  email: string;
  role: "ADMIN" | "EMPLOYEE";
  name: string;
};

export async function createSession(user: SessionUser) {
  const secret = new TextEncoder().encode(getSecret());
  const token = await new jose.SignJWT({
    email: user.email,
    role: user.role,
    name: user.name,
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
    return {
      id: payload.sub as string,
      email: payload.email as string,
      role: payload.role as "ADMIN" | "EMPLOYEE",
      name: payload.name as string,
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
