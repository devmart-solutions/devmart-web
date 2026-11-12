"use server";

import { eq } from "drizzle-orm";
import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/dal";
import { credenciales } from "@/lib/auth/config";
import { guardarCredenciales } from "@/lib/auth/cuenta";
import { hashPassword, problemaPassword, verifyPassword } from "@/lib/auth/password";
import { createSession, destroySession, revocarSesiones } from "@/lib/auth/session";
import { esSecretoTotp, verifyTotp } from "@/lib/auth/totp";
import { tiposProyecto } from "@/lib/content";
import { AJUSTES, TAGS } from "@/lib/data";
import { db, schema } from "@/lib/db";
import { estadosMensaje, estadosProyecto } from "@/lib/db/schema";
import { archivoDe, borrarImagen, subirImagen } from "@/lib/admin/imagenes";
import { registrar } from "@/lib/security";

// Acciones del panel. Cada una vuelve a verificar la sesión (no se confía en el cliente),
// valida la entrada con zod y registra el cambio en la actividad.

export type FormState = { ok?: boolean; message?: string; errors?: string[] };

const texto = (min: number, max: number, campo: string) =>
  z
    .string()
    .trim()
    .min(min, `${campo}: escribe al menos ${min} caracteres.`)
    .max(max, `${campo}: máximo ${max} caracteres.`);
const lista = z
  .string()
  .default("")
  .transform((s) =>
    s
      .split("\n")
      .map((x) => x.trim())
      .filter(Boolean)
      .slice(0, 30),
  );
const slugSchema = z
  .string()
  .trim()
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$|^$/, "Slug: usa minúsculas, números y guiones.");
const urlOpcional = z
  .string()
  .trim()
  .max(300)
  .refine((s) => s === "" || /^https?:\/\/\S+$/.test(s), "URL: debe empezar por https://")
  .transform((s) => s || null);

function slugify(s: string) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function campos(fd: FormData) {
  return Object.fromEntries([...fd.entries()].filter(([, v]) => typeof v === "string")) as Record<string, string>;
}

function errores(e: z.ZodError): FormState {
  return { ok: false, errors: e.issues.map((i) => i.message) };
}

function idDe(fd: FormData) {
  const n = Number(fd.get("id"));
  return Number.isInteger(n) && n > 0 ? n : null;
}

function esDuplicado(err: unknown) {
  return String((err as { cause?: { code?: string } })?.cause?.code ?? (err as { code?: string })?.code) === "23505";
}

/* ───────────── Sesión ───────────── */

export async function cerrarSesion() {
  await requireAdmin();
  await destroySession();
  await registrar("logout");
  redirect("/admin/login");
}

/* ───────────── Mensajes ───────────── */

const mensajeSchema = z.object({
  estado: z.enum(estadosMensaje),
  notas: z.string().max(5000).default(""),
});

export async function actualizarMensaje(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const id = idDe(fd);
  const parsed = mensajeSchema.safeParse(campos(fd));
  if (!id) return { ok: false, message: "Mensaje no válido." };
  if (!parsed.success) return errores(parsed.error);
  await db().update(schema.mensajes).set(parsed.data).where(eq(schema.mensajes.id, id));
  await registrar("mensaje.actualizado", `#${id} → ${parsed.data.estado}`);
  return { ok: true, message: "Guardado." };
}

export async function eliminarMensaje(fd: FormData) {
  await requireAdmin();
  const id = idDe(fd);
  if (id) {
    await db().delete(schema.mensajes).where(eq(schema.mensajes.id, id));
    await registrar("mensaje.eliminado", `#${id}`);
  }
  redirect("/admin/mensajes");
}

/* ───────────── Blog ───────────── */

const postSchema = z.object({
  titulo: texto(5, 160, "Título"),
  slug: slugSchema,
  resumen: texto(10, 300, "Resumen"),
  categoria: texto(2, 40, "Categoría"),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha: usa el formato AAAA-MM-DD."),
  lecturaMin: z.string().default(""),
  cuerpo: texto(50, 60000, "Contenido"),
  publicado: z.string().optional(),
  imagenAlt: z.string().trim().max(200, "Texto alternativo: máximo 200 caracteres.").default(""),
  quitarImagen: z.string().optional(),
});

