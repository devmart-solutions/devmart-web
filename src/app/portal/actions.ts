"use server";

import { and, eq, max } from "drizzle-orm";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  cerrarSesionCliente,
  consumirAccesoCliente,
  crearAccesoCliente,
  crearSesionCliente,
  MINUTOS_ENLACE_CLIENTE,
  requireCliente,
} from "@/lib/auth/cliente";
import { credenciales } from "@/lib/auth/config";
import { crearTokenEntrar, MINUTOS_ENLACE_ENTRAR } from "@/lib/auth/cuenta";
import { esBot } from "@/lib/botid";
import { db, hasDb, schema } from "@/lib/db";
import { enviarEmail } from "@/lib/email";
import { emailEnlacePortalCliente, emailEntrarAdmin, emailNuevoContacto } from "@/lib/email-templates";
import { avisarAdmin } from "@/lib/portal/avisos";
import { obraDelCliente } from "@/lib/portal/datos";
import { borrarProspecto, leerProspecto } from "@/lib/portal/prospecto";
import { huellaCliente, permitir, registrar } from "@/lib/security";
import { siteUrl } from "@/lib/site";

export type PortalState = { ok?: boolean; message?: string; error?: string };

/* ───────────── Acceso ───────────── */

const emailSchema = z.string().trim().toLowerCase().pipe(z.email().max(254));

/** Envía un enlace de acceso si el email es de un cliente activo. La respuesta es la misma en ambos casos. */
export async function solicitarAcceso(_prev: PortalState, fd: FormData): Promise<PortalState> {
  if (!hasDb) return { error: "El portal aún no está disponible." };
  if (await esBot()) return { error: "No pudimos verificar tu navegador. Inténtalo de nuevo." };

  const huella = await huellaCliente();
  if (!(await permitir(`portal:${huella}`, 5, 900)) || !(await permitir("portal:global", 60, 900))) {
    return { error: "Demasiados intentos. Espera 15 minutos y revisa tu correo (también la carpeta de spam)." };
  }

  const respuesta: PortalState = {
    ok: true,
    message: `Si ese email tiene acceso al portal, te enviamos un enlace para entrar. Vence en ${MINUTOS_ENLACE_CLIENTE} minutos.`,
  };
  const email = emailSchema.safeParse(fd.get("email"));
  if (!email.success) return { error: "Escribe un email válido." };

  // El administrador también puede pedir aquí su enlace: entra al panel, no al portal. La respuesta
  // es la misma de siempre, así nadie descubre cuál es el email del panel probando direcciones.
  const cfg = await credenciales();
  if (cfg.ready && email.data === cfg.email) {
    await enviarEnlaceAdmin(cfg.email, Boolean(cfg.totpSecret));
    return respuesta;
  }

  const [cliente] = await db()
    .select({ id: schema.clientes.id, nombre: schema.clientes.nombre })
    .from(schema.clientes)
    .where(and(eq(schema.clientes.email, email.data), eq(schema.clientes.activo, true)))
    .limit(1);
  if (!cliente) return respuesta;

  const token = await crearAccesoCliente(cliente.id);
  const enlace = `${siteUrl}/portal/acceso?token=${token}`;
  const plantilla = emailEnlacePortalCliente({
    nombre: cliente.nombre.split(" ")[0],
    url: enlace,
    minutos: MINUTOS_ENLACE_CLIENTE,
  });
  const enviado = await enviarEmail({
    to: email.data,
    subject: plantilla.subject,
    text: plantilla.text,
    html: plantilla.html,
  }).catch((err) => {
    console.error("[portal] Error al enviar el enlace:", err);
    return false;
  });
  if (!enviado && process.env.NODE_ENV !== "production") {
    console.info(`[portal] Sin proveedor de correo. Enlace (solo en desarrollo): ${enlace}`);
  }
  await registrar("portal.enlace", `cliente #${cliente.id}${enviado ? "" : " (correo no enviado)"}`);
  return respuesta;
}

