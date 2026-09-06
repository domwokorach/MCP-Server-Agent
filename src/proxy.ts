import { NextResponse, type NextRequest } from "next/server";
import { validateSessionToken } from "@/lib/auth/session";

// Next.js 16 renamed middleware.ts to proxy.ts. This is the primary auth gate —
// it runs before rendering, so it can send a real HTTP redirect. Layout-level
// checks alone are unreliable here: once a route starts streaming, redirect()
// can only emit a client-side redirect, which would briefly leak protected
// markup to an unauthenticated client.
const PROTECTED_PREFIXES = ["/dashboard", "/agent-tasks", "/settings"];
const AUTH_PAGES = ["/login", "/register", "/forgot-password", "/reset-password"];
const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "session";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await validateSessionToken(token) : null;

  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  const isAuthPage = AUTH_PAGES.some((page) => pathname === page);

  if (isProtected && !session) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  if (isAuthPage && session) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/agent-tasks/:path*",
    "/settings/:path*",
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
  ],
};
