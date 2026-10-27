import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { AdminForm } from "@/components/admin/AdminForm";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { ImagenField } from "@/components/admin/ImagenField";
import { AdminHeader, Cargando, Field, fechaHora, Input, Panel, Select, Textarea } from "@/components/admin/fields";
import { Chip, estadosPortal } from "@/components/portal/ui";
import {
  cambiarEstadoSolicitud,
  crearEntregable,
  eliminarEntregable,
  eliminarEtapa,
  eliminarObra,
  eliminarPago,
  guardarEtapa,
  guardarObra,
  guardarPago,
} from "@/lib/admin/portal-actions";
import { obtenerObra } from "@/lib/admin/portal-queries";
import { estadosEtapa, estadosPago, estadosSolicitud } from "@/lib/db/schema";
import { avanceGeneral, pesos } from "@/lib/portal/datos";

export const metadata: Metadata = { title: "Obra" };

export default function ObraPage({ params }: PageProps<"/admin/obras/[id]">) {
  return (
    <Suspense fallback={<Cargando />}>
      <Detalle params={params} />
    </Suspense>
  );
}

function Seccion({ titulo, intro, children }: { titulo: string; intro?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="h3-dm">{titulo}</h2>
        {intro && <p className="text-[15px] text-pizarra">{intro}</p>}
      </div>
      {children}
    </section>
  );
}

function Opciones({ valores }: { valores: readonly string[] }) {
  return valores.map((v) => (
    <option key={v} value={v}>
      {estadosPortal[v]?.label ?? v}
    </option>
  ));
}

