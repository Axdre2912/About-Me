import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { parseMoodTags } from "@/lib/utils";
import archiver from "archiver";
import { PassThrough } from "stream";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const format = req.nextUrl.searchParams.get("format") || "json";

  const entries = await prisma.diaryEntry.findMany({
    where: { userId: session.user.id },
    include: {
      photos: { select: { id: true, filename: true, mimeType: true } },
      audios: { select: { id: true, filename: true, mimeType: true } },
    },
    orderBy: { date: "asc" },
  });

  const exportData = {
    exportedAt: new Date().toISOString(),
    entries: entries.map((e) => ({
      date: e.date,
      content: e.content,
      moodTags: parseMoodTags(e.moodTags),
      rating: e.rating,
      wordCount: e.wordCount,
      photos: e.photos.map((p) => ({
        id: p.id,
        filename: p.filename,
        mimeType: p.mimeType,
      })),
      audios: e.audios.map((a) => ({
        id: a.id,
        filename: a.filename,
        mimeType: a.mimeType,
      })),
    })),
  };

  if (format === "json") {
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="diary-export-${Date.now()}.json"`,
      },
    });
  }

  if (format === "zip") {
    const passThrough = new PassThrough();
    const archive = archiver("zip", { zlib: { level: 9 } });

    archive.pipe(passThrough);
    archive.append(JSON.stringify(exportData, null, 2), { name: "diary.json" });

    // Fetch binary data one file at a time to keep memory bounded
    for (const entry of entries) {
      for (const photo of entry.photos) {
        const row = await prisma.photo.findUnique({
          where: { id: photo.id },
          select: { data: true },
        });
        if (row?.data) {
          archive.append(Buffer.from(row.data), {
            name: `photos/${entry.date}/${photo.filename}`,
          });
        }
      }
      for (const audio of entry.audios) {
        const row = await prisma.audio.findUnique({
          where: { id: audio.id },
          select: { data: true },
        });
        if (row?.data) {
          archive.append(Buffer.from(row.data), {
            name: `audio/${entry.date}/${audio.filename}`,
          });
        }
      }
    }

    await archive.finalize();

    const webStream = new ReadableStream({
      start(controller) {
        passThrough.on("data", (chunk) => controller.enqueue(chunk));
        passThrough.on("end", () => controller.close());
        passThrough.on("error", (err) => controller.error(err));
      },
    });

    return new NextResponse(webStream, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="diary-export-${Date.now()}.zip"`,
      },
    });
  }

  return NextResponse.json({ error: "format must be json or zip" }, { status: 400 });
}
