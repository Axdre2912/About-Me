"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { MOOD_PRESETS, RATING_EMOJIS } from "@/lib/utils";
import { motion } from "framer-motion";

type Result = {
  id: string;
  date: string;
  rating: number | null;
  moodTags: string[];
  excerpt: string;
  photoCount: number;
};

export function SearchPanel() {
  const [q, setQ] = useState("");
  const [mood, setMood] = useState("");
  const [rating, setRating] = useState("");
  const [results, setResults] = useState<Result[]>([]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (mood) params.set("mood", mood);
    if (rating) params.set("rating", rating);

    const timer = setTimeout(() => {
      fetch(`/api/search?${params}`)
        .then((r) => r.json())
        .then((d) => setResults(d.results ?? []));
    }, 300);

    return () => clearTimeout(timer);
  }, [q, mood, rating]);

  const quickFilters = [
    { label: "5-star days", rating: "5", mood: "" },
    { label: "Sad days", rating: "", mood: "sad" },
    { label: "Happy days", rating: "", mood: "happy" },
    { label: "Productive", rating: "", mood: "productive" },
  ];

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search entries by keyword..."
          className="w-full rounded-xl border border-card-border bg-card py-3 pl-10 pr-4 outline-none focus:border-accent"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {quickFilters.map((f) => (
          <button
            key={f.label}
            type="button"
            onClick={() => {
              setRating(f.rating);
              setMood(f.mood);
            }}
            className="rounded-full border border-card-border bg-card px-3 py-1 text-sm hover:border-accent"
          >
            {f.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => {
            setQ("");
            setMood("");
            setRating("");
          }}
          className="rounded-full px-3 py-1 text-sm text-muted underline"
        >
          Clear filters
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm text-muted">Mood</label>
          <select
            value={mood}
            onChange={(e) => setMood(e.target.value)}
            className="mt-1 w-full rounded-lg border border-card-border bg-card px-3 py-2"
          >
            <option value="">Any mood</option>
            {MOOD_PRESETS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm text-muted">Rating</label>
          <select
            value={rating}
            onChange={(e) => setRating(e.target.value)}
            className="mt-1 w-full rounded-lg border border-card-border bg-card px-3 py-2"
          >
            <option value="">Any rating</option>
            {[1, 2, 3, 4, 5].map((r) => (
              <option key={r} value={r}>
                {RATING_EMOJIS[r - 1]} {r} stars
              </option>
            ))}
          </select>
        </div>
      </div>

      <p className="text-sm text-muted">{results.length} entries found</p>

      <div className="space-y-3">
        {results.map((r, i) => (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
          >
            <Link
              href={`/entry/${r.date}`}
              className="block rounded-xl border border-card-border bg-card p-4 transition hover:border-accent"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{r.date}</span>
                {r.rating && <span>{RATING_EMOJIS[r.rating - 1]}</span>}
              </div>
              <p className="mt-2 text-sm text-muted line-clamp-2">{r.excerpt || "No text"}</p>
              <div className="mt-2 flex gap-2 text-xs text-muted">
                {r.moodTags.map((t) => (
                  <span key={t} className="rounded-full bg-accent-soft px-2 py-0.5 text-accent">
                    {t}
                  </span>
                ))}
                {r.photoCount > 0 && <span>{r.photoCount} photos</span>}
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
