"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowUpRight, FileText, MessageCircle, Newspaper, Play, Star } from "lucide-react";
import { SocialIcon } from "../SocialIcon";
import { nombresRed, type ItemMuro, type OpinionPublica } from "@/lib/comunidad";

type Filtro = ItemMuro["tipo"] | "todo";

const altoEmbed: Partial<Record<ItemMuro["tipo"], string>> = {
  instagram: "h-[620px]",
  tiktok: "h-[740px]",
  facebook: "h-[560px]",
  youtube: "aspect-video",
};

const fecha = (iso: string) =>
  new Date(`${iso.slice(0, 10)}T12:00:00`).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" });

function Icono({ tipo, size = 18 }: { tipo: ItemMuro["tipo"]; size?: number }) {
  if (tipo === "blog") return <FileText size={size} strokeWidth={1.75} aria-hidden />;
  if (tipo === "noticia") return <Newspaper size={size} strokeWidth={1.75} aria-hidden />;
  return <SocialIcon red={tipo} size={size} />;
}

/** Muro de publicaciones con filtros por red. Los reproductores de cada red se cargan solo al pulsar. */
export function Muro({ items, opiniones }: { items: ItemMuro[]; opiniones: OpinionPublica[] }) {
  const [filtro, setFiltro] = useState<Filtro>("todo");
  const tipos = useMemo(() => [...new Set(items.map((i) => i.tipo))], [items]);
  const visibles = filtro === "todo" ? items : items.filter((i) => i.tipo === filtro);
  const porPublicacion = useMemo(() => {
    const m = new Map<number, OpinionPublica[]>();
    for (const o of opiniones) if (o.publicacionId) m.set(o.publicacionId, [...(m.get(o.publicacionId) ?? []), o]);
    return m;
  }, [opiniones]);

  if (items.length === 0) {
    return <p className="rounded-card border border-dashed border-borde p-10 text-center text-pizarra">Muy pronto verás aquí nuestras publicaciones.</p>;
  }

  return (
    <div className="flex flex-col gap-8">
      <div role="group" aria-label="Filtrar por red" className="flex flex-wrap gap-2">
        {(["todo", ...tipos] as Filtro[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setFiltro(t)}
            aria-pressed={filtro === t}
            className="inline-flex items-center gap-2 rounded-full border border-borde px-4 py-2 text-[15px] font-medium text-pizarra transition-all duration-200 hover:-translate-y-0.5 hover:border-noche hover:text-noche aria-pressed:border-noche aria-pressed:bg-noche aria-pressed:text-blanco"
          >
            {t !== "todo" && <Icono tipo={t} size={15} />}
            {t === "todo" ? "Todo" : nombresRed[t]}
            <span className="font-mono text-xs opacity-60">{t === "todo" ? items.length : items.filter((i) => i.tipo === t).length}</span>
          </button>
        ))}
      </div>

      <div key={filtro} className="columns-1 gap-6 sm:columns-2 lg:columns-3">
        {visibles.map((item, i) => (
          <Tarjeta
            key={item.clave}
            item={item}
            orden={i}
            comentarios={item.publicacionId ? (porPublicacion.get(item.publicacionId) ?? []) : []}
          />
        ))}
      </div>
    </div>
  );
}

