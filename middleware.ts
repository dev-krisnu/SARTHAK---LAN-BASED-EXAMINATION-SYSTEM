import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  ADMIN_CREDENTIALS,
  USER_CREDENTIALS,
  validateCredentials,
} from "@/lib/credentials";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

export const HARDCODED_ADMIN = {
  username: ADMIN_CREDENTIALS.username,
  password: ADMIN_CREDENTIALS.password,
};

export const HARDCODED_USERS = USER_CREDENTIALS.map((user) => ({
  username: user.username,
  password: user.password,
}));

const PUBLIC_PATHS = ["/signin", "/signup"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const isPublic = PUBLIC_PATHS.includes(pathname) || pathname === "/";
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (pathname === "/") {
    if (session) {
      const destination =
        session.role === "admin" ? "/admin/dashboard" : "/dashboard";
      return NextResponse.redirect(new URL(destination, request.url));
    }
    return NextResponse.redirect(new URL("/signin", request.url));
  }

  if (isPublic) {
    if (session && (pathname === "/signin" || pathname === "/signup")) {
      const destination =
        session.role === "admin" ? "/admin/dashboard" : "/dashboard";
      return NextResponse.redirect(new URL(destination, request.url));
    }
    return NextResponse.next();
  }

  if (!session) {
    const signInUrl = new URL("/signin", request.url);
    signInUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(signInUrl);
  }

  if (pathname.startsWith("/admin") && session.role !== "admin") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (
    (pathname.startsWith("/dashboard") || pathname.startsWith("/exam")) &&
    session.role === "admin"
  ) {
    return NextResponse.redirect(new URL("/admin/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\..*).*)"],
};

export function authenticateInMiddleware(username: string, password: string) {
  return validateCredentials(username, password);
}