export async function guardarPost(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const id = idDe(fd);
  const parsed = postSchema.safeParse(campos(fd));
  if (!parsed.success) return errores(parsed.error);
  const v = parsed.data;
  const archivo = archivoDe(fd, "imagen");
  const [actual] = id
    ? await db().select({ imagen: schema.posts.imagen }).from(schema.posts).where(eq(schema.posts.id, id)).limit(1)
    : [];
  const quitar = v.quitarImagen === "on" && !archivo;
  if ((archivo || (actual?.imagen && !quitar)) && !v.imagenAlt) {
    return { ok: false, errors: ["Texto alternativo: describe la portada para lectores de pantalla y buscadores."] };
  }
  const slug = v.slug || slugify(v.titulo);
  let imagen = quitar ? null : (actual?.imagen ?? null);
  if (archivo) {
    const subida = await subirImagen(archivo, `blog/${slug}`);
    if ("error" in subida) return { ok: false, errors: [subida.error] };
    imagen = subida.url;
  }
  const palabras = v.cuerpo.split(/\s+/).length;
  const valores = {
    titulo: v.titulo,
    slug,
    imagen,
    imagenAlt: imagen ? v.imagenAlt : "",
    resumen: v.resumen,
    categoria: v.categoria,
    fecha: v.fecha,
    lecturaMin: Number(v.lecturaMin) > 0 ? Math.min(Number(v.lecturaMin), 120) : Math.max(1, Math.round(palabras / 200)),
    cuerpo: v.cuerpo,
    publicado: v.publicado === "on",
    actualizado: new Date(),
  };
  try {
    if (id) {
      await db().update(schema.posts).set(valores).where(eq(schema.posts.id, id));
    } else {
      await db().insert(schema.posts).values(valores);
    }
  } catch (err) {
    if (archivo) await borrarImagen(imagen);
    if (esDuplicado(err)) return { ok: false, errors: ["Ya existe un artículo con ese slug."] };
    throw err;
  }
  if (actual?.imagen && actual.imagen !== imagen) await borrarImagen(actual.imagen);
  updateTag(TAGS.posts);
  await registrar(id ? "post.editado" : "post.creado", valores.slug);
  if (!id) redirect("/admin/blog");
  return { ok: true, message: "Artículo guardado y publicado en el sitio." };
}

export async function eliminarPost(fd: FormData) {
  await requireAdmin();
  const id = idDe(fd);
  if (id) {
    const [borrado] = await db().delete(schema.posts).where(eq(schema.posts.id, id)).returning({ imagen: schema.posts.imagen });
    await borrarImagen(borrado?.imagen);
    updateTag(TAGS.posts);
    await registrar("post.eliminado", `#${id}`);
  }
  redirect("/admin/blog");
}

/* ───────────── Proyectos ───────────── */

const proyectoSchema = z.object({
  cliente: texto(2, 120, "Cliente"),
  slug: slugSchema,
  tipo: texto(2, 60, "Tipo"),
  resumen: texto(10, 300, "Resumen"),
  stack: lista,
  url: urlOpcional,
  urlLabel: z.string().trim().max(40).transform((s) => s || null),
  reto: texto(10, 3000, "El reto"),
  solucion: lista,
  resultado: texto(10, 3000, "El resultado"),
  estado: z.enum(estadosProyecto, "Elige si es un sitio en producción o un prototipo."),
  imagenAlt: z.string().trim().max(200, "Texto alternativo: máximo 200 caracteres.").default(""),
  quitarImagen: z.string().optional(),
  orden: z.coerce.number().int().min(0).max(999).default(0),
  publicado: z.string().optional(),
});

