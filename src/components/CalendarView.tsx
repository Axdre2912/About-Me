"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { RATING_EMOJIS } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

type DayInfo = {
  date: string;
  rating: number | null;
  hasEntry: boolean;
};

export function CalendarView() {
  const [current, setCurrent] = useState(new Date());
  const [days, setDays] = useState<DayInfo[]>([]);

  const monthKey = format(current, "yyyy-MM");

  useEffect(() => {
    fetch(`/api/calendar?month=${monthKey}`)
      .then((r) => r.json())
      .then((data) => setDays(data.days ?? []));
  }, [monthKey]);

  const dayMap = new Map(days.map((d) => [d.date, d]));
  const monthStart = startOfMonth(current);
  const monthEnd = endOfMonth(current);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const startPad = monthStart.getDay();
  const padding = Array.from({ length: startPad }, (_, i) => i);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setCurrent(subMonths(current, 1))}
          className="rounded-lg p-2 hover:bg-card"
          aria-label="Previous month"
        >
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-lg font-semibold">{format(current, "MMMM yyyy")}</h2>
        <button
          type="button"
          onClick={() => setCurrent(addMonths(current, 1))}
          className="rounded-lg p-2 hover:bg-card"
          aria-label="Next month"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="py-1 font-medium">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {padding.map((i) => (
          <div key={`pad-${i}`} />
        ))}
        {calendarDays.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const info = dayMap.get(key);
          const inMonth = isSameMonth(day, current);
          const today = isToday(day);

          return (
            <Link key={key} href={`/entry/${key}`}>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                className={cn(
                  "flex aspect-square flex-col items-center justify-center rounded-lg border text-sm transition",
                  inMonth ? "border-card-border bg-card hover:border-accent" : "opacity-30",
                  today && "ring-2 ring-accent ring-offset-1 ring-offset-background",
                  info?.hasEntry && "bg-accent-soft/50"
                )}
              >
                <span className={cn(today && "font-bold text-accent")}>{format(day, "d")}</span>
                {info?.rating && (
                  <span className="text-xs leading-none" title={`Rating: ${info.rating}`}>
                    {RATING_EMOJIS[info.rating - 1]}
                  </span>
                )}
                {info?.hasEntry && !info.rating && (
                  <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-accent" />
                )}
              </motion.div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
