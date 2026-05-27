import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO, isValid } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDateKey(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function parseDateKey(key: string): Date | null {
  const d = parseISO(key);
  return isValid(d) ? d : null;
}

export function countWords(html: string): number {
  const text = html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return 0;
  return text.split(/\s+/).filter(Boolean).length;
}

export function parseMoodTags(json: string): string[] {
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed.filter((t) => typeof t === "string") : [];
  } catch {
    return [];
  }
}

export const MOOD_PRESETS = [
  "happy",
  "sad",
  "tired",
  "productive",
  "anxious",
  "grateful",
  "excited",
  "calm",
  "stressed",
  "lonely",
  "inspired",
  "peaceful",
] as const;

export const RATING_EMOJIS = ["😞", "😕", "😐", "🙂", "😄"] as const;
