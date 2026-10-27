import "server-only";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { adminConfig, clavesCuenta } from "./config";

// Cambios de la cuenta del administrador guardados en `ajustes` (tienen prioridad sobre el entorno)
// y enlaces de un solo uso para crear o recuperar la contraseña por correo, o para entrar sin
// contraseña (siempre seguido del código 2FA).

export const MINUTOS_ENLACE = 30;
export const MINUTOS_ENLACE_ENTRAR = 15;

const claves = () => clavesCuenta(adminConfig().email);

async function guardar(clave: string, valor: string) {
  await db()
    .insert(schema.ajustes)
    .values({ clave, valor })
    .onConflictDoUpdate({ target: schema.ajustes.clave, set: { valor } });
}

export async function guardarCredenciales({ passwordHash, totpSecret }: { passwordHash?: string; totpSecret?: string }) {
  if (passwordHash) await guardar(claves().passwordHash, passwordHash);
  if (totpSecret !== undefined) await guardar(claves().totpSecret, totpSecret);
}

const hashToken = (token: string) => createHash("sha256").update(token).digest();

type Uso = "reset" | "login";

async function crearToken(uso: Uso, minutos: number) {
  const token = randomBytes(32).toString("base64url");
  const exp = Date.now() + minutos * 60 * 1000;
  await guardar(claves()[uso], JSON.stringify({ h: hashToken(token).toString("base64"), exp }));
  return token;
}

async function vigente(uso: Uso, token: string) {
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) return false;
  const [row] = await db().select().from(schema.ajustes).where(eq(schema.ajustes.clave, claves()[uso])).limit(1);
  if (!row) return false;
  try {
    const { h, exp } = JSON.parse(row.valor) as { h: string; exp: number };
    const esperado = Buffer.from(h, "base64");
    const actual = hashToken(token);
    return exp > Date.now() && esperado.length === actual.length && timingSafeEqual(esperado, actual);
  } catch {
    return false;
  }
}

/** Crea un enlace nuevo (anula el anterior). Solo se guarda la huella del token. */
export const crearTokenRecuperacion = () => crearToken("reset", MINUTOS_ENLACE);

/** El token es el vigente y no ha caducado. */
export const tokenValido = (token: string) => vigente("reset", token);

export async function anularTokenRecuperacion() {
  await db().delete(schema.ajustes).where(eq(schema.ajustes.clave, claves().reset));
}

/** Enlace para entrar al panel sin contraseña (lo pide el administrador desde el portal). */
export const crearTokenEntrar = () => crearToken("login", MINUTOS_ENLACE_ENTRAR);

export const tokenEntrarValido = (token: string) => vigente("login", token);

/** Gasta el enlace de entrada: devuelve true solo la primera vez y si sigue vigente. */
export async function consumirTokenEntrar(token: string) {
  if (!(await vigente("login", token))) return false;
  const borradas = await db().delete(schema.ajustes).where(eq(schema.ajustes.clave, claves().login)).returning();
  return borradas.length > 0;
}
