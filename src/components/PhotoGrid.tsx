"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { Lightbox } from "./Lightbox";

type Photo = { id: string; url: string; sortOrder: number };

type Props = {
  date: string;
  photos: Photo[];
  onPhotosChange: (photos: Photo[]) => void;
};

export function PhotoGrid({ date, photos, onPhotosChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const upload = async (files: FileList) => {
    setUploading(true);
    const newPhotos = [...photos];

    for (const file of Array.from(files)) {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`/api/entries/${date}/photos`, {
        method: "POST",
        body: form,
      });
      if (res.ok) {
        const photo = await res.json();
        newPhotos.push(photo);
      }
    }

    onPhotosChange(newPhotos.sort((a, b) => a.sortOrder - b.sortOrder));
    setUploading(false);
  };

  const remove = async (id: string) => {
    await fetch(`/api/photos/${id}`, { method: "DELETE" });
    onPhotosChange(photos.filter((p) => p.id !== id));
    setLightboxIndex(null);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted">Photos</p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading || photos.length >= 12}
          className="flex items-center gap-1 rounded-lg bg-accent-soft px-3 py-1.5 text-sm text-accent transition hover:opacity-80 disabled:opacity-50"
        >
          {uploading ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />}
          Add photos
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && upload(e.target.files)}
        />
      </div>

      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {photos.map((photo, index) => (
            <motion.div
              key={photo.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="group relative aspect-square overflow-hidden rounded-lg bg-card border border-card-border"
            >
              <button
                type="button"
                className="absolute inset-0"
                onClick={() => setLightboxIndex(index)}
              >
                <Image
                  src={photo.url}
                  alt=""
                  fill
                  className="object-cover transition group-hover:scale-105"
                  sizes="(max-width: 768px) 33vw, 25vw"
                  unoptimized
                />
              </button>
              <button
                type="button"
                onClick={() => remove(photo.id)}
                className="absolute right-1 top-1 rounded-full bg-black/50 p-1 text-white opacity-0 transition group-hover:opacity-100"
                aria-label="Delete photo"
              >
                <Trash2 size={14} />
              </button>
            </motion.div>
          ))}
        </div>
      )}

      {lightboxIndex !== null && (
        <Lightbox
          photos={photos}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}
    </div>
  );
}
