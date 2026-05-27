import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** Quick check that Vercel can reach the database. Visit /api/health */
export async function GET() {
  try {
    const count = await prisma.user.count();
    return NextResponse.json({
      ok: true,
      userCount: count,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      hasAuthSecret: !!process.env.AUTH_SECRET,
      authUrl: process.env.AUTH_URL ?? "(not set)",
      nextAuthUrl: process.env.NEXTAUTH_URL ?? "(not set)",
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
