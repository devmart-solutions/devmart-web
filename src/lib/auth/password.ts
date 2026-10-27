import "server-only";
import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from "node:crypto";

// Hash de contraseña con scrypt (node:crypto). Formato: scrypt.N.r.p.salt.hash (base64).
// Se usa «.» como separador porque «$» se expandiría como variable en los archivos .env.
// El hash lo genera `npm run admin:setup` (ADMIN_PASSWORD_HASH) o el panel al cambiar la contraseña.

function derive(password: string, salt: Buffer, keylen: number, opts: ScryptOptions) {
  return new Promise<Buffer>((resolve, reject) =>
    scrypt(password, salt, keylen, { ...opts, maxmem: 128 * 1024 * 1024 }, (err, key) => (err ? reject(err) : resolve(key))),
  );
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [alg, n, r, p, saltB64, hashB64] = stored.split(".");
  if (alg !== "scrypt" || !saltB64 || !hashB64) return false;
  const expected = Buffer.from(hashB64, "base64");
  const actual = await derive(password, Buffer.from(saltB64, "base64"), expected.length, {
    N: Number(n),
    r: Number(r),
    p: Number(p),
  });
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

const N = 32768, r = 8, p = 1;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await derive(password, salt, 32, { N, r, p });
  return ["scrypt", N, r, p, salt.toString("base64"), hash.toString("base64")].join(".");
}

/** Reglas para una contraseña nueva (12 caracteres en el panel; los clientes usan 8). Devuelve el error o null. */
export function problemaPassword(password: string, confirmacion: string, email: string, minimo = 12): string | null {
  if (password.length < minimo) return `La contraseña debe tener al menos ${minimo} caracteres.`;
  if (password.length > 200) return "La contraseña es demasiado larga.";
  if (password !== confirmacion) return "Las dos contraseñas no coinciden.";
  if (email && password.toLowerCase().includes(email.split("@")[0])) return "No uses tu email dentro de la contraseña.";
  return null;
}
