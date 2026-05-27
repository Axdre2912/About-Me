import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

/**
 * One-time production account setup.
 * Visit: /api/seed-account?secret=YOUR_AUTH_SECRET
 * Requires SETUP_EMAIL and SETUP_PASSWORD on Vercel.
 * Remove or disable after use.
 */
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  const expected = process.env.AUTH_SECRET;

  if (!expected || secret !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const email = (process.env.SETUP_EMAIL || "you@example.com").toLowerCase();
  const password = process.env.SETUP_PASSWORD || "ChangeMe123!";
  const name = process.env.SETUP_NAME || "Diary Owner";

  try {
    const hash = await bcrypt.hash(password, 12);
    const user = await prisma.user.upsert({
      where: { email },
      update: { password: hash, name },
      create: { email, password: hash, name },
    });

    const count = await prisma.user.count();

    return NextResponse.json({
      ok: true,
      message: "Account created/updated. Try signing in now.",
      email: user.email,
      userCount: count,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Database error";
    return NextResponse.json(
      {
        ok: false,
        error: message,
        hint: "Check DATABASE_URL on Vercel matches Neon (pooled URL, current password).",
      },
      { status: 500 }
    );
  }
}
