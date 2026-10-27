import "server-only";
import { inArray } from "drizzle-orm";
import { db, hasDb, schema } from "@/lib/db";

/** Configuración del acceso al panel que vive en las variables de entorno (ver `npm run admin:setup`). */
export function adminConfig() {
  const email = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
  const passwordHash = process.env.ADMIN_PASSWORD_HASH ?? "";
  const sessionSecret = process.env.SESSION_SECRET ?? "";
  const totpSecret = process.env.ADMIN_TOTP_SECRET ?? "";
  return {
    email,
    passwordHash,
    sessionSecret,
    totpSecret,
    ready: Boolean(email && passwordHash.startsWith("scrypt.") && sessionSecret.length >= 32),
  };
}

/**
 * Claves de `ajustes` donde el panel guarda la contraseña y el 2FA cuando se cambian desde allí.
 * Llevan el email del administrador: si cambia ADMIN_EMAIL (o en local se usa otra cuenta contra
 * la misma base de datos), las credenciales de una cuenta nunca valen para otra.
 */
export const clavesCuenta = (email: string) => ({
  passwordHash: `admin_password_hash:${email}`,
  totpSecret: `admin_totp_secret:${email}`,
  reset: `admin_reset:${email}`,
  login: `admin_login:${email}`,
});

/**
 * Credenciales vigentes: las guardadas desde el panel tienen prioridad sobre las del entorno.
 * Así la contraseña se puede cambiar o recuperar sin volver a desplegar.
 */
export async function credenciales() {
  const env = adminConfig();
  let passwordHash = env.passwordHash;
  let totpSecret = env.totpSecret;
  if (hasDb && env.email) {
    const claves = clavesCuenta(env.email);
    const rows = await db()
      .select()
      .from(schema.ajustes)
      .where(inArray(schema.ajustes.clave, [claves.passwordHash, claves.totpSecret]));
    const valor = (clave: string) => rows.find((r) => r.clave === clave)?.valor;
    passwordHash = valor(claves.passwordHash) || passwordHash;
    totpSecret = valor(claves.totpSecret) ?? totpSecret;
  }
  const base = Boolean(env.email && env.sessionSecret.length >= 32);
  return {
    email: env.email,
    sessionSecret: env.sessionSecret,
    passwordHash,
    totpSecret,
    /** Hay email y firma de sesión: se puede crear o recuperar la contraseña por correo. */
    base,
    ready: base && passwordHash.startsWith("scrypt."),
  };
}
