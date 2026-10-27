"use server";

import { and, eq, max } from "drizzle-orm";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  abrirRegistro,
  cerrarSesionCliente,
  confirmarRegistro,
  consumirAccesoCliente,
  crearAccesoCliente,
  crearSesionCliente,
  guardarPasswordCliente,
  HORAS_REGISTRO,
  MINIMO_PASSWORD_CLIENTE,
  MINUTOS_ENLACE_CLIENTE,
  requireCliente,
  sellarRegistro,
  verificarCredencialesCliente,
} from "@/lib/auth/cliente";
import { credenciales } from "@/lib/auth/config";
import { crearTokenEntrar, MINUTOS_ENLACE_ENTRAR } from "@/lib/auth/cuenta";
import { hashPassword, problemaPassword } from "@/lib/auth/password";
import { esBot } from "@/lib/botid";
import { db, hasDb, schema } from "@/lib/db";
import { enviarEmail } from "@/lib/email";
import {
  emailClaveCliente,
  emailConfirmarRegistro,
  emailCuentaExistente,
  emailEnlacePortalCliente,
  emailEntrarAdmin,
  emailNuevoContacto,
} from "@/lib/email-templates";
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

/* ───────────── Email y contraseña ───────────── */

const BOT = "No pudimos verificar tu navegador. Inténtalo de nuevo.";
const leer = (fd: FormData, campo: string, max = 200) => String(fd.get(campo) ?? "").slice(0, max);

/** Mismos límites que pedir un enlace: 5 intentos cada 15 minutos por conexión y 60 en total. */
async function limitePortal() {
  const huella = await huellaCliente();
  return (await permitir(`portal:${huella}`, 5, 900)) && (await permitir("portal:global", 60, 900));
}

async function correo(to: string, plantilla: { subject: string; text: string; html: string }, enlace: string) {
  const enviado = await enviarEmail({ to, ...plantilla }).catch((err) => {
    console.error("[portal] Error al enviar el correo:", err);
    return false;
  });
  if (!enviado && process.env.NODE_ENV !== "production") {
    console.info(`[portal] Sin proveedor de correo. Enlace (solo en desarrollo): ${enlace}`);
  }
  return enviado;
}

export async function iniciarSesionCliente(_prev: PortalState, fd: FormData): Promise<PortalState> {
  if (!hasDb) return { error: "El portal aún no está disponible." };
  if (await esBot()) return { error: BOT };
  if (!(await limitePortal())) return { error: "Demasiados intentos. Espera 15 minutos antes de volver a intentarlo." };

  const email = emailSchema.safeParse(fd.get("email"));
  const clienteId = email.success ? await verificarCredencialesCliente(email.data, leer(fd, "password")) : null;
  if (!clienteId) {
    await registrar("portal.login_fallido", await huellaCliente());
    return {
      error:
        "Email o contraseña incorrectos. Si tu cuenta la creamos nosotros y aún no tienes contraseña, usa «¿Olvidaste tu contraseña?» para crearla.",
    };
  }
  await crearSesionCliente(clienteId);
  await registrar("portal.ingreso", `cliente #${clienteId} · contraseña`);
  redirect("/portal");
}

const registroSchema = z.object({
  nombre: z.string().trim().min(2, "Escribe tu nombre.").max(120, "El nombre es muy largo."),
  email: emailSchema,
  telefono: z.string().trim().max(30, "El teléfono es muy largo.").default(""),
  empresa: z.string().trim().max(120, "El nombre de la empresa es muy largo.").default(""),
});

/**
 * Registro: no crea nada todavía. Envía un enlace al email; la cuenta se crea (o se activa, si ya
 * la habíamos creado nosotros) cuando lo abre. La respuesta es la misma exista o no el email.
 */
