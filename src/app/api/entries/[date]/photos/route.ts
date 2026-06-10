import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getOrCreateEntry } from "@/lib/entries";
import { processImage } from "@/lib/photos";
import { randomUUID } from "crypto";

const MAX_PHOTOS = 12;
const MAX_SIZE = 10 * 1024 * 1024;

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

  const photoCount = await prisma.photo.count({ where: { entryId: entry.id } });
  if (photoCount >= MAX_PHOTOS) {
    return NextResponse.json({ error: `Maximum ${MAX_PHOTOS} photos per entry` }, { status: 400 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 });
  }

  const allowed = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
  const mimeType = file.type;
  if (!allowed.includes(mimeType)) {
    return NextResponse.json({ error: "Invalid image type" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const processed = await processImage(buffer, mimeType);

  const photo = await prisma.photo.create({
    data: {
      entryId: entry.id,
      filename: `${randomUUID()}${processed.ext}`,
      mimeType: processed.mimeType,
      width: processed.width,
      height: processed.height,
      sizeBytes: processed.sizeBytes,
      sortOrder: photoCount,
      data: new Uint8Array(processed.data),
    },
    select: { id: true, sortOrder: true },
  });

  return NextResponse.json({
    id: photo.id,
    url: `/api/photos/${photo.id}`,
    sortOrder: photo.sortOrder,
  });
}
