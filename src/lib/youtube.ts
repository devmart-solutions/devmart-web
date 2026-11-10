import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { YOUTUBE_CANAL } from "./site";

export type Video = { id: string; titulo: string; fecha: string; descripcion: string; url: string; miniatura: string };

const decodificar = (s: string) =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

const campo = (xml: string, etiqueta: string) =>
  decodificar(xml.match(new RegExp(`<${etiqueta}[^>]*>([\\s\\S]*?)</${etiqueta}>`))?.[1]?.trim() ?? "");

/** Analiza el feed Atom público de un canal de YouTube. */
export function analizarFeed(xml: string): Video[] {
  return [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)]
    .map(([, e]) => {
      const id = campo(e, "yt:videoId");
      return {
        id,
        titulo: campo(e, "title"),
        fecha: campo(e, "published"),
        descripcion: campo(e, "media:description").split("\n")[0] ?? "",
        url: `https://www.youtube.com/watch?v=${id}`,
        miniatura: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
      };
    })
    .filter((v) => /^[\w-]{11}$/.test(v.id));
}

/** Últimos videos del canal (feed RSS, sin API key). Se refresca cada hora; si falla, lista vacía. */
export async function getVideos(): Promise<Video[]> {
  "use cache";
  cacheTag("youtube");
  cacheLife("hours");
  try {
    const res = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${YOUTUBE_CANAL.id}`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return [];
    return analizarFeed(await res.text());
  } catch {
    return [];
  }
}
