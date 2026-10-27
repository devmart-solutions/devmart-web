import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import { sealData, unsealData } from "iron-session";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { db, hasDb, schema } from "@/lib/db";
import { CLIENTE_COOKIE, CLIENTE_SESION_DIAS } from "./constants";
import { verifyPassword } from "./password";

// Acceso de clientes al portal: email y contraseña, enlace mágico de un solo uso y sesión en su
// propia cookie. El registro se confirma con un enlace al email antes de crear o activar la cuenta.
// La sesión del panel (/admin) y la del portal no se pueden intercambiar: usan cookies distintas,
// claves de sellado distintas y datos con forma distinta.

type SesionCliente = { clienteId: number; iat: number; exp: number };

export const MINUTOS_ENLACE_CLIENTE = 15;

/** Clave de sellado propia del portal, derivada de SESSION_SECRET (no sirve para abrir la del panel). */
function claveSellado(uso = "portal-clientes") {
  const base = process.env.SESSION_SECRET ?? "";
  if (base.length < 32) throw new Error("Falta SESSION_SECRET (mínimo 32 caracteres).");
  return createHash("sha256").update(`${uso}:${base}`).digest("hex");
}

const opcionesCookie = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

const huellaToken = (token: string) => createHash("sha256").update(token).digest("base64url");

/** Crea un enlace de acceso (15 min, un solo uso) y devuelve el token en claro para el correo. */
export async function crearAccesoCliente(clienteId: number) {
  const token = randomBytes(32).toString("base64url");
  await db()
    .insert(schema.accesosCliente)
    .values({ clienteId, hash: huellaToken(token), expira: new Date(Date.now() + MINUTOS_ENLACE_CLIENTE * 60_000) });
  return token;
}

/** Marca el enlace como usado (de forma atómica) y devuelve el cliente si sigue activo. */
export async function consumirAccesoCliente(token: string): Promise<number | null> {
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) return null;
  const t = schema.accesosCliente;
  const [acceso] = await db()
    .update(t)
    .set({ usado: new Date() })
    .where(and(eq(t.hash, huellaToken(token)), isNull(t.usado), gt(t.expira, new Date())))
    .returning({ clienteId: t.clienteId });
  if (!acceso) return null;
  const [cliente] = await db()
    .select({ id: schema.clientes.id })
    .from(schema.clientes)
    .where(and(eq(schema.clientes.id, acceso.clienteId), eq(schema.clientes.activo, true)))
    .limit(1);
  return cliente?.id ?? null;
}

/** El enlace existe, no se ha usado y no ha caducado (para mostrar la pantalla de entrada). */
export async function accesoVigente(token: string) {
  await connection();
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) return false;
  const t = schema.accesosCliente;
  const [fila] = await db()
    .select({ id: t.id })
    .from(t)
    .where(and(eq(t.hash, huellaToken(token)), isNull(t.usado), gt(t.expira, new Date())))
    .limit(1);
  return Boolean(fila);
}

export async function crearSesionCliente(clienteId: number) {
  const ttl = CLIENTE_SESION_DIAS * 24 * 60 * 60;
  const ahora = Date.now();
  const data: SesionCliente = { clienteId, iat: ahora, exp: ahora + ttl * 1000 };
  const sellada = await sealData(data, { password: claveSellado(), ttl });
  (await cookies()).set(CLIENTE_COOKIE, sellada, { ...opcionesCookie, maxAge: ttl });
}

export async function cerrarSesionCliente() {
  (await cookies()).set(CLIENTE_COOKIE, "", { ...opcionesCookie, maxAge: 0 });
}

/** clienteId de la sesión, solo si la cookie es válida, no ha caducado y el cliente sigue activo. */
export async function leerSesionCliente(): Promise<number | null> {
  await connection();
  if (!hasDb) return null;
  const raw = (await cookies()).get(CLIENTE_COOKIE)?.value;
  if (!raw) return null;
  try {
    const data = await unsealData<Partial<SesionCliente>>(raw, { password: claveSellado() });
    if (typeof data.clienteId !== "number" || typeof data.exp !== "number" || data.exp <= Date.now()) return null;
    const [cliente] = await db()
      .select({ id: schema.clientes.id })
      .from(schema.clientes)
      .where(and(eq(schema.clientes.id, data.clienteId), eq(schema.clientes.activo, true)))
      .limit(1);
    return cliente?.id ?? null;
  } catch {
    return null;
  }
}

/**
 * Capa de acceso del portal: cada página y acción la llama y filtra TODO por el clienteId que
 * devuelve. Sin sesión válida, lleva a la pantalla de ingreso.
 */