async function Detalle({ params }: Pick<PageProps<"/admin/obras/[id]">, "params">) {
  const { id } = await params;
  const datos = await obtenerObra(Number(id));
  if (!datos) notFound();
  const { obra: o, cliente, etapas, entregables, pagos, solicitudes } = datos;
  const total = pagos.reduce((s, p) => s + p.monto, 0);
  const pagado = pagos.filter((p) => p.estado === "pagado").reduce((s, p) => s + p.monto, 0);

  return (
    <>
      <Link href={`/admin/clientes/${cliente.id}`} className="inline-flex w-fit items-center gap-2 text-[15px] text-pizarra hover:text-noche">
        <ArrowLeft size={18} strokeWidth={1.5} aria-hidden /> {cliente.nombre}
      </Link>
      <AdminHeader title={o.nombre} intro={`Avance ${avanceGeneral(etapas)}% · ${pesos(pagado)} de ${pesos(total)} pagado`}>
        <DeleteButton action={eliminarObra} id={o.id} label="Eliminar obra" confirmText="Se borrarán la obra, sus etapas, entregables, pagos y solicitudes. ¿Seguro?" />
      </AdminHeader>

      <AdminForm action={guardarObra} submitLabel="Guardar obra">
        <input type="hidden" name="id" value={o.id} />
        <input type="hidden" name="clienteId" value={cliente.id} />
        <Panel className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Nombre">
            <Input name="nombre" defaultValue={o.nombre} required maxLength={120} />
          </Field>
          <Field label="Tipo">
            <Input name="tipo" defaultValue={o.tipo} required maxLength={60} />
          </Field>
          <Field label="Estado" hint="lo ve el cliente">
            <Input name="estado" defaultValue={o.estado} required maxLength={40} />
          </Field>
          <Field label="Entrega estimada">
            <Input name="fechaEntregaEstimada" type="date" defaultValue={o.fechaEntregaEstimada ?? ""} />
          </Field>
        </Panel>
      </AdminForm>

      <Seccion titulo="Etapas" intro="La línea de tiempo que ve el cliente. Completada cuenta 100 %; pendiente, 0 %.">
        {etapas.map((e) => (
          <div key={e.id} className="flex flex-col gap-3 rounded-card bg-blanco p-5 md:p-6">
            <AdminForm action={guardarEtapa} submitLabel="Guardar">
              <input type="hidden" name="id" value={e.id} />
              <input type="hidden" name="obraId" value={o.id} />
              <div className="grid gap-4 sm:grid-cols-[80px_1fr_170px_110px_170px]">
                <Field label="Orden">
                  <Input name="orden" type="number" min={0} max={999} defaultValue={e.orden} />
                </Field>
                <Field label="Etapa">
                  <Input name="nombre" defaultValue={e.nombre} required maxLength={120} />
                </Field>
                <Field label="Estado">
                  <Select name="estado" defaultValue={e.estado}>
                    <Opciones valores={estadosEtapa} />
                  </Select>
                </Field>
                <Field label="%">
                  <Input name="porcentaje" type="number" min={0} max={100} defaultValue={e.porcentaje} />
                </Field>
                <Field label="Fecha">
                  <Input name="fecha" type="date" defaultValue={e.fecha ?? ""} />
                </Field>
              </div>
            </AdminForm>
            <DeleteButton action={eliminarEtapa} id={e.id} label="Quitar etapa" confirmText="¿Quitar esta etapa?" />
          </div>
        ))}
        <AdminForm action={guardarEtapa} submitLabel="Añadir etapa" resetOnSuccess>
          <input type="hidden" name="obraId" value={o.id} />
          <Panel className="grid gap-4 sm:grid-cols-[80px_1fr_170px_110px_170px]">
            <Field label="Orden">
              <Input name="orden" type="number" min={0} max={999} defaultValue={etapas.length + 1} />
            </Field>
            <Field label="Nueva etapa">
              <Input name="nombre" required maxLength={120} placeholder="p. ej. Prototipo navegable" />
            </Field>
            <Field label="Estado">
              <Select name="estado" defaultValue="pendiente">
                <Opciones valores={estadosEtapa} />
              </Select>
            </Field>
            <Field label="%">
              <Input name="porcentaje" type="number" min={0} max={100} defaultValue={0} />
            </Field>
            <Field label="Fecha">
              <Input name="fecha" type="date" />
            </Field>
          </Panel>
        </AdminForm>
      </Seccion>

      <Seccion titulo="Entregables" intro="Al publicar uno, el cliente recibe un correo para revisarlo y aprobarlo o pedir cambios.">
        {entregables.map((e) => (
          <div key={e.id} className="flex flex-col gap-4 rounded-card bg-blanco p-5 sm:flex-row sm:items-start md:p-6">
            {e.imagen && (
              <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-xl bg-nube sm:w-40">
                <Image src={e.imagen} alt="" fill sizes="160px" className="object-cover" />
              </div>
            )}
            <div className="flex flex-1 flex-col gap-2">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-medium">{e.titulo}</span>
                <span className="font-mono text-xs text-pizarra">{e.version}</span>
                <Chip estado={e.estado} />
              </div>
              <span className="font-mono text-xs text-pizarra">{fechaHora(e.creado)}</span>
              {e.url && (
                <a href={e.url} target="_blank" rel="noopener noreferrer" className="inline-flex w-fit items-center gap-1 text-[14px] text-cielo-profundo hover:text-noche">
                  {e.url} <ArrowUpRight size={14} strokeWidth={1.5} aria-hidden />
                </a>
              )}
              {e.comentarioCliente && (
                <p className="rounded-xl bg-nube px-4 py-3 text-[14px] leading-[1.55]">
                  <span className="font-semibold">Comentario del cliente:</span> {e.comentarioCliente}
                </p>
              )}
            </div>
            <DeleteButton action={eliminarEntregable} id={e.id} label="Quitar" confirmText="¿Quitar este entregable? También se borra su captura." />
          </div>
        ))}
        <AdminForm action={crearEntregable} submitLabel="Publicar entregable" resetOnSuccess>
          <input type="hidden" name="obraId" value={o.id} />
          <Panel className="flex flex-col gap-5">
            <div className="grid gap-5 sm:grid-cols-[1fr_120px]">
              <Field label="Título">
                <Input name="titulo" required maxLength={120} placeholder="p. ej. Prototipo de la tienda" />
              </Field>
              <Field label="Versión">
                <Input name="version" defaultValue="v1" required maxLength={20} />
              </Field>
            </div>
            <Field label="Enlace para revisar" hint="opcional · https://">
              <Input name="url" type="url" maxLength={500} placeholder="https://" />
            </Field>
            <ImagenField name="imagen" label="Captura (opcional)" />
          </Panel>
        </AdminForm>
      </Seccion>

      <Seccion titulo="Pagos" intro="Montos en pesos colombianos. El cliente los ve en su portal (solo lectura).">
        {pagos.map((p) => (
          <div key={p.id} className="flex flex-col gap-3 rounded-card bg-blanco p-5 md:p-6">
            <AdminForm action={guardarPago} submitLabel="Guardar">
              <input type="hidden" name="id" value={p.id} />
              <input type="hidden" name="obraId" value={o.id} />
              <div className="grid gap-4 sm:grid-cols-[1fr_170px_150px_170px]">
                <Field label="Concepto">
                  <Input name="concepto" defaultValue={p.concepto} required maxLength={120} />
                </Field>
                <Field label="Monto (COP)">
                  <Input name="monto" inputMode="numeric" defaultValue={String(p.monto)} required />
                </Field>
                <Field label="Estado">
                  <Select name="estado" defaultValue={p.estado}>
                    <Opciones valores={estadosPago} />
                  </Select>
                </Field>
                <Field label="Fecha">
                  <Input name="fechaPago" type="date" defaultValue={p.fechaPago ?? ""} />
                </Field>
              </div>
            </AdminForm>
            <DeleteButton action={eliminarPago} id={p.id} label="Quitar pago" confirmText="¿Quitar este pago?" />
          </div>
        ))}
        <AdminForm action={guardarPago} submitLabel="Registrar pago" resetOnSuccess>
          <input type="hidden" name="obraId" value={o.id} />
          <Panel className="grid gap-4 sm:grid-cols-[1fr_170px_150px_170px]">
            <Field label="Concepto">
              <Input name="concepto" required maxLength={120} placeholder="p. ej. Anticipo 50 %" />
            </Field>
            <Field label="Monto (COP)">
              <Input name="monto" inputMode="numeric" required placeholder="1.500.000" />
            </Field>
            <Field label="Estado">
              <Select name="estado" defaultValue="pendiente">
                <Opciones valores={estadosPago} />
              </Select>
            </Field>
            <Field label="Fecha">
              <Input name="fechaPago" type="date" />
            </Field>
          </Panel>
        </AdminForm>
      </Seccion>

      <Seccion titulo="Solicitudes" intro="Lo que el cliente pide desde Soporte. Escribe una respuesta para avisarle por correo; al marcar como resuelta también le notificamos.">
        {solicitudes.length === 0 ? (
          <Panel>
            <p className="text-[15px] text-pizarra">Sin solicitudes por ahora.</p>
          </Panel>
        ) : (
          solicitudes.map((s) => (
            <AdminForm key={s.id} action={cambiarEstadoSolicitud} submitLabel="Guardar">
              <input type="hidden" name="id" value={s.id} />
              <Panel className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="font-medium">
                    <span className="font-mono text-[13px] text-pizarra">#{s.numero}</span> {s.titulo}
                  </span>
                  <span className="font-mono text-xs text-pizarra">{fechaHora(s.creado)}</span>
                </div>
                <p className="text-[15px] leading-[1.55] whitespace-pre-line text-texto-cuerpo">{s.detalle}</p>
                <div className="grid gap-4 sm:grid-cols-[1fr_200px]">
                  <Field label="Respuesta al cliente" hint="opcional · se envía por correo al guardar">
                    <Textarea name="respuesta" defaultValue={s.respuesta} rows={3} maxLength={2000} placeholder="Escribe aquí tu respuesta…" />
                  </Field>
                  <div className="flex flex-col justify-end">
                    <Field label="Estado">
                      <Select name="estado" defaultValue={s.estado}>
                        <Opciones valores={estadosSolicitud} />
                      </Select>
                    </Field>
                  </div>
                </div>
              </Panel>
            </AdminForm>
          ))
        )}
      </Seccion>
    </>
  );
}
