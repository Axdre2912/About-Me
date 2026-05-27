"use client";

import { RATING_EMOJIS } from "@/lib/utils";
import { cn } from "@/lib/utils";

type Props = {
  value: number | null;
  onChange: (rating: number | null) => void;
  size?: "sm" | "md" | "lg";
  readOnly?: boolean;
};

const sizes = { sm: "text-lg", md: "text-2xl", lg: "text-3xl" };

export function StarRating({ value, onChange, size = "md", readOnly }: Props) {
  return (
    <div className="flex items-center gap-1" role="group" aria-label="Day rating">
      {RATING_EMOJIS.map((emoji, i) => {
        const rating = i + 1;
        const selected = value !== null && rating <= value;
        return (
          <button
            key={rating}
            type="button"
            disabled={readOnly}
            onClick={() => onChange(value === rating ? null : rating)}
            className={cn(
              sizes[size],
              "transition-transform hover:scale-110 disabled:cursor-default",
              selected ? "opacity-100" : "opacity-35 grayscale"
            )}
            aria-label={`Rate ${rating} out of 5`}
            aria-pressed={selected}
          >
            {emoji}
          </button>
        );
      })}
    </div>
  );
}