export async function registrarCliente(_prev: PortalState, fd: FormData): Promise<PortalState> {
  if (!hasDb) return { error: "El portal aún no está disponible." };
  if (await esBot()) return { error: BOT };
  if (!(await limitePortal())) return { error: "Demasiados intentos. Espera 15 minutos antes de volver a intentarlo." };

  const parsed = registroSchema.safeParse({
    nombre: fd.get("nombre"),
    email: fd.get("email"),
    telefono: fd.get("telefono") ?? "",
    empresa: fd.get("empresa") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revisa los datos." };
  const d = parsed.data;
  const password = leer(fd, "password", 201);
  const problema = problemaPassword(password, leer(fd, "confirmacion", 201), d.email, MINIMO_PASSWORD_CLIENTE);
  if (problema) return { error: problema };
  if (!fd.get("acepto")) return { error: "Acepta la política de privacidad para crear tu cuenta." };

  const respuesta: PortalState = {
    ok: true,
    message: `Te enviamos un correo a ${d.email} para confirmar tu cuenta. Abre el enlace en las próximas ${HORAS_REGISTRO} horas (revisa también la carpeta de spam).`,
  };

  // El email del panel no se registra como cliente.
  const cfg = await credenciales();
  if (cfg.email && d.email === cfg.email) return respuesta;

  const [existente] = await db()
    .select({ id: schema.clientes.id, nombre: schema.clientes.nombre, hash: schema.clientes.passwordHash })
    .from(schema.clientes)
    .where(eq(schema.clientes.email, d.email))
    .limit(1);

  if (existente?.hash) {
    const url = `${siteUrl}/portal/recuperar`;
    await correo(d.email, emailCuentaExistente({ nombre: existente.nombre.split(" ")[0], url }), url);
    return respuesta;
  }

  const token = await sellarRegistro({ ...d, passwordHash: await hashPassword(password) });
  const url = `${siteUrl}/portal/registro/confirmar?token=${encodeURIComponent(token)}`;
  await correo(d.email, emailConfirmarRegistro({ nombre: d.nombre.split(" ")[0], url, horas: HORAS_REGISTRO }), url);
  await registrar("portal.registro_pedido", existente ? `cliente #${existente.id} (activación)` : "nuevo");
  return respuesta;
}

/** Abre el enlace del registro: crea o activa la cuenta y entra. */
export async function confirmarRegistroCliente(_prev: PortalState, fd: FormData): Promise<PortalState> {
  if (!hasDb) return { error: "El portal aún no está disponible." };
  const registro = await abrirRegistro(leer(fd, "token", 2000));
  if (!registro) return { error: "El enlace venció. Vuelve a registrarte para recibir uno nuevo." };

  const r = await confirmarRegistro(registro);
  if (r.estado === "ya_activa") return { error: "Esta cuenta ya está activa. Entra con tu email y contraseña." };
  if (r.estado === "inactiva") return { error: "Tu acceso al portal está desactivado. Escríbenos y lo revisamos." };

  await crearSesionCliente(r.clienteId);
  await registrar(r.estado === "creada" ? "portal.registro" : "portal.activacion", `cliente #${r.clienteId}`);
  if (r.estado === "creada") {
    await avisarAdmin(`Nuevo registro en el portal: ${registro.nombre}`, [
      `Nombre: ${registro.nombre}`,
      `Email: ${registro.email}`,
      ...(registro.telefono ? [`Teléfono: ${registro.telefono}`] : []),
      ...(registro.empresa ? [`Empresa: ${registro.empresa}`] : []),
      "",
      "Aún no tiene proyectos. Créale una obra desde el panel cuando empiecen a trabajar juntos.",
    ]);
  }
  redirect("/portal");
}

/** «¿Olvidaste tu contraseña?»: también sirve para crearla si la cuenta la creamos nosotros. */
export async function recuperarClave(_prev: PortalState, fd: FormData): Promise<PortalState> {
  if (!hasDb) return { error: "El portal aún no está disponible." };
  if (await esBot()) return { error: BOT };
  if (!(await limitePortal())) return { error: "Demasiados intentos. Espera 15 minutos y revisa tu correo (también la carpeta de spam)." };

  const email = emailSchema.safeParse(fd.get("email"));
  if (!email.success) return { error: "Escribe un email válido." };
  const respuesta: PortalState = {
    ok: true,
    message: `Si ese email tiene una cuenta, te enviamos un enlace para crear tu contraseña. Vence en ${MINUTOS_ENLACE_CLIENTE} minutos.`,
  };

  const [cliente] = await db()
    .select({ id: schema.clientes.id, nombre: schema.clientes.nombre, hash: schema.clientes.passwordHash })
    .from(schema.clientes)
    .where(and(eq(schema.clientes.email, email.data), eq(schema.clientes.activo, true)))
    .limit(1);
  if (!cliente) return respuesta;

  const url = `${siteUrl}/portal/clave?token=${await crearAccesoCliente(cliente.id)}`;
  const plantilla = emailClaveCliente({ nombre: cliente.nombre.split(" ")[0], url, minutos: MINUTOS_ENLACE_CLIENTE, activar: !cliente.hash });
  await correo(email.data, plantilla, url);
  await registrar("portal.clave_pedida", `cliente #${cliente.id}`);
  return respuesta;
}

/** Fija la contraseña con el enlace del correo (un solo uso) y entra. */
export async function establecerClave(_prev: PortalState, fd: FormData): Promise<PortalState> {
  if (!hasDb) return { error: "El portal aún no está disponible." };
  if (await esBot()) return { error: BOT };
  const password = leer(fd, "password", 201);
  const problema = problemaPassword(password, leer(fd, "confirmacion", 201), "", MINIMO_PASSWORD_CLIENTE);
  if (problema) return { error: problema };

  const clienteId = await consumirAccesoCliente(leer(fd, "token", 64));
  if (!clienteId) return { error: "El enlace venció o ya se usó. Pide uno nuevo." };
  await guardarPasswordCliente(clienteId, await hashPassword(password));
  await crearSesionCliente(clienteId);
  await registrar("portal.clave_nueva", `cliente #${clienteId}`);
  redirect("/portal");
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
