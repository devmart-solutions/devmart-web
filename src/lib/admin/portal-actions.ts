"use server";

import { and, eq, inArray, isNotNull } from "drizzle-orm";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { FormState } from "@/lib/admin/actions";
import { archivoDe, borrarImagen, subirImagen } from "@/lib/admin/imagenes";
import { crearAccesoCliente, MINUTOS_ENLACE_CLIENTE } from "@/lib/auth/cliente";
import { requireAdmin } from "@/lib/auth/dal";
import { db, schema } from "@/lib/db";
import { estadosEtapa, estadosPago, estadosSolicitud } from "@/lib/db/schema";
import { enviarEmail, hayProveedorEmail } from "@/lib/email";
import { emailEnlacePortalCliente } from "@/lib/email-templates";
import { avisarClienteDeObra } from "@/lib/portal/avisos";
import { registrar } from "@/lib/security";
import { siteUrl } from "@/lib/site";

// Acciones del panel para el portal de clientes. Cada una verifica la sesión de admin,
// valida con zod y registra el cambio en la actividad.

const texto = (min: number, max: number, campo: string) =>
  z.string().trim().min(min, `${campo}: escribe al menos ${min} caracteres.`).max(max, `${campo}: máximo ${max} caracteres.`);
const fecha = z
  .string()
  .trim()
  .refine((s) => s === "" || /^\d{4}-\d{2}-\d{2}$/.test(s), "Fecha: usa el formato AAAA-MM-DD.")
  .transform((s) => s || null);
const id = z.coerce.number().int().positive();
const idOpcional = z
  .string()
  .optional()
  .transform((s) => (s && /^\d+$/.test(s) ? Number(s) : null));

function campos(fd: FormData) {
  return Object.fromEntries([...fd.entries()].filter(([, v]) => typeof v === "string")) as Record<string, string>;
}

function errores(e: z.ZodError): FormState {
  return { ok: false, errors: e.issues.map((i) => i.message) };
}

const esDuplicado = (err: unknown) =>
  String((err as { cause?: { code?: string } })?.cause?.code ?? (err as { code?: string })?.code) === "23505";

/** Borra de Blob las capturas de entregables de unas obras (antes de eliminarlas). */
async function borrarImagenesDeObras(obraIds: number[]) {
  if (obraIds.length === 0) return;
  const filas = await db()
    .select({ imagen: schema.entregables.imagen })
    .from(schema.entregables)
    .where(and(inArray(schema.entregables.obraId, obraIds), isNotNull(schema.entregables.imagen)));
  await Promise.all(filas.map((f) => borrarImagen(f.imagen)));
}

/* ───────────── Clientes ───────────── */

const clienteSchema = z.object({
  id: idOpcional,
  nombre: texto(2, 120, "Nombre"),
  email: z.string().trim().toLowerCase().pipe(z.email("Email: escribe un email válido.").max(254)),
  empresa: z.string().trim().max(120, "Empresa: máximo 120 caracteres.").default(""),
  activo: z.string().optional(),
});

export async function guardarCliente(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = clienteSchema.safeParse(campos(fd));
  if (!parsed.success) return errores(parsed.error);
  const { id: clienteId, activo, ...v } = parsed.data;
  const valores = { ...v, activo: activo === "on" };
  let nuevoId: number | null = null;
  try {
    if (clienteId) {
      await db().update(schema.clientes).set(valores).where(eq(schema.clientes.id, clienteId));
    } else {
      const [fila] = await db().insert(schema.clientes).values(valores).returning({ id: schema.clientes.id });
      nuevoId = fila.id;
    }
  } catch (err) {
    if (esDuplicado(err)) return { ok: false, errors: ["Ya existe un cliente con ese email."] };
    throw err;
  }
  await registrar(clienteId ? "cliente.editado" : "cliente.creado", `#${clienteId ?? nuevoId} · ${valores.email}`);
  if (nuevoId) redirect(`/admin/clientes/${nuevoId}`);
  refresh();
  return { ok: true, message: "Cliente guardado." };
}

export async function eliminarCliente(fd: FormData) {
  await requireAdmin();
  const clienteId = id.safeParse(fd.get("id"));
  if (clienteId.success) {
    const obras = await db().select({ id: schema.obras.id }).from(schema.obras).where(eq(schema.obras.clienteId, clienteId.data));
    await borrarImagenesDeObras(obras.map((o) => o.id));
    await db().delete(schema.clientes).where(eq(schema.clientes.id, clienteId.data));
    await registrar("cliente.eliminado", `#${clienteId.data}`);
  }
  redirect("/admin/clientes");
}

