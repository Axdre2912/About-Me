"use client";

import { useEffect, useState, useCallback } from "react";
import { format, parseISO } from "date-fns";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { addDays, subDays } from "date-fns";
import { DiaryEditor } from "./DiaryEditor";
import { StarRating } from "./StarRating";
import { MoodTags } from "./MoodTags";
import { PhotoGrid } from "./PhotoGrid";
import { OnThisDay } from "./OnThisDay";
import { useAutoSave } from "@/hooks/useAutoSave";
import type { EntryDTO } from "@/lib/entries";
import { formatDateKey } from "@/lib/utils";

type Props = { date: string };

export function EntryPage({ date }: Props) {
  const [entry, setEntry] = useState<EntryDTO | null>(null);
  const [wordCount, setWordCount] = useState(0);
  const { queueSave, status } = useAutoSave(date);

  const load = useCallback(async () => {
    const res = await fetch(`/api/entries/${date}`);
    if (res.ok) {
      const data: EntryDTO = await res.json();
      setEntry(data);
      setWordCount(data.wordCount);
    }
  }, [date]);

  useEffect(() => {
    load();
  }, [load]);

  const parsed = parseISO(date);
  const prevDate = formatDateKey(subDays(parsed, 1));
  const nextDate = formatDateKey(addDays(parsed, 1));

  if (!entry) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-muted">
        Loading...
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{format(parsed, "EEEE, MMMM d, yyyy")}</h1>
          <p className="text-sm text-muted">
            {wordCount} {wordCount === 1 ? "word" : "words"}
            {status === "saving" && " · Saving..."}
            {status === "saved" && " · Saved"}
            {status === "error" && " · Save failed"}
          </p>
        </div>
        <div className="flex gap-1">
          <Link
            href={`/entry/${prevDate}`}
            className="rounded-lg p-2 text-muted hover:bg-card"
            aria-label="Previous day"
          >
            <ChevronLeft size={20} />
          </Link>
          <Link
            href={`/entry/${nextDate}`}
            className="rounded-lg p-2 text-muted hover:bg-card"
            aria-label="Next day"
          >
            <ChevronRight size={20} />
          </Link>
        </div>
      </div>

      <section className="rounded-xl border border-card-border bg-card p-4">
        <p className="mb-2 text-sm font-medium text-muted">How was your day?</p>
        <StarRating
          value={entry.rating}
          onChange={(rating) => {
            setEntry({ ...entry, rating });
            queueSave({ rating });
          }}
        />
      </section>

      <MoodTags
        tags={entry.moodTags}
        onChange={(moodTags) => {
          setEntry({ ...entry, moodTags });
          queueSave({ moodTags });
        }}
      />

      <DiaryEditor
        content={entry.content}
        onChange={(content, wc) => {
          setWordCount(wc);
          setEntry({ ...entry, content, wordCount: wc });
          queueSave({ content });
        }}
      />

      <PhotoGrid
        date={date}
        photos={entry.photos}
        onPhotosChange={(photos) => setEntry({ ...entry, photos })}
      />

      <OnThisDay date={date} />
    </motion.div>
  );
}
