import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

/**
 * Debug: confirms email/password match the database (no session).
 * POST { "email", "password" } — only when ?key=SETUP_PASSWORD
 */
export async function POST(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");
  if (!key || key !== process.env.SETUP_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { email, password } = await req.json();
  if (!email || !password) {
    return NextResponse.json({ error: "email and password required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email: String(email).toLowerCase() },
  });

  if (!user) {
    return NextResponse.json({ valid: false, reason: "user not found" });
  }

  const valid = await bcrypt.compare(String(password), user.password);
  return NextResponse.json({ valid, email: user.email });
}