/** Envía al cliente su enlace de acceso al portal (el mismo que pediría desde /portal/ingreso). */
export async function enviarAccesoCliente(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const clienteId = id.safeParse(fd.get("id"));
  if (!clienteId.success) return { ok: false, errors: ["Cliente no válido."] };
  const [cliente] = await db().select().from(schema.clientes).where(eq(schema.clientes.id, clienteId.data)).limit(1);
  if (!cliente) return { ok: false, errors: ["Cliente no encontrado."] };
  if (!cliente.activo) return { ok: false, errors: ["El cliente está inactivo: actívalo antes de enviarle acceso."] };
  if (!hayProveedorEmail()) return { ok: false, errors: ["El envío de correos no está configurado (SMTP o Resend)."] };

  const token = await crearAccesoCliente(cliente.id);
  const enlace = `${siteUrl}/portal/acceso?token=${token}`;
  const plantilla = emailEnlacePortalCliente({
    nombre: cliente.nombre.split(" ")[0],
    url: enlace,
    minutos: MINUTOS_ENLACE_CLIENTE,
  });
  const ok = await enviarEmail({
    to: cliente.email,
    subject: plantilla.subject,
    text: plantilla.text,
    html: plantilla.html,
  }).catch(() => false);
  if (!ok) return { ok: false, errors: ["No se pudo enviar el correo. Inténtalo de nuevo."] };
  await registrar("cliente.acceso_enviado", `#${cliente.id}`);
  return { ok: true, message: `Enlace enviado a ${cliente.email}.` };
}

/* ───────────── Obras ───────────── */

const obraSchema = z.object({
  id: idOpcional,
  clienteId: id,
  nombre: texto(2, 120, "Nombre"),
  tipo: texto(2, 60, "Tipo"),
  estado: texto(2, 40, "Estado"),
  fechaEntregaEstimada: fecha,
});

export async function guardarObra(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = obraSchema.safeParse(campos(fd));
  if (!parsed.success) return errores(parsed.error);
  const { id: obraId, ...valores } = parsed.data;
  if (obraId) {
    await db().update(schema.obras).set(valores).where(eq(schema.obras.id, obraId));
    await registrar("obra.editada", `#${obraId} · ${valores.nombre}`);
    refresh();
    return { ok: true, message: "Obra guardada." };
  }
  const [fila] = await db().insert(schema.obras).values(valores).returning({ id: schema.obras.id });
  await registrar("obra.creada", `#${fila.id} · ${valores.nombre}`);
  redirect(`/admin/obras/${fila.id}`);
}

export async function eliminarObra(fd: FormData) {
  await requireAdmin();
  const obraId = id.safeParse(fd.get("id"));
  if (!obraId.success) redirect("/admin/clientes");
  const [obra] = await db().select({ clienteId: schema.obras.clienteId }).from(schema.obras).where(eq(schema.obras.id, obraId.data)).limit(1);
  await borrarImagenesDeObras([obraId.data]);
  await db().delete(schema.obras).where(eq(schema.obras.id, obraId.data));
  await registrar("obra.eliminada", `#${obraId.data}`);
  redirect(obra ? `/admin/clientes/${obra.clienteId}` : "/admin/clientes");
}

/* ───────────── Etapas ───────────── */

const etapaSchema = z.object({
  id: idOpcional,
  obraId: id,
  nombre: texto(2, 120, "Etapa"),
  orden: z.coerce.number().int().min(0).max(999).default(0),
  estado: z.enum(estadosEtapa, "Elige el estado de la etapa."),
  porcentaje: z.coerce.number().int().min(0, "Porcentaje: entre 0 y 100.").max(100, "Porcentaje: entre 0 y 100.").default(0),
  fecha,
});

export async function guardarEtapa(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = etapaSchema.safeParse(campos(fd));
  if (!parsed.success) return errores(parsed.error);
  const { id: etapaId, ...v } = parsed.data;
  const valores = { ...v, porcentaje: v.estado === "completada" ? 100 : v.estado === "pendiente" ? 0 : v.porcentaje };
  if (etapaId) {
    await db()
      .update(schema.etapas)
      .set(valores)
      .where(and(eq(schema.etapas.id, etapaId), eq(schema.etapas.obraId, v.obraId)));
  } else {
    await db().insert(schema.etapas).values(valores);
  }
  await registrar(etapaId ? "etapa.editada" : "etapa.creada", `${valores.nombre} · obra #${v.obraId}`);
  refresh();
  return { ok: true, message: etapaId ? "Etapa guardada." : "Etapa añadida." };
}

export async function eliminarEtapa(fd: FormData) {
  await requireAdmin();
  const etapaId = id.safeParse(fd.get("id"));
  if (etapaId.success) {
    await db().delete(schema.etapas).where(eq(schema.etapas.id, etapaId.data));
    await registrar("etapa.eliminada", `#${etapaId.data}`);
  }
  refresh();
}

/* ───────────── Entregables ───────────── */

const entregableSchema = z.object({
  obraId: id,
  titulo: texto(2, 120, "Título"),
  version: z.string().trim().min(1, "Versión: p. ej. v1.").max(20, "Versión: máximo 20 caracteres."),
  url: z
    .string()
    .trim()
    .max(500)
    .refine((s) => s === "" || /^https:\/\/\S+$/.test(s), "Enlace: debe empezar por https://")
    .transform((s) => s || null),
});

