import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Label, PageHero } from "@/components/ui";
import { formatFecha, portadaDe } from "@/lib/blog";
import { getPosts } from "@/lib/data";

export const metadata: Metadata = {
  title: "Blog",
  description: "Ideas, procesos y consejos sobre desarrollo web, tiendas en línea y software a medida.",
};

export default async function BlogPage() {
  const posts = await getPosts();
  return (
    <>
      <PageHero
        label="Blog"
        title="Notas sobre construir producto."
        intro="Lo que aprendemos en cada proyecto, explicado sin tecnicismos."
      />
      <section className="pb-24">
        <div className="container-dm">
          <ul className="border-t border-borde">
            {posts.map((post) => {
              const { imagen, imagenAlt } = portadaDe(post);
              return (
              <li key={post.slug} className="border-b border-borde">
                <Link
                  href={`/blog/${post.slug}`}
                  className="group grid gap-3 py-8 md:grid-cols-[200px_1fr_220px] md:items-center md:gap-10"
                >
                  <div className="flex flex-row flex-wrap gap-x-4 gap-y-1 md:flex-col">
                    <Label>{post.categoria}</Label>
                    <time dateTime={post.fecha} className="font-mono text-xs text-pizarra">
                      {formatFecha(post.fecha)}
                    </time>
                  </div>
                  <div className="flex max-w-[720px] flex-col gap-2">
                    <h2 className="h3-dm text-[22px]! transition-colors group-hover:text-cielo-profundo md:text-[24px]!">
                      {post.titulo}
                    </h2>
                    <p className="text-[16px] leading-[1.55] text-pizarra text-pretty">{post.resumen}</p>
                    <span className="font-mono text-xs text-pizarra">{post.lecturaMin} min de lectura</span>
                  </div>
                  {imagen && (
                    <div className="relative order-first aspect-[16/10] overflow-hidden rounded-card border border-borde bg-nube md:order-none">
                      <Image
                        src={imagen}
                        alt={imagenAlt}
                        fill
                        sizes="(min-width: 768px) 220px, 100vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                  )}
                </Link>
              </li>
              );
            })}
          </ul>
        </div>
      </section>
    </>
  );
}
