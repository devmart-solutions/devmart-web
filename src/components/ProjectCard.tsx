import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Sparkles } from "lucide-react";
import type { Proyecto } from "@/lib/content";
import { Revelar } from "./Revelar";
import { TarjetaViva } from "./TarjetaViva";
import { ImagePlaceholder, Label } from "./ui";

export function ProyectoDestacadoCard({ p }: { p: Proyecto }) {
  return (
    <Revelar>
      <div className="overflow-hidden rounded-card border border-borde bg-blanco shadow-sm transition hover:shadow-elevada">
        <div className="grid gap-8 p-6 md:grid-cols-[1.1fr_0.9fr] md:items-center md:p-10">
          <TarjetaViva className="overflow-hidden rounded-panel border border-borde bg-nube">
            <Link href={`/proyectos/${p.slug}`} className="group relative block aspect-[16/10] w-full">
              {p.imagen ? (
                <Image
                  src={p.imagen}
                  alt={p.imagenAlt ?? p.cliente}
                  fill
                  priority
                  sizes="(min-width: 1024px) 600px, 100vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <ImagePlaceholder className="aspect-[16/10]" />
              )}
              <div className="absolute top-4 left-4 z-10 flex flex-wrap gap-2">
                <EstadoBadge estado={p.estado} />
                {p.slug === "kubi" && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-cielo-profundo px-3 py-1 font-mono text-[11px] tracking-wider text-blanco uppercase">
                    <Sparkles size={12} aria-hidden /> Producto propio
                  </span>
                )}
              </div>
            </Link>
          </TarjetaViva>

          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Label>{p.tipo}</Label>
            </div>
            <h3 className="font-display text-2xl font-bold tracking-tight text-noche md:text-3xl">
              {p.cliente}
            </h3>
            <p className="text-base leading-relaxed text-texto-cuerpo md:text-lg">{p.resumen}</p>

            {p.stack.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-2">
                {p.stack.slice(0, 6).map((tech) => (
                  <span
                    key={tech}
                    className="rounded-full border border-borde bg-nube px-3 py-1 font-mono text-[11px] text-pizarra"
                  >
                    {tech}
                  </span>
                ))}
                {p.stack.length > 6 && (
                  <span className="rounded-full border border-borde bg-nube px-2.5 py-1 font-mono text-[11px] text-niebla">
                    +{p.stack.length - 6} más
                  </span>
                )}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-4 pt-4">
              <Link href={`/proyectos/${p.slug}`} className="btn-primary">
                Ver el caso completo <ArrowRight size={18} strokeWidth={1.5} aria-hidden />
              </Link>
              {p.url && (
                <a
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary"
                >
                  {p.urlLabel ?? "Visitar"} <ArrowUpRight size={18} strokeWidth={1.5} aria-hidden />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </Revelar>
  );
}

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
