import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { analizarRss, esTecnologia, type Noticia } from "./noticias-rss";

/** Medios de tecnología en español que alimentan el muro Comunidad. */
const FUENTES = [
  // Xataka y Genbeta publican ofertas en /seleccion/ y /ofertas/: no son noticias.
  { nombre: "Xataka", feed: "https://www.xataka.com/feedburner.xml", excluir: /\/(seleccion|ofertas)\// },
  { nombre: "Genbeta", feed: "https://www.genbeta.com/feedburner.xml", excluir: /\/(seleccion|ofertas)\// },
  { nombre: "Hipertextual", feed: "https://hipertextual.com/feed", excluir: /\/(ofertas|tecnologia\/ofertas)\// },
] as const;

const POR_FUENTE = 3;

export type NoticiaConFuente = Noticia & { fuente: string };

async function leerFuente(f: (typeof FUENTES)[number]): Promise<NoticiaConFuente[]> {
  try {
    const res = await fetch(f.feed, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; RSS reader)", Accept: "application/rss+xml, application/xml" },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return [];
    return analizarRss(await res.text(), f.excluir)
      .filter(esTecnologia)
      .slice(0, POR_FUENTE)
      .map((n) => ({ ...n, fuente: f.nombre }));
  } catch {
    return [];
  }
}

/** Últimas noticias de tecnología. Se refresca cada pocas horas; un medio caído se omite. */
export async function getNoticias(): Promise<NoticiaConFuente[]> {
  "use cache";
  cacheTag("noticias");
  cacheLife("hours");
  const listas = await Promise.all(FUENTES.map(leerFuente));
  return listas.flat();
}
