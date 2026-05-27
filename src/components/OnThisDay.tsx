"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { History } from "lucide-react";

type PastEntry = {
  date: string;
  year: string;
  rating: number | null;
  moodTags: string[];
  excerpt: string;
};

export function OnThisDay({ date }: { date: string }) {
  const [entries, setEntries] = useState<PastEntry[]>([]);

  useEffect(() => {
    fetch(`/api/on-this-day?date=${date}`)
      .then((r) => r.json())
      .then((d) => setEntries(d.results ?? []));
  }, [date]);

  if (entries.length === 0) return null;

  return (
    <section className="rounded-xl border border-card-border bg-card p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-medium text-muted">
        <History size={16} />
        On this day
      </div>
      <div className="space-y-3">
        {entries.map((e) => (
          <Link
            key={e.date}
            href={`/entry/${e.date}`}
            className="block rounded-lg border border-card-border p-3 transition hover:border-accent"
          >
            <p className="text-sm font-medium">{e.year}</p>
            <p className="mt-1 text-sm text-muted line-clamp-2">{e.excerpt || "No text"}</p>
            {e.moodTags.length > 0 && (
              <p className="mt-1 text-xs text-muted">{e.moodTags.join(" · ")}</p>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}
