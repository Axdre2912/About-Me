import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getOrCreateEntry } from "@/lib/entries";
import { MAX_AUDIO_PER_ENTRY, MAX_AUDIO_SIZE, audioExtension } from "@/lib/audio";
import { randomUUID } from "crypto";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { date } = await params;
  const entry = await getOrCreateEntry(session.user.id, date);

  const audioCount = await prisma.audio.count({ where: { entryId: entry.id } });
  if (audioCount >= MAX_AUDIO_PER_ENTRY) {
    return NextResponse.json(
      { error: `Maximum ${MAX_AUDIO_PER_ENTRY} audio clips per entry` },
      { status: 400 }
    );
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (file.size > MAX_AUDIO_SIZE) {
    return NextResponse.json(
      { error: `Audio too large (max ${Math.round(MAX_AUDIO_SIZE / 1024 / 1024)}MB)` },
      { status: 400 }
    );
  }

  const ext = audioExtension(file.type);
  if (!ext) {
    return NextResponse.json(
      { error: "Unsupported audio type. Use MP3, M4A, AAC, WAV, OGG, WebM, or FLAC." },
      { status: 400 }
    );
  }

  const data = Buffer.from(await file.arrayBuffer());
  const originalName = file.name?.trim() || "";
  const filename = originalName || `${randomUUID()}${ext}`;

  const audio = await prisma.audio.create({
    data: {
      entryId: entry.id,
      filename,
      mimeType: file.type.toLowerCase().split(";")[0].trim(),
      sizeBytes: data.length,
      sortOrder: audioCount,
      data: new Uint8Array(data),
    },
    select: { id: true, filename: true, mimeType: true, sizeBytes: true, sortOrder: true },
  });

  return NextResponse.json({
    id: audio.id,
    url: `/api/audio/${audio.id}`,
    filename: audio.filename,
    mimeType: audio.mimeType,
    sizeBytes: audio.sizeBytes,
    sortOrder: audio.sortOrder,
  });
}
