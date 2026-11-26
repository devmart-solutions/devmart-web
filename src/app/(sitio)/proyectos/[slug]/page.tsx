import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { EstadoBadge } from "@/components/ProjectCard";
import { ProyectoJsonLd } from "@/components/JsonLd";
import { ProyectoGaleria } from "@/components/proyectos/ProyectoGaleria";
import { ProyectoNavegacion } from "@/components/proyectos/ProyectoNavegacion";
import { CtaFinal, Label, Num } from "@/components/ui";
import { getProyecto, getProyectos } from "@/lib/data";

export async function generateStaticParams() {
  return (await getProyectos()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/proyectos/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProyecto(slug);
  if (!p) return {};
  return { title: `${p.cliente} · Caso`, description: p.resumen };
}

// Los params se leen dentro de <Suspense> para que la navegación muestre la cabecera al instante.
export default function CasoPage({ params }: PageProps<"/proyectos/[slug]">) {
  return (
    <Suspense fallback={<div className="min-h-[70vh]" />}>
      <Caso params={params} />
    </Suspense>
  );
}

async function Caso({ params }: Pick<PageProps<"/proyectos/[slug]">, "params">) {
  const { slug } = await params;
  const [p, todos] = await Promise.all([getProyecto(slug), getProyectos()]);
  if (!p) notFound();

  // Caso anterior y siguiente
  const index = todos.findIndex((item) => item.slug === p.slug);
  const anterior = index > 0 ? todos[index - 1]! : null;
  const siguiente = index >= 0 && index < todos.length - 1 ? todos[index + 1]! : null;

  // Galería de imágenes (usa galeria si existe o la imagen principal)
  const imagenes = p.galeria && p.galeria.length > 0 ? p.galeria : p.imagen ? [p.imagen] : [];

  return (
    <>
      <section className="container-dm flex flex-col gap-7 pt-12 pb-10 md:pt-[72px]">
        <Link
          href="/proyectos"
          className="inline-flex w-fit items-center gap-2 text-[15px] text-pizarra transition hover:text-noche"
        >
          <ArrowLeft size={18} strokeWidth={1.5} aria-hidden /> Proyectos
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <Label>{p.tipo}</Label>
          <EstadoBadge estado={p.estado} />
        </div>
        <h1 className="h1-hero max-w-[880px] font-display">{p.cliente}</h1>
        <p className="max-w-[680px] text-lg leading-[1.6] text-pizarra text-pretty">{p.resumen}</p>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
          <ul className="flex flex-wrap gap-2">
            {p.stack.map((t) => (
              <li key={t} className="rounded-full bg-cielo-tinte px-3.5 py-1.5 font-mono text-xs text-noche">
                {t}
              </li>
            ))}
          </ul>
          {p.url && (
            <a href={p.url} target="_blank" rel="noopener noreferrer" className="btn-secondary">
              {p.urlLabel ?? "Ver sitio"} <ArrowUpRight size={18} strokeWidth={1.5} aria-hidden />
            </a>
          )}
        </div>
      </section>

      {/* Galería de capturas interactiva */}
      <div className="container-dm pb-20">
        <ProyectoGaleria imagenes={imagenes} altPrincipal={p.imagenAlt ?? p.cliente} cliente={p.cliente} />
      </div>

      {/* Reto -> Solución -> Resultado */}
      <section className="bg-nube py-20 md:py-24">
        <div className="container-dm grid gap-6 lg:grid-cols-3">
          <article className="flex flex-col gap-4 rounded-card border border-borde/70 bg-blanco p-7 md:p-9 shadow-sm">
            <Num n={1} />
            <h2 className="h3-dm font-display">El reto</h2>
            <p className="text-[16px] leading-[1.65] text-texto-cuerpo text-pretty">{p.reto}</p>
          </article>
          <article className="flex flex-col gap-4 rounded-card border border-borde/70 bg-blanco p-7 md:p-9 shadow-sm">
            <Num n={2} />
            <h2 className="h3-dm font-display">La solución</h2>
            <ul className="flex flex-col gap-3.5">
              {p.solucion.map((s) => (
                <li key={s} className="border-l-2 border-cielo pl-4 text-[15px] leading-[1.6] text-texto-cuerpo">
                  {s}
                </li>
              ))}
            </ul>
          </article>
          <article className="flex flex-col gap-4 rounded-card border border-borde/70 bg-blanco p-7 md:p-9 shadow-sm">
            <Num n={3} />
            <h2 className="h3-dm font-display">El resultado</h2>
            <p className="text-[16px] leading-[1.65] text-texto-cuerpo text-pretty">{p.resultado}</p>
          </article>
        </div>
      </section>

      {/* Navegación anterior / siguiente */}
      <ProyectoNavegacion anterior={anterior} siguiente={siguiente} />

      <ProyectoJsonLd
        cliente={p.cliente}
        resumen={p.resumen}
        slug={p.slug}
        tipo={p.tipo}
        stack={p.stack}
        urlProyecto={p.url}
        imagen={p.imagen}
      />

      <CtaFinal title="¿Tienes un reto parecido? Hablemos." />
    </>
  );
}
