"use server";

import { redirect } from "next/navigation";
import { credenciales } from "@/lib/auth/config";
import { anularTokenRecuperacion, crearTokenRecuperacion, guardarCredenciales, MINUTOS_ENLACE, tokenValido } from "@/lib/auth/cuenta";
import { hashPassword, problemaPassword, verifyPassword } from "@/lib/auth/password";
import { borrarPasoPendiente, crearPasoPendiente, createSession, pasoPendienteValido, revocarSesiones } from "@/lib/auth/session";
import { esSecretoTotp, verifyTotp } from "@/lib/auth/totp";
import { esBot } from "@/lib/botid";
import { enviarEmail, hayProveedorEmail } from "@/lib/email";
import { emailRecuperarAdmin } from "@/lib/email-templates";
import { huellaCliente, permitir, registrar, reiniciar } from "@/lib/security";
import { siteUrl } from "@/lib/site";

export type LoginState = { error?: string; ok?: boolean; message?: string; paso?: "codigo" };

// Hash de relleno para que un email incorrecto tarde lo mismo que una contraseña incorrecta.
const DUMMY_HASH = "scrypt.32768.8.1.AAAAAAAAAAAAAAAAAAAAAA==.AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";
const BOT = "No pudimos verificar tu navegador. Inténtalo de nuevo.";

const leer = (fd: FormData, campo: string, max = 200) => String(fd.get(campo) ?? "").slice(0, max);
const codigoDe = (fd: FormData) => leer(fd, "codigo", 10).replace(/\s/g, "");

/**
 * Entrar en dos pasos: primero email y contraseña; si hay verificación en dos pasos, después
 * el código de la app (con una cookie de 5 minutos que solo vale para ese segundo paso).
 */
export async function iniciarSesion(_prev: LoginState, fd: FormData): Promise<LoginState> {
  const cfg = await credenciales();
  if (!cfg.ready) return { error: "Aún no hay contraseña. Usa «¿Olvidaste tu contraseña?» para crearla." };

  if (await esBot()) return { error: BOT };

  // Máximo 5 intentos cada 15 minutos por conexión y 30 en total, contra fuerza bruta distribuida.
  const huella = await huellaCliente();
  const porCliente = `login:${huella}`;
  if (!(await permitir(porCliente, 5, 900)) || !(await permitir("login:global", 30, 900))) {
    await registrar("login.bloqueado", huella);
    return { error: "Demasiados intentos. Espera 15 minutos antes de volver a intentarlo." };
  }

  if (leer(fd, "paso", 10) === "codigo") {
    if (!(await pasoPendienteValido())) {
      await borrarPasoPendiente();
      return { error: "Pasaron más de 5 minutos. Escribe de nuevo tu email y contraseña." };
    }
    if (!cfg.totpSecret || !verifyTotp(cfg.totpSecret, codigoDe(fd))) {
      await registrar("login.codigo_incorrecto", huella);
      return { paso: "codigo", error: "El código no es correcto. Usa el que muestra ahora tu app (cambia cada 30 segundos)." };
    }
    return entrar(porCliente, huella);
  }

  const email = leer(fd, "email", 254).trim().toLowerCase();
  const emailOk = email === cfg.email;
  const passwordOk = await verifyPassword(leer(fd, "password"), emailOk ? cfg.passwordHash : DUMMY_HASH);
  if (!(emailOk && passwordOk)) {
    await registrar("login.fallido", huella);
    return { error: "Email o contraseña incorrectos." };
  }
  if (!cfg.totpSecret) return entrar(porCliente, huella);

  await crearPasoPendiente();
  return { paso: "codigo" };
}

async function entrar(porCliente: string, huella: string): Promise<never> {
  await reiniciar(porCliente);
  await borrarPasoPendiente();
  await createSession();
  await registrar("login", huella);
  redirect("/admin");
}

/** Envía al email del administrador un enlace de un solo uso para crear o recuperar la contraseña. */
export async function solicitarEnlace(_prev: LoginState, fd: FormData): Promise<LoginState> {
  const cfg = await credenciales();
  if (!cfg.base) return { error: "El panel aún no está configurado (falta ADMIN_EMAIL o SESSION_SECRET)." };
  if (!hayProveedorEmail() && process.env.NODE_ENV === "production") {
    return { error: "El envío de correos aún no está configurado. Avísale a quien administra el sitio." };
  }
  if (await esBot()) return { error: BOT };

  const huella = await huellaCliente();
  if (!(await permitir(`recuperar:${huella}`, 3, 900)) || !(await permitir("recuperar:global", 10, 3600))) {
    return { error: "Ya pediste varios enlaces. Espera 15 minutos y revisa tu correo (también la carpeta de spam)." };
  }

  const email = leer(fd, "email", 254).trim().toLowerCase();
  // Misma respuesta exista o no la cuenta, para no revelar cuál es el email del administrador.
  const respuesta = {
    ok: true,
    message: `Si ese es el email del administrador, te enviamos un enlace. Vence en ${MINUTOS_ENLACE} minutos.`,
  };
  if (email !== cfg.email) {
    await registrar("recuperacion.email_incorrecto", huella);
    return respuesta;
  }

  const token = await crearTokenRecuperacion();
  const enlace = `${siteUrl}/admin/login/nueva?token=${token}`;
  const plantilla = emailRecuperarAdmin({ url: enlace, minutos: MINUTOS_ENLACE });
  const enviado = await enviarEmail({
    to: cfg.email,
    subject: plantilla.subject,
    text: plantilla.text,
    html: plantilla.html,
  }).catch((err) => {
    console.error("[recuperar] Error al enviar el correo:", err);
    return false;
  });

  if (!enviado) {
    if (process.env.NODE_ENV !== "production") {
      console.info(`[recuperar] Sin proveedor de correo. Enlace (solo en desarrollo): ${enlace}`);
      return respuesta;
    }
    await anularTokenRecuperacion();
    return { error: "No pudimos enviar el correo. Inténtalo de nuevo en unos minutos." };
  }
  await registrar("recuperacion.enviada", huella);
  return respuesta;
}

/** Fija la contraseña nueva y vuelve a configurar la verificación en dos pasos. */
export async function establecerPassword(_prev: LoginState, fd: FormData): Promise<LoginState> {
  if (await esBot()) return { error: BOT };
  const huella = await huellaCliente();
  if (!(await permitir(`nueva:${huella}`, 10, 900))) {
    return { error: "Demasiados intentos. Espera 15 minutos antes de volver a intentarlo." };
  }

  const token = leer(fd, "token", 64);
  if (!(await tokenValido(token))) {
    return { error: "El enlace venció o ya se usó. Pide uno nuevo desde «¿Olvidaste tu contraseña?»." };
  }

  const cfg = await credenciales();
  const password = leer(fd, "password", 201);
  const problema = problemaPassword(password, leer(fd, "confirmacion", 201), cfg.email);
  if (problema) return { error: problema };

  const secreto = leer(fd, "secreto", 64);
  if (!esSecretoTotp(secreto) || !verifyTotp(secreto, codigoDe(fd))) {
    return { error: "El código de 6 dígitos no coincide. Revisa que escaneaste el código QR de esta página." };
  }

  await guardarCredenciales({ passwordHash: await hashPassword(password), totpSecret: secreto });
  await anularTokenRecuperacion();
  await revocarSesiones();
  await registrar("password.restablecida", huella);
  redirect("/admin/login?listo=1");
}
