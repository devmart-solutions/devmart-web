"use server";

import { eq } from "drizzle-orm";
import { refresh, updateTag } from "next/cache";
import { z } from "zod";
import type { FormState } from "@/lib/admin/actions";
import { archivoDe, borrarImagen, subirImagen } from "@/lib/admin/imagenes";
import { requireAdmin } from "@/lib/auth/dal";
import { enlaceValido, nombresRed } from "@/lib/comunidad";
import { TAGS_COMUNIDAD } from "@/lib/comunidad-datos";
import { db, schema } from "@/lib/db";
import { estadosOpinion, redesPublicacion } from "@/lib/db/schema";
import { registrar } from "@/lib/security";

// Acciones del panel para el muro Comunidad: publicaciones enlazadas y moderación de opiniones.

const id = z.coerce.number().int().positive();

function campos(fd: FormData) {
  return Object.fromEntries([...fd.entries()].filter(([, v]) => typeof v === "string")) as Record<string, string>;
}

const publicacionSchema = z
  .object({
    id: z
      .string()
      .optional()
      .transform((s) => (s ? Number(s) : null)),
    red: z.enum(redesPublicacion, "Elige la red."),
    url: z.string().trim().max(500),
    texto: z.string().trim().min(3, "Texto: escribe al menos 3 caracteres.").max(600, "Texto: máximo 600 caracteres."),
    fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha: usa AAAA-MM-DD."),
    imagenAlt: z.string().trim().max(200).default(""),
    quitarImagen: z.string().optional(),
    destacada: z.string().optional(),
    publicado: z.string().optional(),
  })
  .refine((v) => enlaceValido(v.red, v.url), {
    message: "Enlace: pega la URL https:// de la publicación en la red elegida.",
  });

export async function guardarPublicacion(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = publicacionSchema.safeParse(campos(fd));
  if (!parsed.success) return { ok: false, errors: parsed.error.issues.map((i) => i.message) };
  const { id: pubId, quitarImagen, destacada, publicado, ...v } = parsed.data;

  const archivo = archivoDe(fd, "imagen");
  const [actual] = pubId
    ? await db().select({ imagen: schema.publicaciones.imagen }).from(schema.publicaciones).where(eq(schema.publicaciones.id, pubId)).limit(1)
    : [];
  if (pubId && !actual) return { ok: false, errors: ["Publicación no encontrada."] };
  const quitar = quitarImagen === "on" && !archivo;
  let imagen = quitar ? null : (actual?.imagen ?? null);
  if (archivo) {
    const subida = await subirImagen(archivo, `comunidad/${v.red}`);
    if ("error" in subida) return { ok: false, errors: [subida.error] };
    imagen = subida.url;
  }
  const valores = {
    ...v,
    imagenAlt: v.imagenAlt || `Publicación de DevMart en ${nombresRed[v.red]}`,
    imagen,
    destacada: destacada === "on",
    publicado: publicado === "on",
  };
  if (pubId) {
    await db().update(schema.publicaciones).set(valores).where(eq(schema.publicaciones.id, pubId));
  } else {
    await db().insert(schema.publicaciones).values(valores);
  }
  if (actual?.imagen && actual.imagen !== imagen) await borrarImagen(actual.imagen);
  updateTag(TAGS_COMUNIDAD.publicaciones);
  await registrar(pubId ? "publicacion.editada" : "publicacion.creada", `${v.red} · ${v.url}`);
  refresh();
  return { ok: true, message: pubId ? "Publicación guardada." : "Publicación añadida al muro." };
}

export async function eliminarPublicacion(fd: FormData) {
  await requireAdmin();
  const pubId = id.safeParse(fd.get("id"));
  if (!pubId.success) return;
  const [borrada] = await db()
    .delete(schema.publicaciones)
    .where(eq(schema.publicaciones.id, pubId.data))
    .returning({ imagen: schema.publicaciones.imagen });
  await borrarImagen(borrada?.imagen);
  updateTag(TAGS_COMUNIDAD.publicaciones);
  updateTag(TAGS_COMUNIDAD.opiniones);
  await registrar("publicacion.eliminada", `#${pubId.data}`);
  refresh();
}

const moderarSchema = z.object({
  id,
  estado: z.enum(estadosOpinion, "Elige el estado."),
  respuesta: z.string().trim().max(1200, "Respuesta: máximo 1200 caracteres.").default(""),
});

export async function moderarOpinion(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = moderarSchema.safeParse(campos(fd));
  if (!parsed.success) return { ok: false, errors: parsed.error.issues.map((i) => i.message) };
  const [fila] = await db()
    .update(schema.opiniones)
    .set({ estado: parsed.data.estado, respuesta: parsed.data.respuesta })
    .where(eq(schema.opiniones.id, parsed.data.id))
    .returning({ id: schema.opiniones.id });
  if (!fila) return { ok: false, errors: ["Opinión no encontrada."] };
  updateTag(TAGS_COMUNIDAD.opiniones);
  await registrar("opinion.moderada", `#${fila.id} → ${parsed.data.estado}${parsed.data.respuesta ? " (con respuesta)" : ""}`);
  refresh();
  return { ok: true, message: parsed.data.estado === "aprobada" ? "Opinión publicada en el muro." : "Opinión actualizada." };
}

export async function eliminarOpinion(fd: FormData) {
  await requireAdmin();
  const opId = id.safeParse(fd.get("id"));
  if (!opId.success) return;
  await db().delete(schema.opiniones).where(eq(schema.opiniones.id, opId.data));
  updateTag(TAGS_COMUNIDAD.opiniones);
  await registrar("opinion.eliminada", `#${opId.data}`);
  refresh();
}
