import "server-only";
import { eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { db, hasDb, schema } from "./db";

export type VideoTikTok = {
  id: string;
  url: string;
  texto: string;
  imagen: string | null;
  fecha: string; // AAAA-MM-DD
};

type VideoApi = {
  id?: string;
  title?: string;
  video_description?: string;
  create_time?: number;
  cover_image_url?: string;
  share_url?: string;
};

const API = "https://open.tiktokapis.com/v2";
/** Clave de `ajustes` con el refresh token (365 días). La guarda `npm run tiktok:setup`. */
export const CLAVE_TIKTOK_REFRESH = "tiktok_refresh";
const PERFIL = "https://www.tiktok.com/@devmart.co";

/** Convierte la respuesta de /v2/video/list/ al formato del muro. */
export function analizarVideos(videos: VideoApi[]): VideoTikTok[] {
  return videos
    .filter((v) => v.id && /^\d+$/.test(v.id))
    .map((v) => {
      // share_url trae parámetros de seguimiento; el reproductor solo necesita /@usuario/video/<id>.
      const compartir = v.share_url?.split("?")[0];
      return {
        id: v.id!,
        url: compartir && /\/video\/\d+$/.test(compartir) ? compartir : `${PERFIL}/video/${v.id}`,
        texto: (v.video_description || v.title || "").trim(),
        imagen: v.cover_image_url ?? null,
        fecha: v.create_time ? new Date(v.create_time * 1000).toISOString().slice(0, 10) : "",
      };
    });
}

/**
 * Pide un access token nuevo (dura 24 h) con el refresh token guardado. TikTok puede devolver otro
 * refresh token: si cambia, se guarda para la próxima vez.
 */
async function accessToken(clientKey: string, clientSecret: string): Promise<string | null> {
  const [fila] = await db()
    .select({ valor: schema.ajustes.valor })
    .from(schema.ajustes)
    .where(eq(schema.ajustes.clave, CLAVE_TIKTOK_REFRESH))
    .limit(1);
  if (!fila) return null;
  const res = await fetch(`${API}/oauth/token/`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_key: clientKey,
      client_secret: clientSecret,
      grant_type: "refresh_token",
      refresh_token: fila.valor,
    }),
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { access_token?: string; refresh_token?: string };
  if (json.refresh_token && json.refresh_token !== fila.valor) {
    await db()
      .update(schema.ajustes)
      .set({ valor: json.refresh_token })
      .where(eq(schema.ajustes.clave, CLAVE_TIKTOK_REFRESH));
  }
  return json.access_token ?? null;
}

/** Últimos videos de @devmart.co (Display API). Se refresca cada hora; sin configuración o si falla, lista vacía. */
export async function getTikTokVideos(): Promise<VideoTikTok[]> {
  "use cache";
  cacheTag("tiktok");
  cacheLife("hours");
  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET;
  if (!clientKey || !clientSecret || !hasDb) return [];
  try {
    const token = await accessToken(clientKey, clientSecret);
    if (!token) return [];
    const fields = "id,title,video_description,create_time,cover_image_url,share_url";
    const res = await fetch(`${API}/video/list/?fields=${fields}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ max_count: 12 }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return [];
    const json = (await res.json()) as { data?: { videos?: VideoApi[] }; error?: { code?: string } };
    if (json.error?.code && json.error.code !== "ok") return [];
    return analizarVideos(json.data?.videos ?? []);
  } catch {
    return [];
  }
}
