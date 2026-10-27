import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { AdminForm } from "@/components/admin/AdminForm";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { AdminHeader, Cargando, Checkbox, Field, Input, Panel } from "@/components/admin/fields";
import { eliminarCliente, enviarAccesoCliente, guardarCliente, guardarObra } from "@/lib/admin/portal-actions";
import { obtenerCliente } from "@/lib/admin/portal-queries";
import { fechaCorta } from "@/lib/portal/datos";

export const metadata: Metadata = { title: "Cliente" };

export default function ClientePage({ params }: PageProps<"/admin/clientes/[id]">) {
  return (
    <>
      <Link href="/admin/clientes" className="inline-flex w-fit items-center gap-2 text-[15px] text-pizarra hover:text-noche">
        <ArrowLeft size={18} strokeWidth={1.5} aria-hidden /> Clientes
      </Link>
      <Suspense fallback={<Cargando />}>
        <Detalle params={params} />
      </Suspense>
    </>
  );
}

async function Detalle({ params }: Pick<PageProps<"/admin/clientes/[id]">, "params">) {
  const { id } = await params;
  const datos = await obtenerCliente(Number(id));
  if (!datos) notFound();
  const { cliente: c, obras } = datos;

  return (
    <>
      <AdminHeader title={c.nombre} intro={[c.empresa, c.email, c.telefono].filter(Boolean).join(" · ")}>
        <DeleteButton
          action={eliminarCliente}
          id={c.id}
          label="Eliminar cliente"
          confirmText="Se borrarán el cliente, sus obras, entregables, pagos y solicitudes. ¿Seguro?"
        />
      </AdminHeader>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-start">
        <AdminForm action={guardarCliente} submitLabel="Guardar cliente">
          <input type="hidden" name="id" value={c.id} />
          <Panel className="flex flex-col gap-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Nombre">
                <Input name="nombre" defaultValue={c.nombre} required maxLength={120} />
              </Field>
              <Field label="Email">
                <Input name="email" type="email" defaultValue={c.email} required maxLength={254} />
              </Field>
              <Field label="Empresa" hint="opcional">
                <Input name="empresa" defaultValue={c.empresa} maxLength={120} />
              </Field>
              <div className="flex items-end pb-3">
                <Checkbox name="activo" label="Con acceso al portal" defaultChecked={c.activo} />
              </div>
            </div>
          </Panel>
        </AdminForm>

        <AdminForm action={enviarAccesoCliente} submitLabel={c.cuentaActiva ? "Enviar enlace de acceso" : "Enviar invitación"}>
          <input type="hidden" name="id" value={c.id} />
          <Panel className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="h3-dm">Acceso al portal</h2>
              <span
                className={`rounded-full px-2.5 py-1 font-mono text-xs tracking-[0.08em] uppercase ${c.cuentaActiva ? "bg-cielo-tinte text-cielo-profundo" : "bg-nube text-pizarra"}`}
              >
                {c.cuentaActiva ? "Cuenta activa" : "Sin contraseña"}
              </span>
            </div>
            <p className="text-[15px] leading-[1.55] text-pizarra">
              {c.cuentaActiva
                ? `Ya entra con su email y contraseña. Si lo necesita, envíale un enlace para entrar sin contraseña (vale 15 minutos).`
                : `Envía a ${c.email} una invitación para crear su contraseña (vale 15 minutos). También puede activarla registrándose en devmart.co/portal/registro con este email.`}
            </p>
          </Panel>
        </AdminForm>
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="h3-dm">Obras</h2>
        <Panel className="p-0! md:p-0!">
          {obras.length === 0 ? (
            <p className="p-8 text-[15px] text-pizarra">Este cliente aún no tiene obras.</p>
          ) : (
            <ul className="divide-y divide-borde">
              {obras.map((o) => (
                <li key={o.id}>
                  <Link href={`/admin/obras/${o.id}`} className="flex items-center gap-4 px-6 py-5 transition-colors hover:bg-nube/60 md:px-8">
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="truncate font-medium">{o.nombre}</span>
                      <span className="text-[14px] text-pizarra">
                        {o.tipo} · {o.estado}
                        {o.fechaEntregaEstimada ? ` · entrega ${fechaCorta(o.fechaEntregaEstimada)}` : ""}
                      </span>
                    </span>
                    <ChevronRight size={18} strokeWidth={1.5} className="text-pizarra" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <AdminForm action={guardarObra} submitLabel="Crear obra">
          <input type="hidden" name="clienteId" value={c.id} />
          <Panel className="flex flex-col gap-5">
            <h3 className="font-medium">Nueva obra</h3>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Nombre" hint="p. ej. Tienda en línea">
                <Input name="nombre" required maxLength={120} />
              </Field>
              <Field label="Tipo" hint="p. ej. Web corporativa">
                <Input name="tipo" required maxLength={60} />
              </Field>
              <Field label="Estado" hint="texto corto que ve el cliente">
                <Input name="estado" defaultValue="En diseño" required maxLength={40} />
              </Field>
              <Field label="Entrega estimada" hint="opcional">
                <Input name="fechaEntregaEstimada" type="date" />
              </Field>
            </div>
          </Panel>
        </AdminForm>
      </section>
    </>
  );
}
