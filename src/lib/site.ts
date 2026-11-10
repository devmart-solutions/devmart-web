export const site = {
  name: "DevMart Solutions",
  city: "Cartagena de Indias",
  description:
    "DevMart crea software a medida —web, móvil o lo que necesites— para personas y negocios que tienen una idea y quieren convertirla en producto.",
  // Pendiente de confirmar: se muestra solo si está definido.
  email: process.env.NEXT_PUBLIC_EMAIL ?? "",
};

/** URL pública del sitio (dominio pendiente de elegir). */
export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");

export const nav = [
  { href: "/servicios", label: "Servicios" },
  { href: "/proyectos", label: "Proyectos" },
  { href: "/nosotros", label: "Nosotros" },
  { href: "/blog", label: "Blog" },
  { href: "/comunidad", label: "Comunidad" },
  { href: "/precios", label: "Precios" },
] as const;

/** WhatsApp Business de DevMart en formato internacional sin «+». Único lugar donde vive el número. */
export const WHATSAPP_NUMERO = "573137135653";

/** El mismo número como se muestra a los visitantes. */
export const WHATSAPP_VISIBLE = "+57 313 713 5653";

/** Mensaje con el que se abre la conversación desde el sitio. */
export const WHATSAPP_MENSAJE = "Hola, vengo desde la página de DevMart Solutions y quiero información sobre sus servicios.";

export function whatsappHref(message = WHATSAPP_MENSAJE) {
  return `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(message)}`;
}

/** Coordenadas del estudio (Cartagena de Indias) que muestra el pie. */
export const coordenadas = "10.39° N · 75.48° O";

export type RedSocial = "instagram" | "youtube" | "linkedin" | "tiktok" | "facebook" | "github" | "x";

/** Canal de YouTube: su feed RSS alimenta la sección de videos. */
export const YOUTUBE_CANAL = {
  url: process.env.NEXT_PUBLIC_YOUTUBE || "https://www.youtube.com/@devmartsolutions",
  id: "UCiFnEGD4sBWGqiMfGnclTMA",
};

/**
 * Perfiles en redes. Cada uno aparece en el pie solo cuando su variable tiene la URL del perfil.
 * Se leen por nombre completo para que Next.js las incruste en el cliente.
 */
const perfiles: { red: RedSocial; label: string; url: string | undefined }[] = [
  { red: "instagram", label: "Instagram", url: process.env.NEXT_PUBLIC_INSTAGRAM },
  { red: "youtube", label: "YouTube", url: YOUTUBE_CANAL.url },
  { red: "linkedin", label: "LinkedIn", url: process.env.NEXT_PUBLIC_LINKEDIN },
  { red: "tiktok", label: "TikTok", url: process.env.NEXT_PUBLIC_TIKTOK },
  { red: "facebook", label: "Facebook", url: process.env.NEXT_PUBLIC_FACEBOOK },
  { red: "github", label: "GitHub", url: process.env.NEXT_PUBLIC_GITHUB },
  { red: "x", label: "X", url: process.env.NEXT_PUBLIC_X },
];

export const redes = perfiles
  .filter((p): p is typeof p & { url: string } => !!p.url && /^https:\/\//.test(p.url))
  .map(({ red, label, url }) => ({ red, label, url }));
