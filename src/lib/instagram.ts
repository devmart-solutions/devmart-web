import "server-only";
import { cacheLife, cacheTag } from "next/cache";

export type PublicacionInstagram = {
  id: string;
  url: string;
  texto: string;
  imagen: string | null;
  fecha: string; // AAAA-MM-DD
  tipo: "imagen" | "video" | "carrusel";
};

type MediaGraph = {
  id: string;
  caption?: string;
  media_type?: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  media_url?: string;
  thumbnail_url?: string;
  permalink?: string;
  timestamp?: string;
};

const GRAPH = "https://graph.facebook.com/v27.0";
const TIPOS = { IMAGE: "imagen", VIDEO: "video", CAROUSEL_ALBUM: "carrusel" } as const;

/** Convierte la respuesta de /{ig-user-id}/media al formato del muro. */
export function analizarMedia(data: MediaGraph[]): PublicacionInstagram[] {
  return data
    .filter((m) => m.id && m.permalink)
    .map((m) => ({
      id: m.id,
      url: m.permalink!,
      texto: m.caption?.trim() ?? "",
      imagen: (m.media_type === "VIDEO" ? m.thumbnail_url : m.media_url) ?? m.thumbnail_url ?? null,
      fecha: m.timestamp?.slice(0, 10) ?? "",
      tipo: TIPOS[m.media_type ?? "IMAGE"] ?? "imagen",
    }));
}

/** Últimas publicaciones de @devmart.co (Graph API). Se refresca cada hora; sin token o si falla, lista vacía. */
export async function getInstagramMedia(): Promise<PublicacionInstagram[]> {
  "use cache";
  cacheTag("instagram");
  cacheLife("hours");
  const token = process.env.META_IG_TOKEN;
  const usuario = process.env.META_IG_USER_ID;
  if (!token || !usuario) return [];
  try {
    const params = new URLSearchParams({
      fields: "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp",
      limit: "12",
      access_token: token,
    });
    const res = await fetch(`${GRAPH}/${usuario}/media?${params}`, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return [];
    const json = (await res.json()) as { data?: MediaGraph[] };
    return analizarMedia(json.data ?? []);
  } catch {
    return [];
  }
}
