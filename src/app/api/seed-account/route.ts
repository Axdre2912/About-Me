import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

/**
 * One-time production account setup.
 * Visit: /setup?secret=YOUR_SETUP_PASSWORD
 * Requires SETUP_EMAIL, SETUP_PASSWORD, DATABASE_URL on Vercel.
 */
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret")?.trim();
  const setupPassword = process.env.SETUP_PASSWORD?.trim();
  const authSecret = process.env.AUTH_SECRET?.trim();

  const authorized =
    !!secret &&
    ((setupPassword && secret === setupPassword) ||
      (authSecret && secret === authSecret));

  if (!setupPassword) {
    return NextResponse.json(
      {
        error: "SETUP_PASSWORD is not set on Vercel",
        hint: "Add SETUP_PASSWORD in Vercel → Environment Variables (same as your .env), then Redeploy.",
      },
      { status: 401 }
    );
  }

  if (!authorized) {
    return NextResponse.json(
      {
        error: "Unauthorized — wrong setup password",
        hint: `Use your diary password in the URL: /setup?secret=${encodeURIComponent(setupPassword)} (must match SETUP_PASSWORD on Vercel). Redeploy after changing env vars.`,
      },
      { status: 401 }
    );
  }

  const email = (process.env.SETUP_EMAIL || "you@example.com").toLowerCase();
  const password = setupPassword;
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
