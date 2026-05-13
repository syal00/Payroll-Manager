import { NextResponse } from "next/server";
import * as jose from "jose";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { destroySession } from "@/lib/session";

const COOKIE_NAME = "hr_session";

export async function POST() {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  const secret = process.env.AUTH_SECRET;
  if (token && secret && secret.length >= 32) {
    try {
      const { payload } = await jose.jwtVerify(token, new TextEncoder().encode(secret));
      const id = payload.sub as string;
      await prisma.user.update({
        where: { id },
        data: { tokenVersion: { increment: 1 } },
      });
    } catch {
      /* invalid or expired token — still clear cookie */
    }
  }
  await destroySession();
  return NextResponse.json({ ok: true });
}
