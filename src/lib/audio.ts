import { prisma } from "./prisma";

export const MAX_AUDIO_PER_ENTRY = 6;
// Vercel serverless functions reject request bodies over ~4.5MB,
// so keep the per-file cap just under that.
export const MAX_AUDIO_SIZE = 4 * 1024 * 1024;

const EXTENSIONS: Record<string, string> = {
  "audio/mpeg": ".mp3",
  "audio/mp3": ".mp3",
  "audio/mp4": ".m4a",
  "audio/x-m4a": ".m4a",
  "audio/m4a": ".m4a",
  "audio/aac": ".aac",
  "audio/wav": ".wav",
  "audio/x-wav": ".wav",
  "audio/wave": ".wav",
  "audio/ogg": ".ogg",
  "audio/webm": ".webm",
  "audio/flac": ".flac",
  "audio/x-flac": ".flac",
};

export function audioExtension(mimeType: string): string | null {
  return EXTENSIONS[mimeType.toLowerCase().split(";")[0].trim()] ?? null;
}

export async function getAudioForUser(audioId: string, userId: string) {
  const audio = await prisma.audio.findFirst({
    where: { id: audioId, entry: { userId } },
    select: { data: true, mimeType: true },
  });
  if (!audio?.data) return null;
  return { data: Buffer.from(audio.data), mimeType: audio.mimeType };
}
