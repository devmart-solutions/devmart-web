"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, ArrowUpRight, Sparkles } from "lucide-react";
import type { Proyecto } from "@/lib/content";
import { EstadoBadge, ProjectCard, ProjectSlot } from "@/components/ProjectCard";
import { Revelar } from "@/components/Revelar";
import { TarjetaViva } from "@/components/TarjetaViva";
import { Label } from "@/components/ui";

export function ProyectosLista({ proyectos }: { proyectos: Proyecto[] }) {
  const [filtroTipo, setFiltroTipo] = useState<string>("todos");
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");

  // Tipos únicos presentes en los proyectos
  const tipos = useMemo(() => {
    const set = new Set(proyectos.map((p) => p.tipo));
    return ["todos", ...Array.from(set)];
  }, [proyectos]);

  // Proyectos filtrados
  const filtrados = useMemo(() => {
    return proyectos.filter((p) => {
      const matchTipo = filtroTipo === "todos" || p.tipo === filtroTipo;
      const matchEstado = filtroEstado === "todos" || p.estado === filtroEstado;
      return matchTipo && matchEstado;
    });
  }, [proyectos, filtroTipo, filtroEstado]);

  // Kubi como proyecto destacado
  const destacado = useMemo(() => {
    return filtrados.find((p) => p.slug === "kubi");
  }, [filtrados]);

  // Proyectos restantes (sin el destacado si se muestra arriba)
  const restantes = useMemo(() => {
    if (destacado) {
      return filtrados.filter((p) => p.slug !== destacado.slug);
    }
    return filtrados;
  }, [filtrados, destacado]);

  // Espacios para completar retícula
  const slots = Math.max(0, (destacado ? 2 : 3) - restantes.length);

  return (
    <div className="flex flex-col gap-12">
      {/* Barra de filtros y contadores */}
      <div className="flex flex-col gap-6 border-b border-borde pb-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs uppercase tracking-wider text-pizarra">
              {"// "}
              {filtrados.length} {filtrados.length === 1 ? "CASO" : "CASOS REGISTRADOS"}
            </span>
          </div>

          {/* Conmutador de Estado */}
          <div className="inline-flex rounded-full border border-borde bg-blanco p-1 text-xs">
            <button
              type="button"
              onClick={() => setFiltroEstado("todos")}
              className={`rounded-full px-3.5 py-1.5 font-medium transition ${
                filtroEstado === "todos" ? "bg-noche text-blanco" : "text-pizarra hover:text-noche"
              }`}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => setFiltroEstado("produccion")}
              className={`rounded-full px-3.5 py-1.5 font-medium transition ${
                filtroEstado === "produccion" ? "bg-noche text-blanco" : "text-pizarra hover:text-noche"
              }`}
            >
              En producción
            </button>
            <button
              type="button"
              onClick={() => setFiltroEstado("prototipo")}
              className={`rounded-full px-3.5 py-1.5 font-medium transition ${
                filtroEstado === "prototipo" ? "bg-noche text-blanco" : "text-pizarra hover:text-noche"
              }`}
            >
              Prototipos
            </button>
          </div>
        </div>

        {/* Filtros por tipo */}
        {tipos.length > 2 && (
          <div className="flex flex-wrap gap-2">
            {tipos.map((tipo) => (
              <button
                key={tipo}
                type="button"
                onClick={() => setFiltroTipo(tipo)}
                className={`rounded-full border px-4 py-1.5 text-xs font-medium transition ${
                  filtroTipo === tipo
                    ? "border-cielo-profundo bg-cielo-tinte text-cielo-profundo"
                    : "border-borde bg-blanco text-pizarra hover:border-niebla hover:text-noche"
                }`}
              >
                {tipo === "todos" ? "Todos los tipos" : tipo}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Caso destacado: Kubi */}
      {destacado && (
        <Revelar>
          <div className="overflow-hidden rounded-card border border-borde bg-blanco shadow-sm transition hover:shadow-elevada">
            <div className="grid gap-8 p-6 md:grid-cols-[1.1fr_0.9fr] md:p-10 md:items-center">
              {/* Imagen destacada en TarjetaViva */}
              <TarjetaViva className="overflow-hidden rounded-panel border border-borde bg-nube">
                <Link href={`/proyectos/${destacado.slug}`} className="group block relative aspect-[16/10] w-full">
                  {destacado.imagen ? (
                    <Image
                      src={destacado.imagen}
                      alt={destacado.imagenAlt ?? destacado.cliente}
                      fill
                      priority
                      sizes="(min-width: 1024px) 600px, 100vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : null}
                  <div className="absolute top-4 left-4 z-10 flex flex-wrap gap-2">
                    <EstadoBadge estado={destacado.estado} />
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-cielo-profundo px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-blanco">
                      <Sparkles size={12} aria-hidden /> Producto propio
                    </span>
                  </div>
                </Link>
              </TarjetaViva>

              {/* Contenido destacado */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <Label>{destacado.tipo}</Label>
                </div>
                <h2 className="font-display text-2xl font-bold tracking-tight text-noche md:text-3xl">
                  {destacado.cliente}
                </h2>
                <p className="text-base leading-relaxed text-texto-cuerpo md:text-lg">
                  {destacado.resumen}
                </p>

                {/* Stack principal */}
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {destacado.stack.slice(0, 6).map((tech) => (
                    <span
                      key={tech}
                      className="rounded-full bg-nube border border-borde px-3 py-1 font-mono text-[11px] text-pizarra"
                    >
                      {tech}
                    </span>
                  ))}
                  {destacado.stack.length > 6 && (
                    <span className="rounded-full bg-nube border border-borde px-2.5 py-1 font-mono text-[11px] text-niebla">
                      +{destacado.stack.length - 6} más
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-4 pt-4">
                  <Link href={`/proyectos/${destacado.slug}`} className="btn-primary">
                    Ver el caso completo <ArrowRight size={18} strokeWidth={1.5} aria-hidden />
                  </Link>
                  {destacado.url && (
                    <a
                      href={destacado.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary"
                    >
                      {destacado.urlLabel ?? "Visitar"} <ArrowUpRight size={18} strokeWidth={1.5} aria-hidden />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Revelar>
      )}

      {/* Retícula de casos secundarios */}
      {restantes.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {restantes.map((p, idx) => (
            <Revelar key={p.slug} retraso={(idx + 1) * 80}>
              <ProjectCard p={p} />
            </Revelar>
          ))}
          {Array.from({ length: slots }, (_, i) => (
            <ProjectSlot key={i} />
          ))}
        </div>
      ) : (
        !destacado && (
          <div className="flex flex-col items-center justify-center gap-4 rounded-card border border-dashed border-borde bg-blanco py-16 text-center">
            <p className="text-pizarra">No hay proyectos que coincidan con los filtros seleccionados.</p>
            <button
              type="button"
              onClick={() => {
                setFiltroTipo("todos");
                setFiltroEstado("todos");
              }}
              className="btn-secondary text-sm"
            >
              Restablecer filtros
            </button>
          </div>
        )
      )}
    </div>
  );
}
