import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AdminForm } from "@/components/admin/AdminForm";
import { AdminHeader, Cargando, Checkbox, Field, Input, Panel } from "@/components/admin/fields";
import { guardarCliente } from "@/lib/admin/portal-actions";
import { listarClientes } from "@/lib/admin/portal-queries";

export const metadata: Metadata = { title: "Clientes" };

export default function ClientesPage() {
  return (
    <>
      <AdminHeader
        title="Clientes"
        intro="Quienes entran al portal en devmart.co/portal para ver el avance de su proyecto. Al crearlos, envíales la invitación para que creen su contraseña; también pueden registrarse ellos mismos con su email."
      />
      <Suspense fallback={<Cargando />}>
        <Lista />
      </Suspense>
      <AdminForm action={guardarCliente} submitLabel="Crear cliente">
        <Panel className="flex flex-col gap-5">
          <h2 className="h3-dm">Nuevo cliente</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Nombre">
              <Input name="nombre" required maxLength={120} />
            </Field>
            <Field label="Email" hint="con este entra al portal">
              <Input name="email" type="email" required maxLength={254} />
            </Field>
            <Field label="Empresa" hint="opcional">
              <Input name="empresa" maxLength={120} />
            </Field>
            <div className="flex items-end pb-3">
              <Checkbox name="activo" label="Con acceso al portal" defaultChecked />
            </div>
          </div>
        </Panel>
      </AdminForm>
    </>
  );
}

async function Lista() {
  const clientes = await listarClientes();
  return (
    <Panel className="p-0! md:p-0!">
      {clientes.length === 0 ? (
        <p className="p-8 text-[15px] text-pizarra">Aún no hay clientes. Crea el primero abajo.</p>
      ) : (
        <ul className="divide-y divide-borde">
          {clientes.map((c) => (
            <li key={c.id}>
              <Link
                href={`/admin/clientes/${c.id}`}
                className="grid gap-1 px-6 py-5 transition-colors hover:bg-nube/60 md:grid-cols-[1fr_auto] md:items-center md:gap-6 md:px-8"
              >
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="truncate font-medium">
                    {c.nombre}
                    {c.empresa && <span className="font-normal text-pizarra"> · {c.empresa}</span>}
                  </span>
                  <span className="truncate text-[14px] text-pizarra">{c.email}</span>
                </span>
                <span className="flex items-center gap-3 font-mono text-xs text-pizarra">
                  {c.obras} {c.obras === 1 ? "obra" : "obras"}
                  <span
                    className={`rounded-full px-2.5 py-1 tracking-[0.08em] uppercase ${c.activo ? "bg-cielo-tinte text-cielo-profundo" : "bg-nube text-pizarra"}`}
                  >
                    {c.activo ? "Activo" : "Inactivo"}
                  </span>
                  {c.activo && !c.cuentaActiva && (
                    <span className="rounded-full bg-[#FFF4ED] px-2.5 py-1 tracking-[0.08em] text-[#9A3412] uppercase">Sin contraseña</span>
                  )}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
