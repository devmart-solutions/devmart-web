import "server-only";
import { asc, count, desc, eq, getTableColumns, sql } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/dal";
import { db, hasDb, schema } from "@/lib/db";

// Lecturas del panel para el portal de clientes. Verifican la sesión de admin y no se cachean.

async function guard() {
  await requireAdmin();
  if (!hasDb) throw new Error("El panel necesita DATABASE_URL.");
  return db();
}

const valido = (id: number) => Number.isInteger(id) && id > 0;

// El hash de la contraseña nunca sale de la base de datos: el panel solo sabe si ya la creó.
const { passwordHash, ...columnasCliente } = getTableColumns(schema.clientes);
const cuentaActiva = sql<boolean>`${passwordHash} <> ''`;

export async function listarClientes() {
  const d = await guard();
  return d
    .select({
      id: schema.clientes.id,
      nombre: schema.clientes.nombre,
      email: schema.clientes.email,
      empresa: schema.clientes.empresa,
      activo: schema.clientes.activo,
      cuentaActiva,
      obras: count(schema.obras.id),
    })
    .from(schema.clientes)
    .leftJoin(schema.obras, eq(schema.obras.clienteId, schema.clientes.id))
    .groupBy(schema.clientes.id)
    .orderBy(desc(schema.clientes.creado));
}

export async function obtenerCliente(id: number) {
  const d = await guard();
  if (!valido(id)) return null;
  const [cliente] = await d
    .select({ ...columnasCliente, cuentaActiva })
    .from(schema.clientes)
    .where(eq(schema.clientes.id, id))
    .limit(1);
  if (!cliente) return null;
  const obras = await d.select().from(schema.obras).where(eq(schema.obras.clienteId, id)).orderBy(desc(schema.obras.creado));
  return { cliente, obras };
}

/** Obra con todo lo necesario para gestionarla. */
export async function obtenerObra(id: number) {
  const d = await guard();
  if (!valido(id)) return null;
  const [fila] = await d
    .select({ obra: schema.obras, cliente: { id: schema.clientes.id, nombre: schema.clientes.nombre, email: schema.clientes.email } })
    .from(schema.obras)
    .innerJoin(schema.clientes, eq(schema.obras.clienteId, schema.clientes.id))
    .where(eq(schema.obras.id, id))
    .limit(1);
  if (!fila) return null;
  const [etapas, entregables, pagos, solicitudes] = await Promise.all([
    d.select().from(schema.etapas).where(eq(schema.etapas.obraId, id)).orderBy(asc(schema.etapas.orden), asc(schema.etapas.id)),
    d.select().from(schema.entregables).where(eq(schema.entregables.obraId, id)).orderBy(desc(schema.entregables.creado)),
    d.select().from(schema.pagos).where(eq(schema.pagos.obraId, id)).orderBy(asc(schema.pagos.id)),
    d.select().from(schema.solicitudes).where(eq(schema.solicitudes.obraId, id)).orderBy(desc(schema.solicitudes.numero)),
  ]);
  return { ...fila, etapas, entregables, pagos, solicitudes };
}
