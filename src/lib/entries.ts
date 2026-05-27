import { prisma } from "./prisma";
import { countWords, parseMoodTags } from "./utils";

export type EntryDTO = {
  id: string;
  date: string;
  content: string;
  moodTags: string[];
  rating: number | null;
  wordCount: number;
  updatedAt: string;
  photos: { id: string; url: string; sortOrder: number }[];
};

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
  };
}

export async function getOrCreateEntry(userId: string, date: string) {
  let entry = await prisma.diaryEntry.findUnique({
    where: { userId_date: { userId, date } },
    include: { photos: true },
  });

  if (!entry) {
    entry = await prisma.diaryEntry.create({
      data: { userId, date, content: "", moodTags: "[]" },
      include: { photos: true },
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
    include: { photos: true },
  });

  return serializeEntry(entry);
}
