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

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Never require login for one-time setup (API + friendly page)
  if (
    pathname.startsWith("/api/seed-account") ||
    pathname.startsWith("/api/health") ||
    pathname === "/setup"
  ) {
    return NextResponse.next();
  }

  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
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
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/seed-account|api/health).*)"],
};
