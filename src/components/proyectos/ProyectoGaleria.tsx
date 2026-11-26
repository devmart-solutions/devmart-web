"use client";

import Image from "next/image";
import { useState, useCallback, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ImagePlaceholder } from "../ui";

export function ProyectoGaleria({
  imagenes,
  altPrincipal,
  cliente,
}: {
  imagenes: string[];
  altPrincipal: string;
  cliente: string;
}) {
  const [activa, setActiva] = useState(0);

  const total = imagenes.length;

  const anterior = useCallback(() => {
    setActiva((prev) => (prev === 0 ? total - 1 : prev - 1));
  }, [total]);

  const siguiente = useCallback(() => {
    setActiva((prev) => (prev === total - 1 ? 0 : prev + 1));
  }, [total]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (total <= 1) return;
      if (e.key === "ArrowLeft") anterior();
      if (e.key === "ArrowRight") siguiente();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [anterior, siguiente, total]);

  if (total === 0) {
    return <ImagePlaceholder className="aspect-[16/9] rounded-panel" />;
  }

  const imagenActual = imagenes[activa] ?? imagenes[0];

  return (
    <div className="flex flex-col gap-4">
      {/* Visor principal */}
      <div className="group relative aspect-[16/9] w-full overflow-hidden rounded-panel border border-borde bg-nube shadow-sm">
        <Image
          key={imagenActual}
          src={imagenActual}
          alt={`${altPrincipal || cliente} - Captura ${activa + 1} de ${total}`}
          fill
          priority={activa === 0}
          sizes="(min-width: 1280px) 1200px, 100vw"
          className="object-contain transition-opacity duration-300 md:object-cover"
        />

        {total > 1 && (
          <>
            {/* Controles anterior y siguiente */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-between p-3 sm:p-5">
              <button
                type="button"
                onClick={anterior}
                aria-label="Captura anterior"
                className="pointer-events-auto inline-flex h-10 w-10 items-center justify-center rounded-full border border-borde/60 bg-blanco/90 text-noche shadow-md backdrop-blur-sm transition hover:bg-blanco hover:scale-105 active:scale-95"
              >
                <ChevronLeft size={20} strokeWidth={2} aria-hidden />
              </button>
              <button
                type="button"
                onClick={siguiente}
                aria-label="Siguiente captura"
                className="pointer-events-auto inline-flex h-10 w-10 items-center justify-center rounded-full border border-borde/60 bg-blanco/90 text-noche shadow-md backdrop-blur-sm transition hover:bg-blanco hover:scale-105 active:scale-95"
              >
                <ChevronRight size={20} strokeWidth={2} aria-hidden />
              </button>
            </div>

            {/* Contador en esquina */}
            <div className="absolute right-4 bottom-4 rounded-full border border-borde/70 bg-blanco/90 px-3 py-1 font-mono text-xs tracking-wider text-pizarra shadow-sm backdrop-blur-sm">
              {activa + 1} / {total}
            </div>
          </>
        )}
      </div>

      {/* Tira horizontal de miniaturas */}
      {total > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
          {imagenes.map((img, idx) => (
            <button
              key={img}
              type="button"
              onClick={() => setActiva(idx)}
              aria-label={`Ver captura ${idx + 1}`}
              className={`relative aspect-[16/10] h-16 sm:h-20 flex-shrink-0 overflow-hidden rounded-lg border transition-all ${
                activa === idx
                  ? "border-cielo-profundo ring-2 ring-cielo-profundo/40 scale-[1.02]"
                  : "border-borde opacity-70 hover:opacity-100"
              }`}
            >
              <Image
                src={img}
                alt={`Miniatura ${idx + 1}`}
                fill
                sizes="120px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