/**
 * Con verificación en dos pasos, un enlace de un solo uso que lleva al paso del código. Sin ella, el
 * enlace no puede sustituir a la contraseña: el correo solo lleva a la pantalla de entrada.
 */
async function enviarEnlaceAdmin(to: string, con2fa: boolean) {
  const url = con2fa ? `${siteUrl}/admin/login/enlace?token=${await crearTokenEntrar()}` : `${siteUrl}/admin/login`;
  const plantilla = emailEntrarAdmin({ url, minutos: MINUTOS_ENLACE_ENTRAR });
  const enviado = await enviarEmail({ to, subject: plantilla.subject, text: plantilla.text, html: plantilla.html }).catch((err) => {
    console.error("[portal] Error al enviar el enlace del panel:", err);
    return false;
  });
  if (!enviado && process.env.NODE_ENV !== "production") {
    console.info(`[portal] Sin proveedor de correo. Enlace del panel (solo en desarrollo): ${url}`);
  }
  await registrar("login.enlace_pedido", enviado ? "desde el portal" : "desde el portal (correo no enviado)");
}

/** Usa el enlace (un solo uso) y abre la sesión del cliente. */
export async function entrarConEnlace(_prev: PortalState, fd: FormData): Promise<PortalState> {
  const token = String(fd.get("token") ?? "").slice(0, 64);
  const clienteId = await consumirAccesoCliente(token);
  if (!clienteId) return { error: "El enlace venció o ya se usó. Pide uno nuevo." };
  await crearSesionCliente(clienteId);
  await registrar("portal.ingreso", `cliente #${clienteId}`);
  redirect("/portal");
}

export async function salirDelPortal() {
  await cerrarSesionCliente();
  redirect("/portal/ingreso");
}

/* ───────────── Prospectos ───────────── */

const prospectoSchema = z.object({
  nombre: z.string().trim().min(2, "Escribe tu nombre.").max(100, "El nombre es muy largo."),
  idea: z.string().trim().max(2000, "Cuéntanos tu idea en menos de 2000 caracteres.").default(""),
});

/** Quien entró con Google o GitHub sin ser cliente deja sus datos: llegan a Mensajes del panel. */
export async function registrarProspecto(_prev: PortalState, fd: FormData): Promise<PortalState> {
  if (!hasDb) return { error: "El portal aún no está disponible." };
  const prospecto = await leerProspecto();
  if (!prospecto) return { error: "Pasó demasiado tiempo. Vuelve a entrar con Google o GitHub." };
  if (!(await permitir(`prospecto:${await huellaCliente()}`, 3, 3600))) {
    return { error: "Ya recibimos tus datos. Te escribiremos pronto." };
  }
  const parsed = prospectoSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revisa los datos." };
  const { nombre, idea } = parsed.data;

  const datos = {
    nombre,
    email: prospecto.email,
    telefono: "No especificado",
    tipo: "Prospecto desde el portal",
    presupuesto: "Por definir",
    descripcion: idea || "Entró al portal con su cuenta y pidió que lo contactemos.",
  };
  await db().insert(schema.mensajes).values({ ...datos, notas: "Email verificado por Google o GitHub al entrar al portal." });
  await borrarProspecto();
  await registrar("portal.prospecto", nombre);

  const to = process.env.CONTACT_TO_EMAIL || process.env.ADMIN_EMAIL;
  if (to) {
    const plantilla = emailNuevoContacto(datos);
    await enviarEmail({ to, replyTo: prospecto.email, subject: plantilla.subject, text: plantilla.text, html: plantilla.html }).catch((err) => {
      console.error("[portal] No se pudo avisar del prospecto:", err);
      return false;
    });
  }
  return { ok: true, message: `¡Gracias, ${nombre.split(" ")[0]}! Te escribiremos a ${prospecto.email} para hablar de tu proyecto.` };
}

/* ───────────── Entregables ───────────── */

const respuestaSchema = z
  .object({
    id: z.coerce.number().int().positive(),
    decision: z.enum(["aprobar", "cambios"]),
    comentario: z.string().trim().max(2000, "El comentario es muy largo (máximo 2000 caracteres).").default(""),
  })
  .refine((v) => v.decision === "aprobar" || v.comentario.length >= 5, {
    message: "Cuéntanos qué cambios necesitas (al menos unas palabras).",
  });

