import "server-only";
import { createHash } from "node:crypto";
import { sealData, unsealData } from "iron-session";
import { cookies } from "next/headers";

// Quien entra al portal con Google o GitHub sin ser cliente puede dejar sus datos como prospecto.
// Su email (ya verificado por el proveedor) y su nombre esperan en una cookie sellada y corta, así
// el formulario no tiene que pedirlos ni puede falsearlos.

export type Prospecto = { email: string; nombre: string };

const COOKIE = "dm_prospecto";
const MINUTOS = 30;
const opciones = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/portal",
};

function clave() {
  const base = process.env.SESSION_SECRET ?? "";
  if (base.length < 32) throw new Error("Falta SESSION_SECRET (mínimo 32 caracteres).");
  return createHash("sha256").update(`portal-prospecto:${base}`).digest("hex");
}

export async function guardarProspecto(p: Prospecto) {
  const ttl = MINUTOS * 60;
  const sellado = await sealData({ ...p, exp: Date.now() + ttl * 1000 }, { password: clave(), ttl });
  (await cookies()).set(COOKIE, sellado, { ...opciones, maxAge: ttl });
}

export async function leerProspecto(): Promise<Prospecto | null> {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return null;
  try {
    const d = await unsealData<Partial<Prospecto & { exp: number }>>(raw, { password: clave() });
    if (typeof d.email !== "string" || typeof d.exp !== "number" || d.exp <= Date.now()) return null;
    return { email: d.email, nombre: typeof d.nombre === "string" ? d.nombre : "" };
  } catch {
    return null;
  }
}

export async function borrarProspecto() {
  (await cookies()).set(COOKIE, "", { ...opciones, maxAge: 0 });
}
