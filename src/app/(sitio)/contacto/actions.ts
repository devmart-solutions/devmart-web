"use server";

import { readContacto, validateContacto, type ContactoData, type ContactoState } from "@/lib/contacto";
import { esBot } from "@/lib/botid";
import { db, hasDb, schema } from "@/lib/db";
import { enviarEmail, hayProveedorEmail } from "@/lib/email";
import { emailNuevoContacto } from "@/lib/email-templates";
import { huellaCliente, permitir } from "@/lib/security";

function texto(d: ContactoData) {
  return [
    `Nombre: ${d.nombre}`,
    `Email: ${d.email}`,
    `Teléfono: ${d.telefono}`,
    `Tipo de proyecto: ${d.tipo}`,
    `Presupuesto: ${d.presupuesto}`,
    "",
    d.descripcion,
    "",
    "Autorizó el tratamiento de datos (Ley 1581 de 2012).",
  ].join("\n");
}

/**
 * Envía el mensaje con el primer proveedor configurado:
 * - Email (Resend o SMTP, ver src/lib/email.ts) a CONTACT_TO_EMAIL
 * - Formspree: FORMSPREE_ENDPOINT
 * Sin proveedor, en desarrollo solo se registra en la consola.
 */
async function enviar(d: ContactoData, guardado: boolean): Promise<boolean> {
  const { CONTACT_TO_EMAIL, FORMSPREE_ENDPOINT } = process.env;

  if (CONTACT_TO_EMAIL && hayProveedorEmail()) {
    const plantilla = emailNuevoContacto({
      nombre: d.nombre,
      email: d.email,
      telefono: d.telefono,
      tipo: d.tipo,
      presupuesto: d.presupuesto,
      descripcion: d.descripcion,
    });
    return enviarEmail({
      to: CONTACT_TO_EMAIL,
      replyTo: d.email,
      subject: plantilla.subject,
      text: plantilla.text,
      html: plantilla.html,
    });
  }

  if (FORMSPREE_ENDPOINT) {
    const res = await fetch(FORMSPREE_ENDPOINT, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ ...d, _replyto: d.email, _subject: `Nuevo proyecto: ${d.tipo}` }),
    });
    return res.ok;
  }

  // Sin proveedor de email: basta con que haya quedado en la base de datos.
  if (guardado) return false;
  if (process.env.NODE_ENV !== "production") {
    console.info("[contacto] Sin proveedor de envío configurado. Mensaje recibido:\n" + texto(d));
    return true;
  }
  console.error("[contacto] Falta configurar CONTACT_TO_EMAIL con Resend/SMTP, o FORMSPREE_ENDPOINT.");
  return false;
}

export async function enviarContacto(_prev: ContactoState, fd: FormData): Promise<ContactoState> {
  // Campo trampa para bots: si viene lleno, fingimos éxito y no enviamos nada.
  if (String(fd.get("empresa_web") ?? "")) return { status: "success" };

  const data = readContacto(fd);
  const errors = validateContacto(data);
  if (Object.keys(errors).length > 0) {
    return { status: "error", errors, values: data };
  }

  // Anti-abuso: bots detectados por Vercel BotID, máximo 5 envíos cada 10 minutos por visitante y
  // 40 por hora en total, para que muchos bots con IPs distintas no llenen la bandeja ni el correo.
  if (await esBot()) return { status: "error", errors: {}, values: data, message: "No pudimos verificar tu envío. Escríbenos por WhatsApp." };
  if (!(await permitir(`contacto:${await huellaCliente()}`, 5, 600)) || !(await permitir("contacto:global", 40, 3600))) {
    return {
      status: "error",
      errors: {},
      values: data,
      message: "Recibimos varios mensajes seguidos desde tu conexión. Espera unos minutos o escríbenos por WhatsApp.",
    };
  }

  // Se guarda en la bandeja del panel (/admin/mensajes) y, si hay proveedor, también se envía por email.
  let guardado = false;
  if (hasDb) {
    try {
      const { datos: _datos, ...fila } = data;
      void _datos;
      await db().insert(schema.mensajes).values(fila);
      guardado = true;
    } catch (err) {
      console.error("[contacto] Error al guardar:", err);
    }
  }
  try {
    if ((await enviar(data, guardado)) || guardado) return { status: "success" };
  } catch (err) {
    console.error("[contacto] Error al enviar:", err);
    if (guardado) return { status: "success" };
  }
  return {
    status: "error",
    errors: {},
    values: data,
    message: "No pudimos enviar tu mensaje. Inténtalo de nuevo o escríbenos por WhatsApp.",
  };
}
