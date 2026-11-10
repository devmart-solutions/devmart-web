"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";
import { leerSesionCliente } from "@/lib/auth/cliente";
import { esBot } from "@/lib/botid";
import { db, schema } from "@/lib/db";
import { avisarAdmin } from "@/lib/portal/avisos";
import { permitir, registrar } from "@/lib/security";

export type OpinionState = { ok?: boolean; message?: string; error?: string };

const opinionSchema = z.object({
  texto: z.string().trim().min(15, "Cuéntanos un poco más (al menos 15 caracteres).").max(1200, "Máximo 1200 caracteres."),
  valoracion: z.coerce.number().int().min(1, "Elige de 1 a 5 estrellas.").max(5, "Elige de 1 a 5 estrellas."),
  publicacionId: z
    .string()
    .default("")
    .transform((s) => (s ? Number(s) : null))
    .pipe(z.number().int().positive().nullable()),
});

/** Opinión de un cliente con sesión en el portal. Queda pendiente hasta que el admin la apruebe. */
export async function crearOpinion(_prev: OpinionState, fd: FormData): Promise<OpinionState> {
  const clienteId = await leerSesionCliente();
  if (!clienteId) return { error: "Inicia sesión en el portal para dejar tu opinión." };
  if (await esBot()) return { error: "No pudimos verificar el envío. Inténtalo de nuevo." };
  if (!(await permitir(`comunidad-opinion:${clienteId}`, 5, 3600))) {
    return { error: "Ya enviaste varias opiniones. Espera un rato antes de enviar otra." };
  }
  const parsed = opinionSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revisa los datos." };
  const { texto, valoracion, publicacionId } = parsed.data;

  if (publicacionId) {
    const [pub] = await db()
      .select({ id: schema.publicaciones.id })
      .from(schema.publicaciones)
      .where(eq(schema.publicaciones.id, publicacionId))
      .limit(1);
    if (!pub) return { error: "Esa publicación ya no está disponible." };
  }

  const [nueva] = await db()
    .insert(schema.opiniones)
    .values({ clienteId, texto, valoracion, publicacionId })
    .returning({ id: schema.opiniones.id });
  await registrar("comunidad.opinion", `#${nueva!.id} · cliente #${clienteId} · ${valoracion}★`);
  await avisarAdmin(`Nueva opinión en Comunidad (${valoracion}★)`, [
    "Un cliente dejó una opinión que espera tu aprobación:",
    "",
    texto,
    "",
    "Apruébala o respóndela en el panel, sección Opiniones.",
  ]);
  return { ok: true, message: "Gracias. Revisaremos tu opinión y la publicaremos pronto." };
}