export async function guardarProyecto(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const id = idDe(fd);
  const parsed = proyectoSchema.safeParse(campos(fd));
  if (!parsed.success) return errores(parsed.error);
  const { quitarImagen, ...v } = parsed.data;
  const archivo = archivoDe(fd, "imagen");
  const [actual] = id
    ? await db().select({ imagen: schema.proyectos.imagen }).from(schema.proyectos).where(eq(schema.proyectos.id, id)).limit(1)
    : [];
  const quitar = quitarImagen === "on" && !archivo;
  if ((archivo || (actual?.imagen && !quitar)) && !v.imagenAlt) {
    return { ok: false, errors: ["Texto alternativo: describe la captura para lectores de pantalla y buscadores."] };
  }

  const slug = v.slug || slugify(v.cliente);
  let imagen = quitar ? null : (actual?.imagen ?? null);
  if (archivo) {
    const subida = await subirImagen(archivo, `proyectos/${slug}`);
    if ("error" in subida) return { ok: false, errors: [subida.error] };
    imagen = subida.url;
  }
  const valores = { ...v, slug, imagen, publicado: v.publicado === "on", actualizado: new Date() };
  try {
    if (id) {
      await db().update(schema.proyectos).set(valores).where(eq(schema.proyectos.id, id));
    } else {
      await db().insert(schema.proyectos).values(valores);
    }
  } catch (err) {
    if (archivo) await borrarImagen(imagen);
    if (esDuplicado(err)) return { ok: false, errors: ["Ya existe un proyecto con ese slug."] };
    throw err;
  }
  // La imagen anterior se borra solo cuando el cambio ya quedó guardado.
  if (actual?.imagen && actual.imagen !== imagen) await borrarImagen(actual.imagen);
  updateTag(TAGS.proyectos);
  await registrar(id ? "proyecto.editado" : "proyecto.creado", archivo ? `${slug} (nueva captura)` : slug);
  if (!id) redirect("/admin/proyectos");
  return { ok: true, message: "Proyecto guardado y publicado en el sitio." };
}

export async function eliminarProyecto(fd: FormData) {
  await requireAdmin();
  const id = idDe(fd);
  if (id) {
    const [borrado] = await db()
      .delete(schema.proyectos)
      .where(eq(schema.proyectos.id, id))
      .returning({ imagen: schema.proyectos.imagen });
    await borrarImagen(borrado?.imagen);
    updateTag(TAGS.proyectos);
    await registrar("proyecto.eliminado", `#${id}`);
  }
  redirect("/admin/proyectos");
}

/* ───────────── Precios ───────────── */

const precioSchema = z.object({
  tipo: texto(2, 60, "Nombre"),
  descripcion: texto(5, 300, "Descripción"),
  incluye: lista,
  rango: z.string().trim().max(60).transform((s) => s || null),
  tipoFormulario: z.enum(tiposProyecto, "Elige el tipo de proyecto del formulario."),
  orden: z.coerce.number().int().min(0).max(999).default(0),
});

export async function guardarPrecio(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const id = idDe(fd);
  const parsed = precioSchema.safeParse(campos(fd));
  if (!parsed.success) return errores(parsed.error);
  if (id) {
    await db().update(schema.precios).set(parsed.data).where(eq(schema.precios.id, id));
  } else {
    await db().insert(schema.precios).values(parsed.data);
  }
  updateTag(TAGS.precios);
  await registrar(id ? "precio.editado" : "precio.creado", parsed.data.tipo);
  return { ok: true, message: id ? "Precio guardado." : "Precio creado." };
}

export async function eliminarPrecio(fd: FormData) {
  await requireAdmin();
  const id = idDe(fd);
  if (id) {
    await db().delete(schema.precios).where(eq(schema.precios.id, id));
    updateTag(TAGS.precios);
    await registrar("precio.eliminado", `#${id}`);
  }
  redirect("/admin/precios");
}

/* ───────────── Equipo ───────────── */

