"use client";

import { useMemo, useState } from "react";
import { ArrowDown } from "lucide-react";
import type { Proyecto } from "@/lib/content";
import { ProjectCard, ProjectSlot, ProyectoDestacadoCard } from "@/components/ProjectCard";
import { Revelar } from "@/components/Revelar";
import { Label } from "@/components/ui";

export function ProyectosLista({ proyectos }: { proyectos: Proyecto[] }) {
  const [filtroTipo, setFiltroTipo] = useState<string>("todos");

  const enProduccion = useMemo(
    () => proyectos.filter((p) => p.estado === "produccion"),
    [proyectos],
  );
  const prototipos = useMemo(
    () => proyectos.filter((p) => p.estado === "prototipo"),
    [proyectos],
  );

  const tiposProduccion = useMemo(() => {
    const set = new Set(enProduccion.map((p) => p.tipo));
    return ["todos", ...Array.from(set)];
  }, [enProduccion]);

  const produccionFiltrados = useMemo(
    () => enProduccion.filter((p) => filtroTipo === "todos" || p.tipo === filtroTipo),
    [enProduccion, filtroTipo],
  );

  const destacadoProduccion = useMemo(() => {
    if (produccionFiltrados.length === 1) return produccionFiltrados[0];
    return produccionFiltrados.find((p) => p.slug === "kubi");
  }, [produccionFiltrados]);

  const restantesProduccion = useMemo(
    () =>
      destacadoProduccion
        ? produccionFiltrados.filter((p) => p.slug !== destacadoProduccion.slug)
        : produccionFiltrados,
    [produccionFiltrados, destacadoProduccion],
  );

  const destacadoPrototipo = useMemo(() => {
    if (prototipos.length === 1) return prototipos[0];
    return prototipos.find((p) => p.slug === "kubi");
  }, [prototipos]);

  const restantesPrototipos = useMemo(
    () =>
      destacadoPrototipo
        ? prototipos.filter((p) => p.slug !== destacadoPrototipo.slug)
        : prototipos,
    [prototipos, destacadoPrototipo],
  );

  return (
    <div className="flex flex-col gap-16">
      {/* Sección principal: Proyectos en producción */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 border-b border-borde pb-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <span className="font-mono text-xs tracking-wider text-pizarra uppercase">
              {"// "}
              {produccionFiltrados.length}{" "}
              {produccionFiltrados.length === 1 ? "PROYECTO EN PRODUCCIÓN" : "PROYECTOS EN PRODUCCIÓN"}
            </span>

            {prototipos.length > 0 && (
              <a
                href="#prototipos"
                className="inline-flex items-center gap-2 rounded-full border border-borde bg-blanco px-4 py-1.5 font-mono text-xs text-pizarra transition hover:border-cielo-profundo hover:text-noche"
              >
                Ver prototipos ({prototipos.length}) <ArrowDown size={14} strokeWidth={1.5} aria-hidden />
              </a>
            )}
          </div>

          {tiposProduccion.length > 2 && (
            <div className="flex flex-wrap gap-2">
              {tiposProduccion.map((tipo) => (
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

        {destacadoProduccion && <ProyectoDestacadoCard p={destacadoProduccion} />}

        {restantesProduccion.length > 0 ? (
          <div
            className={`grid gap-6 ${
              restantesProduccion.length === 1
                ? "grid-cols-1"
                : restantesProduccion.length === 2
                  ? "sm:grid-cols-2"
                  : "sm:grid-cols-2 lg:grid-cols-3"
            }`}
          >
            {restantesProduccion.map((p, idx) =>
              restantesProduccion.length === 1 ? (
                <ProyectoDestacadoCard key={p.slug} p={p} />
              ) : (
                <Revelar key={p.slug} retraso={(idx + 1) * 80}>
                  <ProjectCard p={p} />
                </Revelar>
              ),
            )}
          </div>
        ) : (
          !destacadoProduccion && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }, (_, i) => (
                <ProjectSlot key={i} />
              ))}
            </div>
          )
        )}
      </div>

      {/* Sección aparte: Prototipos */}
      {prototipos.length > 0 && (
        <section id="prototipos" className="flex flex-col gap-10 border-t border-borde pt-16">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex max-w-[620px] flex-col gap-3">
              <Label>Prototipos y laboratorio</Label>
              <h2 className="h2-dm">Prototipos navegables y productos en pruebas.</h2>
              <p className="text-base leading-relaxed text-pizarra">
                Versiones funcionales que validamos antes de salir a producción o productos propios en fase de prueba.
              </p>
            </div>
            <span className="font-mono text-xs tracking-wider text-pizarra uppercase">
              {"// "}
              {prototipos.length} {prototipos.length === 1 ? "PROTOTIPO" : "PROTOTIPOS"}
            </span>
          </div>

          {destacadoPrototipo && <ProyectoDestacadoCard p={destacadoPrototipo} />}

          {restantesPrototipos.length > 0 && (
            <div
              className={`grid gap-6 ${
                restantesPrototipos.length === 1
                  ? "grid-cols-1"
                  : restantesPrototipos.length === 2
                    ? "sm:grid-cols-2"
                    : "sm:grid-cols-2 lg:grid-cols-3"
              }`}
            >
              {restantesPrototipos.map((p, idx) =>
                restantesPrototipos.length === 1 ? (
                  <ProyectoDestacadoCard key={p.slug} p={p} />
                ) : (
                  <Revelar key={p.slug} retraso={(idx + 1) * 80}>
                    <ProjectCard p={p} />
                  </Revelar>
                ),
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
