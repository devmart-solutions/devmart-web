import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { posts as postsEstaticos, type Post as PostIndice } from "./blog";
import { precios as preciosEstaticos, proyectos as proyectosEstaticos, type Precio, type Proyecto } from "./content";
import { db, hasDb, schema } from "./db";

// Lectura del contenido público (blog, proyectos, precios).
// Con base de datos, el contenido sale de Neon y se edita en /admin; las páginas quedan en caché
// y el panel las invalida con updateTag. Sin DATABASE_URL se usa el contenido estático de src/lib.

export type Post = PostIndice & { cuerpo: string };
export type { Precio, Proyecto };

export const TAGS = { posts: "posts", proyectos: "proyectos", precios: "precios", equipo: "equipo" } as const;

/** Claves de la tabla `ajustes` que se editan desde el panel. */
export const AJUSTES = { fotoEquipo: "foto_equipo", fotoEquipoAlt: "foto_equipo_alt" } as const;

async function cuerpoEstatico(slug: string) {
  return readFile(join(process.cwd(), "src/content/blog", `${slug}.md`), "utf8").catch(() => "");
}

const postColumns = {
  slug: schema.posts.slug,
  titulo: schema.posts.titulo,
  resumen: schema.posts.resumen,
  categoria: schema.posts.categoria,
  fecha: schema.posts.fecha,
  lecturaMin: schema.posts.lecturaMin,
  imagen: schema.posts.imagen,
  imagenAlt: schema.posts.imagenAlt,
};

/** Artículos publicados, del más reciente al más antiguo (sin el cuerpo). */
export async function getPosts(): Promise<PostIndice[]> {
  "use cache";
  cacheTag(TAGS.posts);
  cacheLife("max");
  if (!hasDb) return [...postsEstaticos].sort((a, b) => b.fecha.localeCompare(a.fecha));
  return db()
    .select(postColumns)
    .from(schema.posts)
    .where(eq(schema.posts.publicado, true))
    .orderBy(desc(schema.posts.fecha), desc(schema.posts.id));
}

export async function getPost(slug: string): Promise<Post | null> {
  "use cache";
  cacheTag(TAGS.posts);
  cacheLife("max");
  if (!hasDb) {
    const p = postsEstaticos.find((x) => x.slug === slug);
    return p ? { ...p, cuerpo: await cuerpoEstatico(slug) } : null;
  }
  const [row] = await db()
    .select({ ...postColumns, cuerpo: schema.posts.cuerpo })
    .from(schema.posts)
    .where(and(eq(schema.posts.slug, slug), eq(schema.posts.publicado, true)))
    .limit(1);
  return row ?? null;
}

const proyectoColumns = {
  slug: schema.proyectos.slug,
  cliente: schema.proyectos.cliente,
  tipo: schema.proyectos.tipo,
  resumen: schema.proyectos.resumen,
  stack: schema.proyectos.stack,
  url: schema.proyectos.url,
  urlLabel: schema.proyectos.urlLabel,
  reto: schema.proyectos.reto,
  solucion: schema.proyectos.solucion,
  resultado: schema.proyectos.resultado,
  estado: schema.proyectos.estado,
  imagen: schema.proyectos.imagen,
  imagenAlt: schema.proyectos.imagenAlt,
};

type ProyectoFila = { url: string | null; urlLabel: string | null; imagen: string | null } & Omit<Proyecto, "url" | "urlLabel" | "imagen">;

function limpiarProyecto(p: ProyectoFila): Proyecto {
  return { ...p, url: p.url ?? undefined, urlLabel: p.urlLabel ?? undefined, imagen: p.imagen ?? undefined };
}

export async function getProyectos(): Promise<Proyecto[]> {
  "use cache";
  cacheTag(TAGS.proyectos);
  cacheLife("max");
  if (!hasDb) return proyectosEstaticos;
  const rows = await db()
    .select(proyectoColumns)
    .from(schema.proyectos)
    .where(eq(schema.proyectos.publicado, true))
    .orderBy(asc(schema.proyectos.orden), asc(schema.proyectos.id));
  return rows.map(limpiarProyecto);
}

export async function getProyecto(slug: string): Promise<Proyecto | null> {
  "use cache";
  cacheTag(TAGS.proyectos);
  cacheLife("max");
  if (!hasDb) return proyectosEstaticos.find((p) => p.slug === slug) ?? null;
  const [row] = await db()
    .select(proyectoColumns)
    .from(schema.proyectos)
    .where(and(eq(schema.proyectos.slug, slug), eq(schema.proyectos.publicado, true)))
    .limit(1);
  return row ? limpiarProyecto(row) : null;
}

/** Foto del equipo de /nosotros (null = placeholder). */
export async function getFotoEquipo(): Promise<{ url: string; alt: string } | null> {
  "use cache";
  cacheTag(TAGS.equipo);
  cacheLife("max");
  if (!hasDb) return null;
  const rows = await db()
    .select()
    .from(schema.ajustes)
    .where(inArray(schema.ajustes.clave, [AJUSTES.fotoEquipo, AJUSTES.fotoEquipoAlt]));
  const valor = (clave: string) => rows.find((r) => r.clave === clave)?.valor ?? "";
  const url = valor(AJUSTES.fotoEquipo);
  return url ? { url, alt: valor(AJUSTES.fotoEquipoAlt) } : null;
}

export async function getPrecios(): Promise<Precio[]> {
  "use cache";
  cacheTag(TAGS.precios);
  cacheLife("max");
  if (!hasDb) return preciosEstaticos;
  const rows = await db()
    .select({
      tipo: schema.precios.tipo,
      descripcion: schema.precios.descripcion,
      incluye: schema.precios.incluye,
      rango: schema.precios.rango,
      tipoFormulario: schema.precios.tipoFormulario,
    })
    .from(schema.precios)
    .orderBy(asc(schema.precios.orden), asc(schema.precios.id));
  return rows as Precio[];
}
