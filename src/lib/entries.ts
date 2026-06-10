import { prisma } from "./prisma";
import { countWords, parseMoodTags } from "./utils";

export type AudioDTO = {
  id: string;
  url: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  sortOrder: number;
};

export type EntryDTO = {
  id: string;
  date: string;
  content: string;
  moodTags: string[];
  rating: number | null;
  wordCount: number;
  updatedAt: string;
  photos: { id: string; url: string; sortOrder: number }[];
  audios: AudioDTO[];
};

// Metadata only — never pull binary `data` columns when loading entries
export const entryMediaInclude = {
  photos: { select: { id: true, sortOrder: true } },
  audios: {
    select: {
      id: true,
      filename: true,
      mimeType: true,
      sizeBytes: true,
      sortOrder: true,
    },
  },
} as const;

export function serializeEntry(
  entry: {
    id: string;
    date: string;
    content: string;
    moodTags: string;
    rating: number | null;
    wordCount: number;
    updatedAt: Date;
    photos: { id: string; sortOrder: number }[];
    audios: { id: string; filename: string; mimeType: string; sizeBytes: number; sortOrder: number }[];
  }
): EntryDTO {
  return {
    id: entry.id,
    date: entry.date,
    content: entry.content,
    moodTags: parseMoodTags(entry.moodTags),
    rating: entry.rating,
    wordCount: entry.wordCount,
    updatedAt: entry.updatedAt.toISOString(),
    photos: entry.photos
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((p) => ({
        id: p.id,
        url: `/api/photos/${p.id}`,
        sortOrder: p.sortOrder,
      })),
    audios: entry.audios
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((a) => ({
        id: a.id,
        url: `/api/audio/${a.id}`,
        filename: a.filename,
        mimeType: a.mimeType,
        sizeBytes: a.sizeBytes,
        sortOrder: a.sortOrder,
      })),
  };
}

export async function getOrCreateEntry(userId: string, date: string) {
  let entry = await prisma.diaryEntry.findUnique({
    where: { userId_date: { userId, date } },
    include: entryMediaInclude,
  });

  if (!entry) {
    entry = await prisma.diaryEntry.create({
      data: { userId, date, content: "", moodTags: "[]" },
      include: entryMediaInclude,
    });
  }

  return serializeEntry(entry);
}

export async function updateEntry(
  userId: string,
  date: string,
  data: {
    content?: string;
    moodTags?: string[];
    rating?: number | null;
  }
) {
  const existing = await prisma.diaryEntry.findUnique({
    where: { userId_date: { userId, date } },
  });

  const content = data.content ?? existing?.content ?? "";
  const moodTags = data.moodTags
    ? JSON.stringify(data.moodTags)
    : existing?.moodTags ?? "[]";
  const rating = data.rating !== undefined ? data.rating : existing?.rating ?? null;
  const wordCount = countWords(content);

  const entry = await prisma.diaryEntry.upsert({
    where: { userId_date: { userId, date } },
    create: {
      userId,
      date,
      content,
      moodTags,
      rating,
      wordCount,
    },
    update: { content, moodTags, rating, wordCount },
    include: entryMediaInclude,
  });

  return serializeEntry(entry);
}
