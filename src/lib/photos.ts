import sharp from "sharp";
import { prisma } from "./prisma";

/**
 * Resize and compress an uploaded image. Returns the processed bytes so they
 * can be stored in the database (persistent across serverless deploys).
 */
export async function processImage(
  buffer: Buffer,
  mimeType: string
): Promise<{ data: Buffer; mimeType: string; ext: string; width: number; height: number; sizeBytes: number }> {
  const pipeline = sharp(buffer)
    .rotate()
    .resize(1920, 1920, { fit: "inside", withoutEnlargement: true });

  let data: Buffer;
  let outMime: string;
  let ext: string;

  if (mimeType === "image/png") {
    data = await pipeline.png({ quality: 80, compressionLevel: 9 }).toBuffer();
    outMime = "image/png";
    ext = ".png";
  } else {
    data = await pipeline.jpeg({ quality: 82, mozjpeg: true }).toBuffer();
    outMime = "image/jpeg";
    ext = ".jpg";
  }

  const meta = await sharp(data).metadata();

  return {
    data,
    mimeType: outMime,
    ext,
    width: meta.width ?? 0,
    height: meta.height ?? 0,
    sizeBytes: data.length,
  };
}

export async function getPhotoForUser(photoId: string, userId: string) {
  const photo = await prisma.photo.findFirst({
    where: { id: photoId, entry: { userId } },
    select: { data: true, mimeType: true },
  });
  if (!photo?.data) return null;
  return { data: Buffer.from(photo.data), mimeType: photo.mimeType };
}
