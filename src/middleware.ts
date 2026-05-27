import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const publicPaths = [
  "/login",
  "/setup",
  "/api/auth",
  "/api/webauthn/login",
  "/api/seed-account",
];

async function readSessionToken(req: NextRequest) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) return null;

  const isHttps = req.nextUrl.protocol === "https:";

  // Auth.js v5 production cookie name
  let token = await getToken({
    req,
    secret,
    secureCookie: isHttps,
    cookieName: isHttps ? "__Secure-authjs.session-token" : "authjs.session-token",
  });

  // Fallback for older cookie name
  if (!token) {
    token = await getToken({
      req,
      secret,
      secureCookie: isHttps,
      cookieName: isHttps ? "__Secure-next-auth.session-token" : "next-auth.session-token",
    });
  }

  return token;
}

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith("/api/seed-account") ||
    pathname.startsWith("/api/health") ||
    pathname.startsWith("/api/verify-password") ||
    pathname === "/setup"
  ) {
    return NextResponse.next();
  }

  const token = await readSessionToken(req);
  const isPublic = publicPaths.some((p) => pathname.startsWith(p));

  if (!token && !isPublic) {
    const login = new URL("/login", req.nextUrl.origin);
    login.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(login);
  }

  if (token && pathname === "/login") {
    return NextResponse.redirect(new URL("/", req.nextUrl.origin));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/seed-account|api/health|api/verify-password).*)",
  ],
};
