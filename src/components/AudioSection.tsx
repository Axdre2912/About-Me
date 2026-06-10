"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { AudioLines, Loader2, Music, Trash2 } from "lucide-react";
import type { AudioDTO } from "@/lib/entries";

const MAX_AUDIO = 6;
const MAX_SIZE_MB = 4;

type Props = {
  date: string;
  audios: AudioDTO[];
  onAudiosChange: (audios: AudioDTO[]) => void;
};

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function AudioSection({ date, audios, onAudiosChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async (files: FileList) => {
    setUploading(true);
    setError(null);
    const newAudios = [...audios];

    for (const file of Array.from(files)) {
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        setError(`"${file.name}" is too large (max ${MAX_SIZE_MB}MB per clip)`);
        continue;
      }
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`/api/entries/${date}/audio`, {
        method: "POST",
        body: form,
      });
      if (res.ok) {
        const audio: AudioDTO = await res.json();
        newAudios.push(audio);
      } else {
        const body = await res.json().catch(() => null);
        setError(body?.error || `Failed to upload "${file.name}"`);
      }
    }

    onAudiosChange(newAudios.sort((a, b) => a.sortOrder - b.sortOrder));
    setUploading(false);
  };

  const remove = async (id: string) => {
    await fetch(`/api/audio/${id}`, { method: "DELETE" });
    onAudiosChange(audios.filter((a) => a.id !== id));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted">Audio</p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading || audios.length >= MAX_AUDIO}
          className="flex items-center gap-1 rounded-lg bg-accent-soft px-3 py-1.5 text-sm text-accent transition hover:opacity-80 disabled:opacity-50"
        >
          {uploading ? <Loader2 size={16} className="animate-spin" /> : <AudioLines size={16} />}
          Add audio
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="audio/*,.mp3,.m4a,.aac,.wav,.ogg,.webm,.flac"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) upload(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {audios.length > 0 && (
        <div className="space-y-2">
          {audios.map((audio) => (
            <motion.div
              key={audio.id}
              layout
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="group rounded-lg border border-card-border bg-card p-3"
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2 text-sm">
                  <Music size={14} className="shrink-0 text-accent" />
                  <span className="truncate" title={audio.filename}>
                    {audio.filename}
                  </span>
                  <span className="shrink-0 text-xs text-muted">
                    {formatSize(audio.sizeBytes)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => remove(audio.id)}
                  className="shrink-0 rounded-full p-1.5 text-muted transition hover:bg-accent-soft hover:text-red-500"
                  aria-label="Delete audio"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <audio
                controls
                preload="metadata"
                src={audio.url}
                className="h-10 w-full"
              />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
