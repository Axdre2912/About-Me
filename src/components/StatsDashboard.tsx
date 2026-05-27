"use client";

import { useEffect, useState } from "react";
import { RATING_EMOJIS } from "@/lib/utils";

type Stats = {
  totalEntries: number;
  totalPhotos: number;
  overallAvgRating: number | null;
  moodTrends: { mood: string; count: number }[];
  monthlyStats: {
    month: string;
    entryCount: number;
    photoCount: number;
    avgRating: number | null;
  }[];
};

export function StatsDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then(setStats);
  }, []);

  if (!stats) {
    return <p className="text-muted">Loading statistics...</p>;
  }

  const maxMood = Math.max(...stats.moodTrends.map((m) => m.count), 1);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Entries" value={stats.totalEntries} />
        <StatCard label="Photos" value={stats.totalPhotos} />
        <StatCard
          label="Avg rating"
          value={stats.overallAvgRating ?? "—"}
          suffix={stats.overallAvgRating ? "/5" : ""}
        />
      </div>

      <section>
        <h2 className="mb-4 text-lg font-semibold">Mood trends</h2>
        {stats.moodTrends.length === 0 ? (
          <p className="text-sm text-muted">No mood tags yet.</p>
        ) : (
          <div className="space-y-2">
            {stats.moodTrends.map(({ mood, count }) => (
              <div key={mood} className="flex items-center gap-3">
                <span className="w-24 capitalize text-sm">{mood}</span>
                <div className="flex-1 overflow-hidden rounded-full bg-card border border-card-border h-3">
                  <div
                    className="h-full rounded-full bg-accent transition-all"
                    style={{ width: `${(count / maxMood) * 100}%` }}
                  />
                </div>
                <span className="text-sm text-muted w-8 text-right">{count}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold">Monthly overview</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-card-border text-left text-muted">
                <th className="py-2 pr-4">Month</th>
                <th className="py-2 pr-4">Entries</th>
                <th className="py-2 pr-4">Photos</th>
                <th className="py-2">Avg rating</th>
              </tr>
            </thead>
            <tbody>
              {stats.monthlyStats.map((m) => (
                <tr key={m.month} className="border-b border-card-border/50">
                  <td className="py-2 pr-4 font-medium">{m.month}</td>
                  <td className="py-2 pr-4">{m.entryCount}</td>
                  <td className="py-2 pr-4">{m.photoCount}</td>
                  <td className="py-2">
                    {m.avgRating ? (
                      <span>
                        {RATING_EMOJIS[Math.round(m.avgRating) - 1]} {m.avgRating}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  suffix = "",
}: {
  label: string;
  value: string | number;
  suffix?: string;
}) {
  return (
    <div className="rounded-xl border border-card-border bg-card p-4 text-center">
      <p className="text-2xl font-semibold">
        {value}
        {suffix}
      </p>
      <p className="text-xs text-muted mt-1">{label}</p>
    </div>
  );
}
