import "server-only";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { enviarEmail } from "@/lib/email";
import { generarEmailHtml } from "@/lib/email-templates";
import { siteUrl } from "@/lib/site";

// Avisos por correo del portal. Un aviso que falla nunca rompe la acción: se registra en el log.

async function enviar(to: string, subject: string, lineas: string[], url?: string) {
  try {
    const html = generarEmailHtml({
      titulo: subject,
      subtitulo: "// Portal de clientes",
      cuerpo: lineas,
      ...(url ? { boton: { texto: "Ver en el portal", url } } : {}),
    });
    const ok = await enviarEmail({ to, subject, text: lineas.join("\n"), html });
    if (!ok) console.info(`[portal] Sin proveedor de correo. Aviso no enviado a ${to}: ${subject}`);
  } catch (err) {
    console.error("[portal] No se pudo enviar el aviso:", err);
  }
}

/** Al administrador (CONTACT_TO_EMAIL o, si no está, ADMIN_EMAIL). */
export async function avisarAdmin(subject: string, lineas: string[]) {
  const to = process.env.CONTACT_TO_EMAIL || process.env.ADMIN_EMAIL;
  if (!to) return;
  await enviar(to, subject, lineas, `${siteUrl}/admin/clientes`);
}

/** Al cliente dueño de la obra. */
export async function avisarClienteDeObra(obraId: number, subject: string, lineas: string[]) {
  const [fila] = await db()
    .select({ email: schema.clientes.email, nombre: schema.clientes.nombre, activo: schema.clientes.activo })
    .from(schema.obras)
    .innerJoin(schema.clientes, eq(schema.obras.clienteId, schema.clientes.id))
    .where(eq(schema.obras.id, obraId))
    .limit(1);
  if (!fila?.activo) return;
  await enviar(
    fila.email,
    subject,
    [`Hola, ${fila.nombre.split(" ")[0]}:`, ...lineas],
    `${siteUrl}/portal`,
  );
}

