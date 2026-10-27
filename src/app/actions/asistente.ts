"use server";

import { db, hasDb, schema } from "@/lib/db";
import { enviarEmail, hayProveedorEmail } from "@/lib/email";
import { emailNuevoContacto } from "@/lib/email-templates";
import { responder, type Respuesta } from "@/lib/asistente";
import { huellaCliente, permitir, registrar } from "@/lib/security";
import { WHATSAPP_VISIBLE } from "@/lib/site";

const PROMPT_SISTEMA = `Eres el asistente virtual de DevMart Solutions (devmart.co), empresa de software a medida en Cartagena de Indias, Colombia.
Tu tono es profesional, amigable, claro y directo.
Responde de forma concisa (máximo 2 a 3 párrafos cortos).
Usa negritas con **texto** para resaltar ideas importantes.
Servicios: desarrollo web con Next.js/React, tiendas en línea (con Wompi/PSE), paneles de administración, apps móviles y software a medida.
El código fuente y propiedad intelectual siempre es 100% del cliente.
Ubicación: Cartagena, Colombia, trabajando remotamente con todo el país.
WhatsApp: ${WHATSAPP_VISIBLE}.
Si el usuario desea cotizar o dejar sus datos, anímalo a dejar su nombre y correo/teléfono.`;

/**
 * Consulta inteligente con IA (Gemini / OpenAI) si hay API key configurada, con fallback
 * automático e instantáneo al motor heurístico sin costo.
 */
export async function consultarAsistenteAction(pregunta: string): Promise<Respuesta> {
  const limpia = pregunta.trim().slice(0, 300);
  if (!limpia) return responder("hola");

  // Rate limiting suave por visitante (máximo 25 preguntas por 5 minutos)
  const permitida = await permitir(`asistente:${await huellaCliente()}`, 25, 300);
  if (!permitida) {
    return {
      texto: "Has realizado varias consultas en poco tiempo. Por favor espera un momento o contáctanos directamente por WhatsApp.",
      whatsappMensaje: "Hola DevMart, estuve usando el asistente y prefiero consultarles por aquí.",
    };
  }

  const { GEMINI_API_KEY, OPENAI_API_KEY } = process.env;

  // 1. Intento con Google Gemini si está configurado
  if (GEMINI_API_KEY) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{ text: `${PROMPT_SISTEMA}\n\nPregunta del usuario:\n${limpia}` }],
              },
            ],
          }),
        },
      );
      clearTimeout(timeout);

      if (res.ok) {
        const data = (await res.json()) as {
          candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
        };
        const respuestaIa = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (respuestaIa) {
          const respBase = responder(limpia);
          return {
            texto: respuestaIa,
            enlaces: respBase.enlaces,
            sugerenciasSeguimiento: respBase.sugerenciasSeguimiento,
            whatsappMensaje: respBase.whatsappMensaje,
            tipoAccion: respBase.tipoAccion,
          };
        }
      }
    } catch {
      // En caso de timeout o error, se ejecuta el fallback sin interrumpir la experiencia.
    }
  }

  // 2. Intento con OpenAI si está configurado
  if (OPENAI_API_KEY) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: PROMPT_SISTEMA },
            { role: "user", content: limpia },
          ],
          max_tokens: 300,
          temperature: 0.7,
        }),
      });
      clearTimeout(timeout);

      if (res.ok) {
        const data = (await res.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
        };
        const respuestaIa = data.choices?.[0]?.message?.content?.trim();
        if (respuestaIa) {
          const respBase = responder(limpia);
          return {
            texto: respuestaIa,
            enlaces: respBase.enlaces,
            sugerenciasSeguimiento: respBase.sugerenciasSeguimiento,
            whatsappMensaje: respBase.whatsappMensaje,
            tipoAccion: respBase.tipoAccion,
          };
        }
      }
    } catch {
      // Fallback a motor heurístico
    }
  }

  // 3. Fallback al motor heurístico nativo (instantáneo, confiable y sin costo)
  return responder(limpia);
}

export type LeadAsistenteData = {
  nombre: string;
  contacto: string;
  mensaje: string;
};

export type LeadAsistenteResultado = {
  ok: boolean;
  mensaje: string;
};

/**
 * Guarda un prospecto capturado directamente desde la ventana del asistente.
 */
export async function guardarLeadAsistenteAction(
  data: LeadAsistenteData,
): Promise<LeadAsistenteResultado> {
  const nombre = data.nombre.trim().slice(0, 100);
  const contacto = data.contacto.trim().slice(0, 120);
  const mensaje = data.mensaje.trim().slice(0, 500);

  if (nombre.length < 2) {
    return { ok: false, mensaje: "Por favor escribe tu nombre." };
  }
  if (contacto.length < 5) {
    return { ok: false, mensaje: "Indica un WhatsApp o correo electrónico válido." };
  }

  // Rate limiting (máximo 4 leads cada 15 min por IP)
  const permitida = await permitir(`lead-asistente:${await huellaCliente()}`, 4, 900);
  if (!permitida) {
    return {
      ok: false,
      mensaje: "Ya hemos recibido tus datos recientemente. Te contactaremos pronto.",
    };
  }

  const esEmail = contacto.includes("@");
  const emailFila = esEmail ? contacto : "contacto-chat@devmart.co";
  const telefonoFila = esEmail ? "No especificado" : contacto;

  if (hasDb) {
    try {
      await db().insert(schema.mensajes).values({
        nombre,
        email: emailFila,
        telefono: telefonoFila,
        tipo: "Lead desde Asistente",
        presupuesto: "Por definir en chat",
        descripcion: mensaje ? `Mensaje del chat: ${mensaje}` : "Solicitó contacto desde el asistente virtual",
        estado: "nuevo",
        notas: `Capturado directamente desde el asistente virtual. Contacto provisto: ${contacto}`,
      });
      await registrar("asistente.lead", `${nombre} (${contacto})`);
    } catch (err) {
      console.error("[asistente] Error al guardar lead:", err);
    }
  }

  // Notificación por correo al administrador si está configurado
  const to = process.env.CONTACT_TO_EMAIL || process.env.ADMIN_EMAIL;
  if (to && hayProveedorEmail()) {
    try {
      const plantilla = emailNuevoContacto({
        nombre,
        email: emailFila,
        telefono: telefonoFila,
        tipo: "Lead desde Asistente Virtual",
        presupuesto: "Por definir",
        descripcion: `Contacto dejado en el chat: ${contacto}\n${mensaje ? `Nota: ${mensaje}` : ""}`,
      });
      await enviarEmail({
        to,
        subject: `Nuevo lead desde el Asistente: ${nombre}`,
        text: plantilla.text,
        html: plantilla.html,
      });
    } catch (err) {
      console.error("[asistente] Error enviando correo de lead:", err);
    }
  }

  return {
    ok: true,
    mensaje: `¡Muchas gracias, ${nombre.split(" ")[0]}! Hemos registrado tus datos. Un miembro del equipo te escribirá hoy mismo por ${esEmail ? "correo" : "WhatsApp"}.`,
  };
}
