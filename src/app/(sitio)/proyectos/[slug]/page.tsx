import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { EstadoBadge } from "@/components/ProjectCard";
import { ProyectoJsonLd } from "@/components/JsonLd";
import { CtaFinal, ImagePlaceholder, Label, Num } from "@/components/ui";
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
  const p = await getProyecto(slug);
  if (!p) notFound();

  return (
    <>
      <section className="container-dm flex flex-col gap-7 pt-12 pb-12 md:pt-[72px]">
        <Link
          href="/proyectos"
          className="inline-flex w-fit items-center gap-2 text-[15px] text-pizarra hover:text-noche"
        >
          <ArrowLeft size={18} strokeWidth={1.5} aria-hidden /> Proyectos
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <Label>{p.tipo}</Label>
          <EstadoBadge estado={p.estado} />
        </div>
        <h1 className="h1-hero max-w-[880px]">{p.cliente}</h1>
        <p className="max-w-[620px] text-lg leading-[1.55] text-pizarra text-pretty">{p.resumen}</p>
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

      <div className="container-dm pb-24">
        {p.imagen ? (
          <div className="relative aspect-[16/9] overflow-hidden rounded-panel bg-nube">
            <Image src={p.imagen} alt={p.imagenAlt ?? ""} fill loading="eager" sizes="(min-width: 1280px) 1200px, 100vw" className="object-cover" />
          </div>
        ) : (
          <ImagePlaceholder className="aspect-[16/9] rounded-panel" />
        )}
      </div>

      <section className="bg-nube py-24">
        <div className="container-dm grid gap-6 lg:grid-cols-3">
          <article className="flex flex-col gap-4 rounded-card bg-blanco p-7 md:p-9">
            <Num n={1} />
            <h2 className="h3-dm">El reto</h2>
            <p className="text-[17px] leading-[1.6] text-texto-cuerpo text-pretty">{p.reto}</p>
          </article>
          <article className="flex flex-col gap-4 rounded-card bg-blanco p-7 md:p-9">
            <Num n={2} />
            <h2 className="h3-dm">La solución</h2>
            <ul className="flex flex-col gap-3">
              {p.solucion.map((s) => (
                <li key={s} className="border-l-2 border-cielo pl-4 text-[16px] leading-[1.55] text-texto-cuerpo">
                  {s}
                </li>
              ))}
            </ul>
          </article>
          <article className="flex flex-col gap-4 rounded-card bg-blanco p-7 md:p-9">
            <Num n={3} />
            <h2 className="h3-dm">El resultado</h2>
            <p className="text-[17px] leading-[1.6] text-texto-cuerpo text-pretty">{p.resultado}</p>
          </article>
        </div>
      </section>

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
