import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { portadaDe } from "./blog";
import { embedDe, intercalar, nombrePublico, type ItemMuro, type OpinionPublica } from "./comunidad";
import { getPosts } from "./data";
import { db, hasDb, schema } from "./db";
import { getInstagramMedia } from "./instagram";
import { getNoticias } from "./noticias";
import { getTikTokVideos } from "./tiktok";
import { getVideos } from "./youtube";

export const TAGS_COMUNIDAD = { publicaciones: "publicaciones", opiniones: "opiniones" } as const;

/** Publicaciones enlazadas desde el panel. */
async function getPublicaciones(): Promise<ItemMuro[]> {
  "use cache";
  cacheTag(TAGS_COMUNIDAD.publicaciones);
  cacheLife("max");
  if (!hasDb) return [];
  const filas = await db()
    .select()
    .from(schema.publicaciones)
    .where(eq(schema.publicaciones.publicado, true))
    .orderBy(desc(schema.publicaciones.fecha), desc(schema.publicaciones.id));
  return filas.map((p) => ({
    clave: `pub-${p.id}`,
    tipo: p.red,
    publicacionId: p.id,
    titulo: "",
    texto: p.texto,
    url: p.url,
    imagen: p.imagen,
    imagenAlt: p.imagenAlt,
    fecha: p.fecha,
    destacada: p.destacada,
    embed: embedDe(p.red, p.url),
  }));
}

/**
 * Todo lo que sale en el muro: redes, Instagram, TikTok y YouTube automáticos y blog, del más reciente
 * al más antiguo, con noticias de tecnología de otros medios intercaladas.
 */
export async function getMuro(): Promise<ItemMuro[]> {
  const [publicaciones, instagram, tiktok, videos, posts, noticias] = await Promise.all([
    getPublicaciones(),
    getInstagramMedia(),
    getTikTokVideos(),
    getVideos(),
    getPosts(),
    getNoticias(),
  ]);
  const enlazados = new Set(publicaciones.map((p) => p.embed));
  const items: ItemMuro[] = [
    ...publicaciones,
    // Las de Instagram que ya enlazaste en el panel no se repiten.
    ...instagram
      .map((m) => ({ m, embed: embedDe("instagram", m.url) }))
      .filter(({ embed }) => !enlazados.has(embed))
      .map(({ m, embed }) => ({
        clave: `ig-${m.id}`,
        tipo: "instagram" as const,
        publicacionId: null,
        titulo: "",
        texto: m.texto,
        url: m.url,
        imagen: m.imagen,
        imagenAlt: m.texto ? m.texto.slice(0, 120) : "Publicación de DevMart en Instagram",
        fecha: m.fecha,
        destacada: false,
        embed,
      })),
    // Igual con los videos de TikTok.
    ...tiktok
      .map((v) => ({ v, embed: embedDe("tiktok", v.url) }))
      .filter(({ embed }) => embed && !enlazados.has(embed))
      .map(({ v, embed }) => ({
        clave: `tt-${v.id}`,
        tipo: "tiktok" as const,
        publicacionId: null,
        titulo: "",
        texto: v.texto,
        url: v.url,
        imagen: v.imagen,
        imagenAlt: v.texto ? v.texto.slice(0, 120) : "Video de DevMart en TikTok",
        fecha: v.fecha,
        destacada: false,
        embed,
      })),
    ...videos
      .filter((v) => !enlazados.has(`https://www.youtube-nocookie.com/embed/${v.id}`))
      .map((v) => ({
        clave: `yt-${v.id}`,
        tipo: "youtube" as const,
        publicacionId: null,
        titulo: v.titulo,
        texto: v.descripcion,
        url: v.url,
        imagen: v.miniatura,
        imagenAlt: "",
        fecha: v.fecha.slice(0, 10),
        destacada: false,
        embed: `https://www.youtube-nocookie.com/embed/${v.id}`,
      })),
    ...posts.map((p) => ({
      clave: `blog-${p.slug}`,
      tipo: "blog" as const,
      publicacionId: null,
      titulo: p.titulo,
      texto: p.resumen,
      url: `/blog/${p.slug}`,
      ...portadaDe(p),
      fecha: p.fecha,
      destacada: false,
      embed: null,
    })),
  ];
  const externas: ItemMuro[] = noticias
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
    .map((n) => ({
      clave: `nt-${n.url}`,
      tipo: "noticia" as const,
      publicacionId: null,
      titulo: n.titulo,
      texto: n.resumen,
      url: n.url,
      imagen: n.imagen,
      imagenAlt: "",
      fecha: n.fecha,
      destacada: false,
      embed: null,
      fuente: n.fuente,
    }));
  return intercalar(
    items.sort((a, b) => b.fecha.localeCompare(a.fecha)),
    externas,
  );
}

/** Opiniones aprobadas, con el nombre del cliente abreviado. */
export async function getOpiniones(): Promise<OpinionPublica[]> {
  "use cache";
  cacheTag(TAGS_COMUNIDAD.opiniones);
  cacheLife("max");
  if (!hasDb) return [];
  const filas = await db()
    .select({
      id: schema.opiniones.id,
      nombre: schema.clientes.nombre,
      texto: schema.opiniones.texto,
      valoracion: schema.opiniones.valoracion,
      respuesta: schema.opiniones.respuesta,
      publicacionId: schema.opiniones.publicacionId,
      creado: schema.opiniones.creado,
    })
    .from(schema.opiniones)
    .innerJoin(schema.clientes, eq(schema.opiniones.clienteId, schema.clientes.id))
    .where(and(eq(schema.opiniones.estado, "aprobada"), eq(schema.clientes.activo, true)))
    .orderBy(desc(schema.opiniones.creado))
    .limit(60);
  return filas.map(({ nombre, creado, ...o }) => ({ ...o, autor: nombrePublico(nombre), fecha: creado.toISOString() }));
}

/** Publicaciones que el cliente puede elegir al comentar (las del panel, sin YouTube automático). */
export async function getOpcionesPublicacion() {
  const pubs = await getPublicaciones();
  return pubs.map((p) => ({ id: p.publicacionId!, etiqueta: `${p.tipo} · ${p.fecha} · ${p.texto.slice(0, 50)}` }));
}