const equipoSchema = z.object({
  fotoAlt: z.string().trim().max(200, "Texto alternativo: máximo 200 caracteres.").default(""),
  quitarFoto: z.string().optional(),
});

async function ajuste(clave: string) {
  const [row] = await db().select({ valor: schema.ajustes.valor }).from(schema.ajustes).where(eq(schema.ajustes.clave, clave)).limit(1);
  return row?.valor ?? null;
}

async function guardarAjuste(clave: string, valor: string) {
  await db()
    .insert(schema.ajustes)
    .values({ clave, valor })
    .onConflictDoUpdate({ target: schema.ajustes.clave, set: { valor } });
}

export async function guardarEquipo(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = equipoSchema.safeParse(campos(fd));
  if (!parsed.success) return errores(parsed.error);
  const { fotoAlt, quitarFoto } = parsed.data;
  const archivo = archivoDe(fd, "foto");
  const actual = await ajuste(AJUSTES.fotoEquipo);
  const quitar = quitarFoto === "on" && !archivo;
  if ((archivo || (actual && !quitar)) && !fotoAlt) {
    return { ok: false, errors: ["Texto alternativo: describe la foto para lectores de pantalla y buscadores."] };
  }

  let foto = quitar ? "" : (actual ?? "");
  if (archivo) {
    const subida = await subirImagen(archivo, "equipo");
    if ("error" in subida) return { ok: false, errors: [subida.error] };
    foto = subida.url;
  }
  await guardarAjuste(AJUSTES.fotoEquipo, foto);
  await guardarAjuste(AJUSTES.fotoEquipoAlt, fotoAlt);
  if (actual && actual !== foto) await borrarImagen(actual);
  updateTag(TAGS.equipo);
  await registrar("equipo.editado", archivo ? "nueva foto" : quitar ? "foto quitada" : "texto alternativo");
  return { ok: true, message: "Foto del equipo guardada y publicada en el sitio." };
}

/* ───────────── Cuenta ───────────── */

const leerCampo = (fd: FormData, campo: string) => String(fd.get(campo) ?? "").slice(0, 201);
const codigoDe = (fd: FormData) => leerCampo(fd, "codigo").replace(/\s/g, "");

/** Cambia la contraseña (pide la actual y, si hay 2FA, el código). Cierra las demás sesiones. */
export async function cambiarPassword(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const cfg = await credenciales();
  const actualOk = await verifyPassword(leerCampo(fd, "actual"), cfg.passwordHash);
  if (!actualOk || (cfg.totpSecret && !verifyTotp(cfg.totpSecret, codigoDe(fd)))) {
    await registrar("password.cambio_fallido");
    return { ok: false, errors: ["La contraseña actual o el código no son correctos."] };
  }
  const nueva = leerCampo(fd, "nueva");
  const problema = problemaPassword(nueva, leerCampo(fd, "confirmacion"), cfg.email);
  if (problema) return { ok: false, errors: [problema] };

  await guardarCredenciales({ passwordHash: await hashPassword(nueva) });
  await revocarSesiones();
  await createSession();
  await registrar("password.cambiada");
  return { ok: true, message: "Contraseña cambiada. Las demás sesiones se cerraron." };
}

/** Vincula de nuevo la app de autenticación (p. ej. al cambiar de teléfono). */
export async function reconfigurarTotp(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const cfg = await credenciales();
  if (!(await verifyPassword(leerCampo(fd, "actual"), cfg.passwordHash))) {
    await registrar("totp.cambio_fallido");
    return { ok: false, errors: ["La contraseña actual no es correcta."] };
  }
  const secreto = leerCampo(fd, "secreto");
  if (!esSecretoTotp(secreto) || !verifyTotp(secreto, codigoDe(fd))) {
    return { ok: false, errors: ["El código de 6 dígitos no coincide con el QR de esta página."] };
  }
  await guardarCredenciales({ totpSecret: secreto });
  await registrar("totp.cambiado");
  return { ok: true, message: "App de autenticación vinculada. Usa sus códigos desde ahora." };
}
