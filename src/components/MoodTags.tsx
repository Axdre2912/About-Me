"use client";

import { useState } from "react";
import { MOOD_PRESETS } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

type Props = {
  tags: string[];
  onChange: (tags: string[]) => void;
};

export function MoodTags({ tags, onChange }: Props) {
  const [custom, setCustom] = useState("");

  const toggle = (tag: string) => {
    const lower = tag.toLowerCase();
    if (tags.includes(lower)) {
      onChange(tags.filter((t) => t !== lower));
    } else if (tags.length < 10) {
      onChange([...tags, lower]);
    }
  };

  const addCustom = () => {
    const t = custom.trim().toLowerCase();
    if (t && !tags.includes(t) && tags.length < 10) {
      onChange([...tags, t]);
      setCustom("");
    }
  };

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-muted">Mood tags</p>
      <div className="flex flex-wrap gap-2">
        {MOOD_PRESETS.map((mood) => (
          <button
            key={mood}
            type="button"
            onClick={() => toggle(mood)}
            className={cn(
              "rounded-full px-3 py-1 text-sm capitalize transition",
              tags.includes(mood)
                ? "bg-accent text-white"
                : "bg-card border border-card-border text-muted hover:border-accent"
            )}
          >
            {mood}
          </button>
        ))}
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags
            .filter((t) => !MOOD_PRESETS.includes(t as (typeof MOOD_PRESETS)[number]))
            .map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-3 py-1 text-sm text-accent"
              >
                {tag}
                <button type="button" onClick={() => toggle(tag)} aria-label={`Remove ${tag}`}>
                  <X size={14} />
                </button>
              </span>
            ))}
        </div>
      )}
      <div className="flex gap-2">
        <input
          type="text"
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustom())}
          placeholder="Custom mood..."
          className="flex-1 rounded-lg border border-card-border bg-card px-3 py-2 text-sm outline-none focus:border-accent"
          maxLength={32}
        />
        <button
          type="button"
          onClick={addCustom}
          className="rounded-lg bg-card border border-card-border px-3 py-2 text-sm hover:border-accent"
        >
          Add
        </button>
      </div>
    </div>
  );
}