export async function responderEntregable(_prev: PortalState, fd: FormData): Promise<PortalState> {
  const clienteId = await requireCliente();
  const parsed = respuestaSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revisa los datos." };
  const { id, decision, comentario } = parsed.data;

  // El entregable debe ser de una obra del cliente y estar pendiente de respuesta.
  const [fila] = await db()
    .select({ entregable: schema.entregables, obra: schema.obras })
    .from(schema.entregables)
    .innerJoin(schema.obras, eq(schema.entregables.obraId, schema.obras.id))
    .where(and(eq(schema.entregables.id, id), eq(schema.obras.clienteId, clienteId)))
    .limit(1);
  if (!fila) return { error: "No encontramos ese entregable." };
  if (fila.entregable.estado !== "por_aprobar") return { error: "Este entregable ya tiene una respuesta." };

  const estado = decision === "aprobar" ? "aprobado" : "cambios_pedidos";
  await db()
    .update(schema.entregables)
    .set({ estado, comentarioCliente: comentario })
    .where(eq(schema.entregables.id, id));
  await registrar(`portal.entregable.${estado}`, `#${id} · obra #${fila.obra.id}`);
  await avisarAdmin(
    decision === "aprobar"
      ? `Aprobado: ${fila.entregable.titulo} (${fila.obra.nombre})`
      : `Cambios pedidos: ${fila.entregable.titulo} (${fila.obra.nombre})`,
    [
      `Obra: ${fila.obra.nombre}`,
      `Entregable: ${fila.entregable.titulo} · ${fila.entregable.version}`,
      `Respuesta del cliente: ${decision === "aprobar" ? "aprobado" : "pide cambios"}`,
      ...(comentario ? ["", "Comentario:", comentario] : []),
    ],
  );
  refresh();
  return { ok: true, message: decision === "aprobar" ? "¡Aprobado! Le avisamos al equipo." : "Listo, le enviamos tus comentarios al equipo." };
}

/* ───────────── Soporte ───────────── */

const solicitudSchema = z.object({
  obraId: z.coerce.number().int().positive(),
  titulo: z.string().trim().min(4, "Escribe un título corto (al menos 4 caracteres).").max(120, "El título es muy largo."),
  detalle: z.string().trim().min(10, "Cuéntanos un poco más (al menos 10 caracteres).").max(4000, "El detalle es muy largo."),
});

export async function crearSolicitud(_prev: PortalState, fd: FormData): Promise<PortalState> {
  const clienteId = await requireCliente();
  if (!(await permitir(`portal-soporte:${clienteId}`, 10, 3600))) {
    return { error: "Ya enviaste varias solicitudes. Espera un rato o escríbenos por WhatsApp." };
  }
  const parsed = solicitudSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revisa los datos." };
  const obra = await obraDelCliente(clienteId, parsed.data.obraId);
  if (!obra) return { error: "No encontramos esa obra." };

  const [{ ultimo }] = await db()
    .select({ ultimo: max(schema.solicitudes.numero) })
    .from(schema.solicitudes)
    .where(eq(schema.solicitudes.obraId, obra.id));
  const numero = (ultimo ?? 0) + 1;
  await db()
    .insert(schema.solicitudes)
    .values({ obraId: obra.id, numero, titulo: parsed.data.titulo, detalle: parsed.data.detalle });
  await registrar("portal.solicitud", `#${numero} · obra #${obra.id}`);
  await avisarAdmin(`Nueva solicitud #${numero}: ${parsed.data.titulo} (${obra.nombre})`, [
    `Obra: ${obra.nombre}`,
    `Solicitud #${numero}: ${parsed.data.titulo}`,
    "",
    parsed.data.detalle,
  ]);
  refresh();
  return { ok: true, message: `Recibimos tu solicitud #${numero}. Te avisamos cuando la revisemos.` };
}