function Tarjeta({ item, orden, comentarios }: { item: ItemMuro; orden: number; comentarios: OpinionPublica[] }) {
  const [verAqui, setVerAqui] = useState(false);
  const [verComentarios, setVerComentarios] = useState(false);
  const interno = item.tipo === "blog";
  const enlace = interno ? (
    <Link href={item.url} className="inline-flex items-center gap-1.5 font-medium text-cielo-profundo hover:underline">
      Leer artículo <ArrowUpRight size={16} aria-hidden />
    </Link>
  ) : (
    <a href={item.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-medium text-cielo-profundo hover:underline">
      {item.tipo === "noticia" ? `Leer en ${item.fuente}` : `Abrir en ${nombresRed[item.tipo]}`} <ArrowUpRight size={16} aria-hidden />
    </a>
  );

  return (
    <article
      className="muro-tarjeta group mb-6 break-inside-avoid overflow-hidden rounded-card border border-borde bg-blanco transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:border-cielo hover:shadow-elevada"
      style={{ animationDelay: `${Math.min(orden, 8) * 70}ms` }}
    >
      {verAqui && item.embed ? (
        <iframe
          src={item.tipo === "youtube" ? `${item.embed}?autoplay=1&rel=0` : item.embed}
          title={item.titulo || `Publicación en ${nombresRed[item.tipo]}`}
          allow="autoplay; encrypted-media; picture-in-picture; clipboard-write"
          allowFullScreen
          loading="lazy"
          className={`w-full border-0 bg-nube ${altoEmbed[item.tipo] ?? "h-[560px]"}`}
        />
      ) : item.imagen ? (
        <button
          type="button"
          disabled={!item.embed}
          onClick={() => setVerAqui(true)}
          className="relative block w-full overflow-hidden bg-noche disabled:cursor-default"
          aria-label={item.embed ? `Ver aquí: ${item.titulo || item.texto.slice(0, 60)}` : undefined}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={item.imagen} alt={item.imagenAlt} loading="lazy" referrerPolicy="no-referrer" className="w-full object-cover transition-transform duration-500 group-hover:scale-105" />
          {item.embed && (
            <span className="absolute inset-0 flex items-center justify-center bg-noche/0 transition-colors group-hover:bg-noche/25">
              <span className="play-pulso flex size-14 items-center justify-center rounded-full bg-cielo text-noche">
                <Play size={22} fill="currentColor" className="ml-0.5" aria-hidden />
              </span>
            </span>
          )}
        </button>
      ) : (
        <div className={`muro-portada muro-${item.tipo} flex aspect-[16/10] items-center justify-center text-blanco`}>
          <Icono tipo={item.tipo} size={44} />
        </div>
      )}

      <div className="flex flex-col gap-3 p-6">
        <div className="flex items-center justify-between gap-3 text-sm text-pizarra">
          <span className="inline-flex items-center gap-2 font-medium text-noche">
            <Icono tipo={item.tipo} size={15} /> {item.tipo === "noticia" ? item.fuente : nombresRed[item.tipo]}
          </span>
          <span className="font-mono text-xs">{fecha(item.fecha)}</span>
        </div>
        {item.destacada && <span className="label-mono w-fit rounded-full bg-cielo-tinte px-2.5 py-1 text-[11px] text-cielo-profundo">Destacada</span>}
        {item.titulo && <h3 className="h3-dm text-pretty">{item.titulo}</h3>}
        {item.texto && <p className="line-clamp-5 text-[15px] leading-[1.6] whitespace-pre-line text-texto-cuerpo">{item.texto}</p>}
        <div className="mt-1 flex flex-wrap items-center gap-x-5 gap-y-2 text-[15px]">
          {item.embed && !item.imagen && !verAqui && (
            <button type="button" onClick={() => setVerAqui(true)} className="inline-flex items-center gap-1.5 font-medium text-noche hover:text-cielo-profundo">
              <Play size={15} aria-hidden /> Ver aquí
            </button>
          )}
          {enlace}
          {comentarios.length > 0 && (
            <button
              type="button"
              onClick={() => setVerComentarios((v) => !v)}
              aria-expanded={verComentarios}
              className="inline-flex items-center gap-1.5 text-pizarra hover:text-noche"
            >
              <MessageCircle size={15} aria-hidden /> {comentarios.length}
            </button>
          )}
        </div>
        {verComentarios && (
          <ul className="mt-2 flex flex-col gap-3 border-t border-borde pt-4">
            {comentarios.map((c) => (
              <li key={c.id} className="flex flex-col gap-1.5 text-[14px] leading-[1.55]">
                <span className="flex items-center gap-2 font-medium">
                  {c.autor}
                  <span className="inline-flex text-cielo-profundo" aria-label={`${c.valoracion} de 5`}>
                    {Array.from({ length: c.valoracion }, (_, k) => (
                      <Star key={k} size={12} fill="currentColor" aria-hidden />
                    ))}
                  </span>
                </span>
                <p className="text-texto-cuerpo">{c.texto}</p>
                {c.respuesta && (
                  <p className="rounded-xl bg-nube px-3 py-2 text-texto-cuerpo">
                    <span className="label-mono mr-2 text-[11px] text-cielo-profundo">DevMart</span>
                    {c.respuesta}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}