export async function requireCliente(): Promise<number> {
  const clienteId = await leerSesionCliente();
  if (!clienteId) redirect("/portal/ingreso");
  return clienteId;
}

/* ───────────── Email y contraseña ───────────── */

export const MINIMO_PASSWORD_CLIENTE = 8;

// Hash de relleno: un email inexistente tarda lo mismo que una contraseña incorrecta.
const DUMMY_HASH = "scrypt.32768.8.1.AAAAAAAAAAAAAAAAAAAAAA==.AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";

/** clienteId si el email y la contraseña son correctos y el cliente está activo. */
export async function verificarCredencialesCliente(email: string, password: string): Promise<number | null> {
  const [cliente] = await db()
    .select({ id: schema.clientes.id, hash: schema.clientes.passwordHash, activo: schema.clientes.activo })
    .from(schema.clientes)
    .where(eq(schema.clientes.email, email))
    .limit(1);
  const ok = await verifyPassword(password, cliente?.hash || DUMMY_HASH);
  return ok && cliente?.activo ? cliente.id : null;
}

/** Fija la contraseña del cliente (al activar la cuenta o al recuperarla). */
export async function guardarPasswordCliente(clienteId: number, passwordHash: string) {
  await db().update(schema.clientes).set({ passwordHash }).where(eq(schema.clientes.id, clienteId));
}

/* ───────────── Registro ─────────────
   Los datos del registro viajan sellados en el enlace del correo (24 h): la cuenta solo se crea o
   se activa cuando alguien demuestra que el email es suyo. */

export type Registro = { nombre: string; email: string; telefono: string; empresa: string; passwordHash: string };

export const HORAS_REGISTRO = 24;

export async function sellarRegistro(r: Registro) {
  const ttl = HORAS_REGISTRO * 60 * 60;
  return sealData({ ...r, exp: Date.now() + ttl * 1000 }, { password: claveSellado("portal-registro"), ttl });
}

export async function abrirRegistro(token: string): Promise<Registro | null> {
  if (!token || token.length > 2000) return null;
  try {
    const d = await unsealData<Partial<Registro & { exp: number }>>(token, { password: claveSellado("portal-registro") });
    if (typeof d.exp !== "number" || d.exp <= Date.now()) return null;
    if (typeof d.email !== "string" || typeof d.nombre !== "string" || typeof d.passwordHash !== "string") return null;
    return { nombre: d.nombre, email: d.email, telefono: d.telefono ?? "", empresa: d.empresa ?? "", passwordHash: d.passwordHash };
  } catch {
    return null;
  }
}

export type ResultadoRegistro =
  | { estado: "creada"; clienteId: number }
  | { estado: "activada"; clienteId: number }
  | { estado: "ya_activa" }
  | { estado: "inactiva" };

/**
 * Crea la cuenta o activa la que creó el administrador con ese email. Una cuenta que ya tiene
 * contraseña nunca se modifica: así un enlace viejo no sirve para cambiarla.
 */
export async function confirmarRegistro(r: Registro): Promise<ResultadoRegistro> {
  const [existente] = await db()
    .select({ id: schema.clientes.id, hash: schema.clientes.passwordHash, activo: schema.clientes.activo, telefono: schema.clientes.telefono, empresa: schema.clientes.empresa })
    .from(schema.clientes)
    .where(eq(schema.clientes.email, r.email))
    .limit(1);

  if (!existente) {
    const [nuevo] = await db()
      .insert(schema.clientes)
      .values({ nombre: r.nombre, email: r.email, telefono: r.telefono, empresa: r.empresa, passwordHash: r.passwordHash })
      .onConflictDoNothing()
      .returning({ id: schema.clientes.id });
    return nuevo ? { estado: "creada", clienteId: nuevo.id } : { estado: "ya_activa" };
  }
  if (existente.hash) return { estado: "ya_activa" };
  if (!existente.activo) return { estado: "inactiva" };

  // Activación: el nombre y la empresa que puso el administrador se respetan; se completan los vacíos.
  const [activada] = await db()
    .update(schema.clientes)
    .set({
      passwordHash: r.passwordHash,
      telefono: existente.telefono || r.telefono,
      empresa: existente.empresa || r.empresa,
    })
    .where(and(eq(schema.clientes.id, existente.id), eq(schema.clientes.passwordHash, "")))
    .returning({ id: schema.clientes.id });
  return activada ? { estado: "activada", clienteId: activada.id } : { estado: "ya_activa" };
}
