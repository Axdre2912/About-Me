import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { parseMoodTags } from "@/lib/utils";
import { format, subMonths, startOfMonth } from "date-fns";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const entries = await prisma.diaryEntry.findMany({
    where: { userId: session.user.id },
    include: { photos: true },
  });

  const active = entries.filter((e) => e.wordCount > 0 || e.photos.length > 0);

  const moodCounts: Record<string, number> = {};
  let ratingSum = 0;
  let ratingCount = 0;

  for (const e of active) {
    for (const mood of parseMoodTags(e.moodTags)) {
      moodCounts[mood] = (moodCounts[mood] || 0) + 1;
    }
    if (e.rating) {
      ratingSum += e.rating;
      ratingCount++;
    }
  }

  const moodTrends = Object.entries(moodCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([mood, count]) => ({ mood, count }));

  const monthlyMap = new Map<
    string,
    { ratings: number[]; photos: number; entries: number }
  >();

  for (let i = 0; i < 12; i++) {
    const m = format(subMonths(startOfMonth(new Date()), i), "yyyy-MM");
    monthlyMap.set(m, { ratings: [], photos: 0, entries: 0 });
  }

  for (const e of active) {
    const month = e.date.slice(0, 7);
    if (!monthlyMap.has(month)) {
      monthlyMap.set(month, { ratings: [], photos: 0, entries: 0 });
    }
    const bucket = monthlyMap.get(month)!;
    bucket.entries++;
    bucket.photos += e.photos.length;
    if (e.rating) bucket.ratings.push(e.rating);
  }

  const monthlyStats = Array.from(monthlyMap.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 12)
    .map(([month, data]) => ({
      month,
      entryCount: data.entries,
      photoCount: data.photos,
      avgRating:
        data.ratings.length > 0
          ? Math.round((data.ratings.reduce((a, b) => a + b, 0) / data.ratings.length) * 10) / 10
          : null,
    }));

  return NextResponse.json({
    totalEntries: active.length,
    totalPhotos: active.reduce((s, e) => s + e.photos.length, 0),
    overallAvgRating:
      ratingCount > 0 ? Math.round((ratingSum / ratingCount) * 10) / 10 : null,
    moodTrends,
    monthlyStats,
  });
}
