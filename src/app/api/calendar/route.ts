import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/** Returns entry summaries for a given month: YYYY-MM */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const month = req.nextUrl.searchParams.get("month");
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json({ error: "month required (YYYY-MM)" }, { status: 400 });
  }

  const entries = await prisma.diaryEntry.findMany({
    where: {
      userId: session.user.id,
      date: { startsWith: month },
    },
    select: {
      date: true,
      rating: true,
      moodTags: true,
      wordCount: true,
      _count: { select: { photos: true } },
    },
  });

  const days = entries.map((e) => ({
    date: e.date,
    rating: e.rating,
    hasEntry: e.wordCount > 0 || e._count.photos > 0,
    photoCount: e._count.photos,
  }));

  return NextResponse.json({ month, days });
}
