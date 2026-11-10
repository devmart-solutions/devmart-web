import Link from "next/link";
import { Cube } from "@/components/Cube";
import { ProjectCard, ProjectSlot } from "@/components/ProjectCard";
import { Identidad } from "@/components/Identidad";
import { Revelar } from "@/components/Revelar";
import { CtaFinal } from "@/components/ui";
import { VideosYoutube } from "@/components/VideosYoutube";
import { proceso, servicios } from "@/lib/content";
import { getProyectos } from "@/lib/data";

export default async function Home() {
  const proyectos = await getProyectos();
  return (
    <>
      {/* Hero */}
      <section className="container-dm">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] items-center gap-12 pt-12 pb-12 md:pt-[72px]">
          <div className="flex flex-col gap-7">
            <span className="label-mono text-cielo-profundo">{"// DevMart Solutions"}</span>
            <h1 className="h1-hero">
              Software a medida para <span className="resaltado">tu negocio.</span>
            </h1>
            <p className="max-w-[460px] text-lg leading-[1.55] text-pizarra text-pretty">
              Creamos software web, móvil o lo que necesites para que tu idea se convierta en un
              producto real. Desde Cartagena, para toda Colombia.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/contacto" className="btn-primary">
                Empezar un proyecto
              </Link>
              <Link href="/proyectos" className="btn-secondary">
                Ver proyectos
              </Link>
            </div>
          </div>

          <div className="cube-hover relative flex min-h-[320px] items-center justify-center overflow-hidden rounded-panel bg-cielo-tinte">
            <div aria-hidden className="aurora pointer-events-none absolute inset-0" />
            <div className="cube-float relative">
              <Cube size={200} className="h-auto w-[160px] md:w-[200px]" />
            </div>
          </div>
        </div>

        {/* Fila de servicios */}
        <ul className="mt-6 mb-12 grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-8 border-t border-borde pt-7">
          {servicios.map((s, i) => (
            <Revelar como="li" key={s.slug} retraso={i * 80} className="flex flex-col gap-2">
              <span className="font-mono text-xs text-cielo-profundo">
                {String(i + 1).padStart(2, "0")}
              </span>
              <Link href={`/servicios#${s.slug}`} className="h3-dm transition-colors hover:text-cielo-profundo">
                {s.titulo}
              </Link>
            </Revelar>
          ))}
        </ul>
      </section>

      {/* Cinta de especialidades */}
      <div className="cinta-pausa overflow-hidden border-y border-borde bg-noche py-5 text-nube" aria-hidden>
        <div className="cinta flex w-max gap-10 whitespace-nowrap">
          {[0, 1].map((copia) => (
            <div key={copia} className="flex gap-10">
              {[...servicios.map((s) => s.titulo), "Prototipo primero", "El código es tuyo", "Desde Cartagena"].map((t) => (
                <span key={t} className="flex items-center gap-10 font-display text-xl font-bold tracking-[-0.04em] md:text-2xl">
                  {t}
                  <span className="size-2.5 rotate-45 bg-cielo" />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <Identidad />

      {/* Proyectos destacados */}
      <section className="bg-nube py-24">
        <div className="container-dm flex flex-col gap-12">
          <Revelar className="flex flex-wrap items-end justify-between gap-6">
            <div className="flex flex-col gap-3.5">
              <span className="label-mono text-cielo-profundo">{"// Proyectos"}</span>
              <h2 className="h2-dm">Ideas que ya son producto.</h2>
            </div>
            <Link href="/proyectos" className="btn-secondary">
              Ver todos
            </Link>
          </Revelar>

          <div className="grid gap-6 md:grid-cols-3">
            {proyectos.slice(0, 3).map((p, i) => (
              <Revelar key={p.slug} retraso={i * 120}>
                <ProjectCard p={p} />
              </Revelar>
            ))}
            {Array.from({ length: Math.max(0, 3 - proyectos.length) }, (_, i) => (
              <ProjectSlot key={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Proceso */}
      <section className="py-24">
        <div className="container-dm flex flex-col gap-12">
          <Revelar className="flex max-w-[560px] flex-col gap-3.5">
            <span className="label-mono text-cielo-profundo">{"// Proceso"}</span>
            <h2 className="h2-dm">De la idea al lanzamiento, paso a paso.</h2>
          </Revelar>
          <ol className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,220px),1fr))] gap-8">
            {proceso.map((paso, i) => (
              <Revelar como="li" key={paso.titulo} retraso={i * 120} className="group flex flex-col gap-3 border-t border-borde pt-7 transition-colors hover:border-cielo">
                <span className="font-display text-[40px] leading-none font-bold tracking-[-0.05em] text-cielo-profundo">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="h3-dm">{paso.titulo}</h3>
                <p className="text-base leading-[1.55] text-texto-cuerpo text-pretty">{paso.texto}</p>
              </Revelar>
            ))}
          </ol>
        </div>
      </section>

      <VideosYoutube />

      <CtaFinal />
    </>
  );
}
