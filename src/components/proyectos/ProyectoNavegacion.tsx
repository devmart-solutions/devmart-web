import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { Proyecto } from "@/lib/content";

export function ProyectoNavegacion({
  anterior,
  siguiente,
}: {
  anterior: Proyecto | null;
  siguiente: Proyecto | null;
}) {
  if (!anterior && !siguiente) return null;

  return (
    <section className="border-t border-borde bg-blanco py-12">
      <div className="container-dm grid gap-6 sm:grid-cols-2">
        {anterior ? (
          <Link
            href={`/proyectos/${anterior.slug}`}
            className="group flex flex-col gap-2 rounded-card border border-borde p-6 transition-all hover:border-cielo hover:shadow-sm"
          >
            <span className="inline-flex items-center gap-2 font-mono text-xs text-pizarra uppercase tracking-wider group-hover:text-cielo-profundo">
              <ArrowLeft size={16} strokeWidth={1.5} aria-hidden /> Caso anterior
            </span>
            <span className="font-display text-lg font-medium text-noche group-hover:text-cielo-profundo">
              {anterior.cliente}
            </span>
            <span className="text-sm text-pizarra line-clamp-1">{anterior.tipo}</span>
          </Link>
        ) : (
          <div aria-hidden className="hidden sm:block" />
        )}

        {siguiente ? (
          <Link
            href={`/proyectos/${siguiente.slug}`}
            className="group flex flex-col items-start sm:items-end gap-2 rounded-card border border-borde p-6 transition-all hover:border-cielo hover:shadow-sm text-left sm:text-right"
          >
            <span className="inline-flex items-center gap-2 font-mono text-xs text-pizarra uppercase tracking-wider group-hover:text-cielo-profundo">
              Siguiente caso <ArrowRight size={16} strokeWidth={1.5} aria-hidden />
            </span>
            <span className="font-display text-lg font-medium text-noche group-hover:text-cielo-profundo">
              {siguiente.cliente}
            </span>
            <span className="text-sm text-pizarra line-clamp-1">{siguiente.tipo}</span>
          </Link>
        ) : null}
      </div>
    </section>
  );
}
