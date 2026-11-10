import type { RedPublicacion } from "./db/schema";

// Utilidades del muro Comunidad sin dependencias de servidor (se prueban con tsx --test).

export type ItemMuro = {
  /** Clave única en el muro: «pub-3», «yt-abc», «blog-slug». */
  clave: string;
  tipo: RedPublicacion | "blog";
  /** id de la tabla publicaciones (para enlazar opiniones); null en YouTube y blog. */
  publicacionId: number | null;
  titulo: string;
  texto: string;
  url: string;
  imagen: string | null;
  imagenAlt: string;
  fecha: string;
  destacada: boolean;
  embed: string | null;
};

export type OpinionPublica = {
  id: number;
  autor: string;
  texto: string;
  valoracion: number;
  respuesta: string;
  publicacionId: number | null;
  fecha: string;
};

export const nombresRed: Record<ItemMuro["tipo"], string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  facebook: "Facebook",
  linkedin: "LinkedIn",
  x: "X",
  youtube: "YouTube",
  blog: "Blog",
};

/** Dominios aceptados para cada red: el enlace pegado en el panel debe ser de la red elegida. */
const dominios: Record<RedPublicacion, RegExp> = {
  instagram: /^(www\.)?instagram\.com$/,
  tiktok: /^(www\.|vm\.)?tiktok\.com$/,
  facebook: /^(www\.|m\.)?facebook\.com$|^fb\.watch$/,
  linkedin: /^(www\.)?linkedin\.com$/,
  x: /^(www\.)?(x|twitter)\.com$/,
  youtube: /^(www\.|m\.)?youtube\.com$|^youtu\.be$/,
};

export function enlaceValido(red: RedPublicacion, url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "https:" && dominios[red].test(u.hostname);
  } catch {
    return false;
  }
}

/**
 * URL del reproductor oficial de la red para incrustar la publicación en un iframe,
 * o null si la red no lo permite o el enlace no trae el identificador.
 */
export function embedDe(red: RedPublicacion, url: string): string | null {
  if (!enlaceValido(red, url)) return null;
  const u = new URL(url);
  const partes = u.pathname.split("/").filter(Boolean);
  switch (red) {
    case "instagram": {
      const i = partes.findIndex((p) => p === "p" || p === "reel" || p === "tv");
      const codigo = i >= 0 ? partes[i + 1] : undefined;
      return codigo && /^[\w-]+$/.test(codigo) ? `https://www.instagram.com/${partes[i]}/${codigo}/embed` : null;
    }
    case "tiktok": {
      const i = partes.indexOf("video");
      const vid = i >= 0 ? partes[i + 1] : undefined;
      return vid && /^\d+$/.test(vid) ? `https://www.tiktok.com/embed/v2/${vid}` : null;
    }
    case "facebook":
      return `https://www.facebook.com/plugins/post.php?href=${encodeURIComponent(url)}&show_text=true&width=500`;
    case "youtube": {
      const vid = u.hostname === "youtu.be" ? partes[0] : (u.searchParams.get("v") ?? (partes[0] === "shorts" ? partes[1] : undefined));
      return vid && /^[\w-]{11}$/.test(vid) ? `https://www.youtube-nocookie.com/embed/${vid}` : null;
    }
    default:
      return null;
  }
}

/** Nombre que se muestra en público: «Ana M.» en lugar del nombre completo. */
export function nombrePublico(nombre: string): string {
  const [primero = "", segundo = ""] = nombre.trim().split(/\s+/);
  return segundo ? `${primero} ${segundo[0]!.toUpperCase()}.` : primero;
}
