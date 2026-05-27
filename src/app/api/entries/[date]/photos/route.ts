import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getOrCreateEntry } from "@/lib/entries";
import {
  ensureUploadDir,
  processAndSaveImage,
  getPhotoPath,
} from "@/lib/photos";
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

  const dbEntry = await prisma.diaryEntry.findUnique({
    where: { id: entry.id },
    include: { photos: true },
  });
  if (!dbEntry) {
    return NextResponse.json({ error: "Entry not found" }, { status: 404 });
  }

  if (dbEntry.photos.length >= MAX_PHOTOS) {
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
  await ensureUploadDir(session.user.id, dbEntry.id);

  const ext = mimeType === "image/png" ? ".png" : ".jpg";
  const filename = `${randomUUID()}${ext}`;
  const destPath = getPhotoPath(session.user.id, dbEntry.id, filename);

  const meta = await processAndSaveImage(buffer, destPath, mimeType);
  const finalFilename =
    mimeType === "image/png" ? filename : filename.replace(/\.[^.]+$/, ".jpg");
  const finalMime = mimeType === "image/png" ? "image/png" : "image/jpeg";

  const sortOrder = dbEntry.photos.length;
  const photo = await prisma.photo.create({
    data: {
      entryId: dbEntry.id,
      filename: finalFilename,
      mimeType: finalMime,
      width: meta.width,
      height: meta.height,
      sizeBytes: meta.sizeBytes,
      sortOrder,
    },
  });

  return NextResponse.json({
    id: photo.id,
    url: `/api/photos/${photo.id}`,
    sortOrder: photo.sortOrder,
  });
}
