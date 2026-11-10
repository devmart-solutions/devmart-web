import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { embedDe, nombrePublico, type ItemMuro, type OpinionPublica } from "./comunidad";
import { getPosts } from "./data";
import { db, hasDb, schema } from "./db";
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

/** Todo lo que sale en el muro, del más reciente al más antiguo: redes, videos de YouTube y blog. */
export async function getMuro(): Promise<ItemMuro[]> {
  const [publicaciones, videos, posts] = await Promise.all([getPublicaciones(), getVideos(), getPosts()]);
  const enlazados = new Set(publicaciones.map((p) => p.embed));
  const items: ItemMuro[] = [
    ...publicaciones,
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
      imagen: null,
      imagenAlt: "",
      fecha: p.fecha,
      destacada: false,
      embed: null,
    })),
  ];
  return items.sort((a, b) => b.fecha.localeCompare(a.fecha));
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
