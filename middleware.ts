import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import * as jose from "jose";

const COOKIE_NAME = "hr_session";

function isPublicPath(pathname: string) {
  if (pathname.startsWith("/api/auth/login") || pathname.startsWith("/api/auth/logout")) return true;
  if (pathname.startsWith("/api/public/")) return true;
  if (pathname === "/login" || pathname === "/employees") return true;
  if (pathname === "/employee-access" || pathname.startsWith("/employee-access/")) return true;
  if (pathname === "/employee" || pathname.startsWith("/employee/")) return true;
  return false;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;
  const secret = process.env.AUTH_SECRET;

  if (!token || !secret || secret.length < 32) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const key = new TextEncoder().encode(secret);
    const { payload } = await jose.jwtVerify(token, key);
    const role = payload.role as string;

    if (pathname === "/login") {
      if (role === "ADMIN") {
        return NextResponse.redirect(new URL("/admin", request.url));
      }
      return NextResponse.redirect(new URL("/employee-access", request.url));
    }

    if (pathname === "/") {
      if (role === "ADMIN") {
        return NextResponse.redirect(new URL("/admin", request.url));
      }
      return NextResponse.redirect(new URL("/employee-access", request.url));
    }

    if (pathname.startsWith("/admin") && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/employee-access", request.url));
    }

    return NextResponse.next();
  } catch {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }
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
    "/api/:path*",
  ],
};
