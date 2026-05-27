import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { parseMoodTags } from "@/lib/utils";
import { format } from "date-fns";

/** Past entries matching today's month-day from previous years */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dateParam = req.nextUrl.searchParams.get("date");
  const ref = dateParam ? new Date(dateParam + "T12:00:00") : new Date();
  const monthDay = format(ref, "MM-dd");
  const currentYear = format(ref, "yyyy");

  const entries = await prisma.diaryEntry.findMany({
    where: {
      userId: session.user.id,
      date: { endsWith: `-${monthDay}` },
      NOT: { date: { startsWith: currentYear } },
    },
    orderBy: { date: "desc" },
    include: { photos: { select: { id: true } } },
  });

  const results = entries
    .filter((e) => e.wordCount > 0 || e.photos.length > 0)
    .map((e) => ({
      date: e.date,
      year: e.date.slice(0, 4),
      rating: e.rating,
      moodTags: parseMoodTags(e.moodTags),
      excerpt: e.content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 160),
    }));

  return NextResponse.json({ monthDay, results });
}
