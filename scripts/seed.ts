// Copia el contenido estático (src/lib/content.ts, src/lib/blog.ts y src/content/blog/*.md)
// a la base de datos. Es idempotente: no toca lo que ya existe (salvo poner la portada a los artículos que no la tienen).
// Uso: npm run db:seed
//      npm run db:seed -- --portal   (además crea un cliente y una obra de prueba para el portal)
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { loadEnvConfig } from "@next/env";
import { neon } from "@neondatabase/serverless";
import { eq, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import { posts } from "../src/lib/blog";
import { precios, proyectos } from "../src/lib/content";
import * as schema from "../src/lib/db/schema";

loadEnvConfig(process.cwd());
const url = process.env.DATABASE_URL;
if (!url) throw new Error("Falta DATABASE_URL (ejecuta `vercel env pull .env.local`).");
const db = drizzle(neon(url), { schema });

async function main() {
  for (const p of posts) {
    const cuerpo = await readFile(join(process.cwd(), "src/content/blog", `${p.slug}.md`), "utf8");
    // Si el artículo ya existe, solo se le pone la portada cuando aún no tiene una.
    await db
      .insert(schema.posts)
      .values({ ...p, cuerpo })
      .onConflictDoUpdate({
        target: schema.posts.slug,
        set: { imagen: p.imagen, imagenAlt: p.imagenAlt },
        setWhere: isNull(schema.posts.imagen),
      });
  }
  for (const [orden, p] of proyectos.entries()) {
    await db
      .insert(schema.proyectos)
      .values({ ...p, url: p.url ?? null, urlLabel: p.urlLabel ?? null, orden })
      .onConflictDoNothing({ target: schema.proyectos.slug });
  }
  const existentes = await db.select({ id: schema.precios.id }).from(schema.precios).limit(1);
  if (existentes.length === 0) {
    await db.insert(schema.precios).values(precios.map((p, orden) => ({ ...p, orden })));
  }
  console.log(`Listo: ${posts.length} artículos, ${proyectos.length} proyectos y ${precios.length} precios revisados.`);
  if (process.argv.includes("--portal")) await portalDePrueba();
}

/** Cliente y obra de ejemplo para probar el portal. El email .test no recibe correos reales. */
async function portalDePrueba() {
  const email = "cliente-prueba@devmart.test";
  await db
    .insert(schema.clientes)
    .values({ nombre: "Cliente de Prueba", email, empresa: "Empresa Demo" })
    .onConflictDoNothing({ target: schema.clientes.email });
  const [cliente] = await db.select().from(schema.clientes).where(eq(schema.clientes.email, email)).limit(1);
  const yaTiene = await db.select({ id: schema.obras.id }).from(schema.obras).where(eq(schema.obras.clienteId, cliente.id)).limit(1);
  if (yaTiene.length > 0) {
    console.log(`Portal: el cliente de prueba (#${cliente.id}) ya tiene obra; no se cambió nada.`);
    return;
  }

  const enDias = (d: number) => new Date(Date.now() + d * 86_400_000).toISOString().slice(0, 10);
  const [obra] = await db
    .insert(schema.obras)
    .values({ clienteId: cliente.id, nombre: "Tienda en línea Demo", tipo: "Tienda en línea", estado: "En desarrollo", fechaEntregaEstimada: enDias(30) })
    .returning();
  await db.insert(schema.etapas).values([
    { obraId: obra.id, orden: 1, nombre: "Idea y alcance", estado: "completada", porcentaje: 100, fecha: enDias(-20) },
    { obraId: obra.id, orden: 2, nombre: "Prototipo navegable", estado: "completada", porcentaje: 100, fecha: enDias(-8) },
    { obraId: obra.id, orden: 3, nombre: "Desarrollo", estado: "en_curso", porcentaje: 45, fecha: enDias(20) },
    { obraId: obra.id, orden: 4, nombre: "Lanzamiento", estado: "pendiente", porcentaje: 0, fecha: enDias(30) },
  ]);
  await db.insert(schema.entregables).values([
    { obraId: obra.id, titulo: "Prototipo de la tienda", version: "v1", url: "https://devmart.co/proyectos", estado: "aprobado" },
    { obraId: obra.id, titulo: "Catálogo y carrito", version: "v1", url: "https://devmart.co", estado: "por_aprobar" },
  ]);
  await db.insert(schema.pagos).values([
    { obraId: obra.id, concepto: "Anticipo 50 %", monto: 1_500_000, estado: "pagado", fechaPago: enDias(-20) },
    { obraId: obra.id, concepto: "Saldo al lanzamiento", monto: 1_500_000, estado: "pendiente", fechaPago: enDias(30) },
  ]);
  await db.insert(schema.solicitudes).values({
    obraId: obra.id,
    numero: 1,
    titulo: "Cambiar el color del botón de compra",
    detalle: "Nos gustaría que el botón de comprar fuera más visible.",
  });
  console.log(`Portal: cliente de prueba #${cliente.id} (${email}) con la obra #${obra.id} creados.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
