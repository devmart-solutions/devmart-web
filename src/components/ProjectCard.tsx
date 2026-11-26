import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Proyecto } from "@/lib/content";
import { TarjetaViva } from "./TarjetaViva";
import { ImagePlaceholder, Label } from "./ui";

export function ProjectCard({ p }: { p: Proyecto }) {
  return (
    <TarjetaViva className="h-full rounded-card">
      <Link
        href={`/proyectos/${p.slug}`}
        className="group flex h-full flex-col overflow-hidden rounded-card border border-borde bg-blanco transition-shadow duration-200 hover:shadow-elevada"
      >
        <div className="relative">
          <EstadoBadge estado={p.estado} className="absolute top-4 left-4 z-10" />
          {p.imagen ? (
            <div className="relative aspect-[16/10] overflow-hidden bg-nube">
              <Image
                src={p.imagen}
                alt={p.imagenAlt ?? p.cliente}
                fill
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
              />
            </div>
          ) : (
            <ImagePlaceholder className="aspect-[16/10]" />
          )}
        </div>
        <div className="flex flex-1 flex-col gap-2.5 p-6">
          <Label>{p.tipo}</Label>
          <h3 className="h3-dm font-display">{p.cliente}</h3>
          <p className="text-[15px] leading-relaxed text-pizarra line-clamp-3">{p.resumen}</p>

          {/* Stack preview */}
          {p.stack && p.stack.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {p.stack.slice(0, 3).map((s) => (
                <span
                  key={s}
                  className="rounded-full bg-nube border border-borde/80 px-2.5 py-0.5 font-mono text-[10px] text-pizarra"
                >
                  {s}
                </span>
              ))}
              {p.stack.length > 3 && (
                <span className="rounded-full bg-nube border border-borde/80 px-2 py-0.5 font-mono text-[10px] text-niebla">
                  +{p.stack.length - 3}
                </span>
              )}
            </div>
          )}

          <span className="mt-auto inline-flex items-center gap-1.5 pt-4 text-[14px] font-medium text-cielo-profundo transition group-hover:translate-x-1 group-hover:text-noche">
            Ver el caso <ArrowRight size={16} strokeWidth={1.5} aria-hidden />
          </span>
        </div>
      </Link>
    </TarjetaViva>
  );
}

/** Etiqueta del caso: sitio en producción o prototipo navegable. */
export function EstadoBadge({ estado, className = "" }: { estado: Proyecto["estado"]; className?: string }) {
  const produccion = estado === "produccion";
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 font-mono text-[11px] tracking-[0.08em] uppercase ${
        produccion ? "bg-noche text-blanco" : "border border-noche/20 bg-blanco/90 text-noche"
      } ${className}`}
    >
      <span
        aria-hidden
        className={`h-1.5 w-1.5 rounded-full ${produccion ? "bg-cielo" : "border border-noche/60"}`}
      />
      {produccion ? "En producción" : "Prototipo"}
    </span>
  );
}

export function ProjectSlot() {
  return (
    <div className="flex flex-col overflow-hidden rounded-card border border-dashed border-borde bg-blanco/60">
      <div className="placeholder-rayado aspect-[4/3] opacity-60" />
      <div className="flex flex-1 flex-col gap-2 p-7">
        <Label className="text-pizarra">Próximamente</Label>
        <h3 className="h3-dm text-pizarra">Tu proyecto puede ser el siguiente.</h3>
      </div>
    </div>
  );
}
