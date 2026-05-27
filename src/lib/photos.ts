import fs from "fs/promises";
import path from "path";
import sharp from "sharp";
import { prisma } from "./prisma";

const UPLOAD_ROOT = path.join(process.cwd(), "uploads");

export function getPhotoPath(userId: string, entryId: string, filename: string) {
  return path.join(UPLOAD_ROOT, userId, entryId, filename);
}

export async function ensureUploadDir(userId: string, entryId: string) {
  const dir = path.join(UPLOAD_ROOT, userId, entryId);
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

/** Resize and compress uploaded images for efficient storage */
export async function processAndSaveImage(
  buffer: Buffer,
  destPath: string,
  mimeType: string
): Promise<{ width: number; height: number; sizeBytes: number }> {
  const pipeline = sharp(buffer).rotate();

  if (mimeType === "image/png") {
    await pipeline
      .resize(1920, 1920, { fit: "inside", withoutEnlargement: true })
      .png({ quality: 80, compressionLevel: 9 })
      .toFile(destPath);
  } else {
    await pipeline
      .resize(1920, 1920, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 82, mozjpeg: true })
      .toFile(destPath.replace(/\.[^.]+$/, ".jpg"));
  }

  const finalPath = mimeType === "image/png" ? destPath : destPath.replace(/\.[^.]+$/, ".jpg");
  const meta = await sharp(finalPath).metadata();
  const stat = await fs.stat(finalPath);

  return {
    width: meta.width ?? 0,
    height: meta.height ?? 0,
    sizeBytes: stat.size,
  };
}

export async function deletePhotoFile(userId: string, entryId: string, filename: string) {
  try {
    await fs.unlink(getPhotoPath(userId, entryId, filename));
  } catch {
    // file may already be gone
  }
}

export async function getPhotoForUser(photoId: string, userId: string) {
  const photo = await prisma.photo.findFirst({
    where: { id: photoId, entry: { userId } },
    include: { entry: true },
  });
  if (!photo) return null;

  const filePath = getPhotoPath(userId, photo.entryId, photo.filename);
  try {
    const data = await fs.readFile(filePath);
    return { data, mimeType: photo.mimeType };
  } catch {
    return null;
  }
}
