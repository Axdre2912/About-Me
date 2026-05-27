import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { parseMoodTags } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  const mood = req.nextUrl.searchParams.get("mood")?.trim().toLowerCase();
  const rating = req.nextUrl.searchParams.get("rating");

  const entries = await prisma.diaryEntry.findMany({
    where: { userId: session.user.id },
    orderBy: { date: "desc" },
    include: { photos: { select: { id: true } } },
  });

  let filtered = entries.filter((e) => e.wordCount > 0 || e.photos.length > 0);

  if (q) {
    const lower = q.toLowerCase();
    filtered = filtered.filter(
      (e) =>
        e.content.toLowerCase().includes(lower) ||
        e.date.includes(q) ||
        parseMoodTags(e.moodTags).some((t) => t.toLowerCase().includes(lower))
    );
  }

  if (mood) {
    filtered = filtered.filter((e) =>
      parseMoodTags(e.moodTags).some((t) => t.toLowerCase() === mood)
    );
  }

  if (rating) {
    const r = parseInt(rating, 10);
    if (r >= 1 && r <= 5) {
      filtered = filtered.filter((e) => e.rating === r);
    }
  }

  const results = filtered.map((e) => ({
    id: e.id,
    date: e.date,
    rating: e.rating,
    moodTags: parseMoodTags(e.moodTags),
    wordCount: e.wordCount,
    excerpt: e.content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 120),
    photoCount: e.photos.length,
  }));

  return NextResponse.json({ results, total: results.length });
}