export async function crearEntregable(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = entregableSchema.safeParse(campos(fd));
  if (!parsed.success) return errores(parsed.error);
  const v = parsed.data;
  const archivo = archivoDe(fd, "imagen");
  if (!archivo && !v.url) return { ok: false, errors: ["Añade un enlace para revisar, una captura o ambos."] };

  let imagen: string | null = null;
  if (archivo) {
    const subida = await subirImagen(archivo, `portal/obra-${v.obraId}`);
    if ("error" in subida) return { ok: false, errors: [subida.error] };
    imagen = subida.url;
  }
  await db().insert(schema.entregables).values({ ...v, imagen });
  await registrar("entregable.creado", `${v.titulo} ${v.version} · obra #${v.obraId}`);
  await avisarClienteDeObra(v.obraId, `Nuevo entregable para revisar: ${v.titulo}`, [
    `Subimos una nueva entrega de tu proyecto: ${v.titulo} (${v.version}).`,
    "Revísala en tu portal y apruébala o cuéntanos qué cambiar.",
  ]);
  refresh();
  return { ok: true, message: "Entregable publicado. Le avisamos al cliente por correo." };
}

export async function eliminarEntregable(fd: FormData) {
  await requireAdmin();
  const entregableId = id.safeParse(fd.get("id"));
  if (entregableId.success) {
    const [borrado] = await db()
      .delete(schema.entregables)
      .where(eq(schema.entregables.id, entregableId.data))
      .returning({ imagen: schema.entregables.imagen });
    await borrarImagen(borrado?.imagen);
    await registrar("entregable.eliminado", `#${entregableId.data}`);
  }
  refresh();
}

/* ───────────── Pagos ───────────── */

const pagoSchema = z.object({
  id: idOpcional,
  obraId: id,
  concepto: texto(2, 120, "Concepto"),
  // Acepta «1.500.000», «$ 1 500 000» o «1500000».
  monto: z
    .string()
    .transform((s) => Number(s.replace(/\D/g, "")))
    .pipe(z.number().int().min(1, "Monto: escribe un valor en pesos.").max(2_000_000_000, "Monto: demasiado alto.")),
  estado: z.enum(estadosPago, "Elige el estado del pago."),
  fechaPago: fecha,
});

export async function guardarPago(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = pagoSchema.safeParse(campos(fd));
  if (!parsed.success) return errores(parsed.error);
  const { id: pagoId, ...valores } = parsed.data;
  if (pagoId) {
    await db()
      .update(schema.pagos)
      .set(valores)
      .where(and(eq(schema.pagos.id, pagoId), eq(schema.pagos.obraId, valores.obraId)));
  } else {
    await db().insert(schema.pagos).values(valores);
  }
  await registrar(pagoId ? "pago.editado" : "pago.creado", `${valores.concepto} · ${valores.estado} · obra #${valores.obraId}`);
  refresh();
  return { ok: true, message: pagoId ? "Pago guardado." : "Pago registrado." };
}

export async function eliminarPago(fd: FormData) {
  await requireAdmin();
  const pagoId = id.safeParse(fd.get("id"));
  if (pagoId.success) {
    await db().delete(schema.pagos).where(eq(schema.pagos.id, pagoId.data));
    await registrar("pago.eliminado", `#${pagoId.data}`);
  }
  refresh();
}

/* ───────────── Solicitudes ───────────── */

const solicitudEstadoSchema = z.object({
  id,
  estado: z.enum(estadosSolicitud, "Elige el estado."),
  respuesta: z.string().trim().max(2000, "Respuesta: máximo 2000 caracteres.").default(""),
});

export async function cambiarEstadoSolicitud(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = solicitudEstadoSchema.safeParse(campos(fd));
  if (!parsed.success) return errores(parsed.error);
  const [fila] = await db()
    .update(schema.solicitudes)
    .set({ estado: parsed.data.estado, respuesta: parsed.data.respuesta })
    .where(eq(schema.solicitudes.id, parsed.data.id))
    .returning({ numero: schema.solicitudes.numero, obraId: schema.solicitudes.obraId, titulo: schema.solicitudes.titulo });
  if (!fila) return { ok: false, errors: ["Solicitud no encontrada."] };
  await registrar("solicitud.estado", `#${fila.numero} → ${parsed.data.estado} · obra #${fila.obraId}`);
  if (parsed.data.estado === "resuelta") {
    const lineas = [
      `Tu solicitud #${fila.numero} «${fila.titulo}» quedó resuelta.`,
      ...(parsed.data.respuesta ? [`Respuesta: ${parsed.data.respuesta}`] : []),
      "Si algo no quedó como esperabas, abre una nueva desde Soporte.",
    ];
    await avisarClienteDeObra(fila.obraId, `Resolvimos tu solicitud #${fila.numero}`, lineas);
  } else if (parsed.data.respuesta) {
    await avisarClienteDeObra(fila.obraId, `Respuesta a tu solicitud #${fila.numero}`, [
      `Sobre tu solicitud #${fila.numero} «${fila.titulo}»:`,
      parsed.data.respuesta,
    ]);
  }
  refresh();
  return { ok: true, message: "Solicitud actualizada." };
}
