"use client";

import { useState } from "react";
import { Play } from "lucide-react";

/** Miniatura de YouTube que carga el reproductor solo al pulsarla (sin cookies hasta entonces). */
export function VideoLigero({ id, titulo }: { id: string; titulo: string }) {
  const [activo, setActivo] = useState(false);

  if (activo) {
    return (
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
        title={titulo}
        allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="aspect-video w-full rounded-panel"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setActivo(true)}
      className="group relative block aspect-video w-full overflow-hidden rounded-panel bg-noche"
      aria-label={`Reproducir: ${titulo}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`https://i.ytimg.com/vi/${id}/maxresdefault.jpg`}
        alt=""
        loading="lazy"
        onError={(e) => {
          if (!e.currentTarget.src.includes("hqdefault")) e.currentTarget.src = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
        }}
        className="size-full object-cover opacity-90 transition duration-500 group-hover:scale-105 group-hover:opacity-100"
      />
      <span className="absolute inset-0 flex items-center justify-center">
        <span className="play-pulso flex size-20 items-center justify-center rounded-full bg-cielo text-noche transition-transform duration-300 group-hover:scale-110">
          <Play size={32} fill="currentColor" aria-hidden className="ml-1" />
        </span>
      </span>
    </button>
  );
}
