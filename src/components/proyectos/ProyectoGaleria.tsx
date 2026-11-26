"use client";

import Image from "next/image";
import { useState, useCallback, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { ImagePlaceholder } from "../ui";

export function ProyectoGaleria({
  imagenes,
  altPrincipal,
  cliente,
  formato = "web",
}: {
  imagenes: string[];
  altPrincipal: string;
  cliente: string;
  formato?: "movil" | "web";
}) {
  const [activa, setActiva] = useState(0);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const carruselRef = useRef<HTMLDivElement>(null);

  const total = imagenes.length;

  const anterior = useCallback(() => {
    setActiva((prev) => (prev === 0 ? total - 1 : prev - 1));
  }, [total]);

  const siguiente = useCallback(() => {
    setActiva((prev) => (prev === total - 1 ? 0 : prev + 1));
  }, [total]);

  const moverCarrusel = useCallback((direccion: -1 | 1) => {
    const el = carruselRef.current;
    if (!el) return;
    el.scrollBy({ left: direccion * 280, behavior: "smooth" });
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (total <= 1) return;
      if (lightboxIdx !== null) {
        if (e.key === "Escape") setLightboxIdx(null);
        if (e.key === "ArrowLeft") setLightboxIdx((prev) => (prev === null ? null : prev === 0 ? total - 1 : prev - 1));
        if (e.key === "ArrowRight") setLightboxIdx((prev) => (prev === null ? null : prev === total - 1 ? 0 : prev + 1));
        return;
      }
      if (formato === "web") {
        if (e.key === "ArrowLeft") anterior();
        if (e.key === "ArrowRight") siguiente();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [anterior, siguiente, total, lightboxIdx, formato]);

  if (total === 0) {
    return <ImagePlaceholder className="aspect-[16/9] rounded-panel" />;
  }

  /* Carrusel horizontal estilo App Store / Google Play para apps móviles */
  if (formato === "movil") {
    return (
      <>
        <div className="flex flex-col gap-5 rounded-panel border border-borde bg-nube/70 p-5 md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <span className="font-mono text-xs tracking-wider text-pizarra uppercase">
              {"// "}Vista previa de la app ({total} {total === 1 ? "pantalla" : "pantallas"})
            </span>
            {total > 1 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => moverCarrusel(-1)}
                  aria-label="Desplazar capturas a la izquierda"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-borde bg-blanco text-noche transition hover:border-cielo-profundo hover:text-cielo-profundo"
                >
                  <ChevronLeft size={18} strokeWidth={1.8} aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => moverCarrusel(1)}
                  aria-label="Desplazar capturas a la derecha"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-borde bg-blanco text-noche transition hover:border-cielo-profundo hover:text-cielo-profundo"
                >
                  <ChevronRight size={18} strokeWidth={1.8} aria-hidden />
                </button>
              </div>
            )}
          </div>

          <div
            ref={carruselRef}
            className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2 scroll-smooth"
          >
            {imagenes.map((img, idx) => (
              <button
                key={img}
                type="button"
                onClick={() => setLightboxIdx(idx)}
                aria-label={`Ampliar captura ${idx + 1} de ${total}`}
                className="group relative aspect-[9/19.5] w-[210px] flex-shrink-0 snap-start overflow-hidden rounded-[26px] border-[3px] border-noche/90 bg-noche shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-elevada sm:w-[235px] md:w-[250px]"
              >
                <Image
                  src={img}
                  alt={`${altPrincipal || cliente} - Pantalla ${idx + 1} de ${total}`}
                  fill
                  priority={idx < 3}
                  sizes="(min-width: 768px) 250px, 220px"
                  className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                />
              </button>
            ))}
          </div>
        </div>

        {/* Visor ampliado al hacer clic en una pantalla */}
        {lightboxIdx !== null && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Captura ampliada ${lightboxIdx + 1} de ${total}`}
            onClick={() => setLightboxIdx(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-noche/90 p-4 backdrop-blur-sm"
          >
            <button
              type="button"
              onClick={() => setLightboxIdx(null)}
              aria-label="Cerrar vista ampliada"
              className="absolute top-5 right-5 inline-flex h-10 w-10 items-center justify-center rounded-full border border-blanco/20 bg-noche/80 text-blanco transition hover:bg-blanco hover:text-noche"
            >
              <X size={20} aria-hidden />
            </button>

            {total > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxIdx(lightboxIdx === 0 ? total - 1 : lightboxIdx - 1);
                  }}
                  aria-label="Captura anterior"
                  className="absolute left-4 inline-flex h-11 w-11 items-center justify-center rounded-full border border-blanco/20 bg-noche/80 text-blanco transition hover:bg-blanco hover:text-noche sm:left-8"
                >
                  <ChevronLeft size={22} aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxIdx(lightboxIdx === total - 1 ? 0 : lightboxIdx + 1);
                  }}
                  aria-label="Siguiente captura"
                  className="absolute right-4 inline-flex h-11 w-11 items-center justify-center rounded-full border border-blanco/20 bg-noche/80 text-blanco transition hover:bg-blanco hover:text-noche sm:right-8"
                >
                  <ChevronRight size={22} aria-hidden />
                </button>
              </>
            )}

            <div
              onClick={(e) => e.stopPropagation()}
              className="relative h-[82vh] max-h-[780px] aspect-[9/19.5] overflow-hidden rounded-[30px] border-[4px] border-blanco/20 bg-noche shadow-2xl"
            >
              <Image
                src={imagenes[lightboxIdx]!}
                alt={`${altPrincipal || cliente} - Pantalla ${lightboxIdx + 1} de ${total}`}
                fill
                sizes="400px"
                className="object-cover"
              />
            </div>

            <span className="absolute bottom-5 rounded-full border border-blanco/20 bg-noche/80 px-3.5 py-1 font-mono text-xs text-blanco">
              {lightboxIdx + 1} / {total}
            </span>
          </div>
        )}
      </>
    );
  }

  /* Galería panorámica estándar para sitios web y paneles */
  const imagenActual = imagenes[activa] ?? imagenes[0];

  return (
    <div className="flex flex-col gap-4">
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
            <div className="pointer-events-none absolute inset-0 flex items-center justify-between p-3 sm:p-5">
              <button
                type="button"
                onClick={anterior}
                aria-label="Captura anterior"
                className="pointer-events-auto inline-flex h-10 w-10 items-center justify-center rounded-full border border-borde/60 bg-blanco/90 text-noche shadow-md backdrop-blur-sm transition hover:scale-105 hover:bg-blanco active:scale-95"
              >
                <ChevronLeft size={20} strokeWidth={2} aria-hidden />
              </button>
              <button
                type="button"
                onClick={siguiente}
                aria-label="Siguiente captura"
                className="pointer-events-auto inline-flex h-10 w-10 items-center justify-center rounded-full border border-borde/60 bg-blanco/90 text-noche shadow-md backdrop-blur-sm transition hover:scale-105 hover:bg-blanco active:scale-95"
              >
                <ChevronRight size={20} strokeWidth={2} aria-hidden />
              </button>
            </div>

            <div className="absolute right-4 bottom-4 rounded-full border border-borde/70 bg-blanco/90 px-3 py-1 font-mono text-xs tracking-wider text-pizarra shadow-sm backdrop-blur-sm">
              {activa + 1} / {total}
            </div>
          </>
        )}
      </div>

      {total > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {imagenes.map((img, idx) => (
            <button
              key={img}
              type="button"
              onClick={() => setActiva(idx)}
              aria-label={`Ver captura ${idx + 1}`}
              className={`relative aspect-[16/10] h-16 flex-shrink-0 overflow-hidden rounded-lg border transition-all sm:h-20 ${
                activa === idx
                  ? "scale-[1.02] border-cielo-profundo ring-2 ring-cielo-profundo/40"
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
