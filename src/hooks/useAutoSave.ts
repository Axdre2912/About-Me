"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type SavePayload = {
  content?: string;
  moodTags?: string[];
  rating?: number | null;
};

export function useAutoSave(date: string, debounceMs = 800) {
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestRef = useRef<SavePayload>({});

  const flush = useCallback(async () => {
    const payload = latestRef.current;
    if (Object.keys(payload).length === 0) return;

    setStatus("saving");
    try {
      const res = await fetch(`/api/entries/${date}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Save failed");
      latestRef.current = {};
      setStatus("saved");
      setTimeout(() => setStatus((s) => (s === "saved" ? "idle" : s)), 2000);
    } catch {
      setStatus("error");
    }
  }, [date]);

  const queueSave = useCallback(
    (data: SavePayload) => {
      latestRef.current = { ...latestRef.current, ...data };
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(flush, debounceMs);
    },
    [flush, debounceMs]
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (Object.keys(latestRef.current).length > 0) {
        fetch(`/api/entries/${date}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(latestRef.current),
          keepalive: true,
        });
      }
    };
  }, [date]);

  return { queueSave, status, flush };
}
