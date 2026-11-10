import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Star } from "lucide-react";
import { AdminForm } from "@/components/admin/AdminForm";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { AdminHeader, Cargando, Field, Panel, Select, Textarea, fechaHora } from "@/components/admin/fields";
import { eliminarOpinion, moderarOpinion } from "@/lib/admin/comunidad-actions";
import { listarOpinionesAdmin } from "@/lib/admin/queries";
import { nombresRed } from "@/lib/comunidad";

export const metadata: Metadata = { title: "Opiniones" };

const etiquetas = { pendiente: "Pendiente", aprobada: "Publicada", rechazada: "Rechazada" } as const;
const tonos = {
  pendiente: "bg-[#FFF4ED] text-[#9A3412]",
  aprobada: "bg-cielo-tinte text-cielo-profundo",
  rechazada: "bg-nube text-pizarra",
} as const;

export default function OpinionesAdminPage() {
  return (
    <>
      <AdminHeader
        title="Opiniones"
        intro="Lo que los clientes escriben en /comunidad. Nada se publica hasta que lo apruebes; tu respuesta sale debajo con la etiqueta DevMart."
      />
      <Suspense fallback={<Cargando />}>
        <Lista />
      </Suspense>
    </>
  );
}

async function Lista() {
  const opiniones = await listarOpinionesAdmin();
  if (opiniones.length === 0) {
    return <Panel className="text-pizarra">Todavía no hay opiniones. Los clientes las envían desde /comunidad con su sesión del portal.</Panel>;
  }
  return opiniones.map((o) => (
    <Panel key={o.id} className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 text-[14px] text-pizarra">
          <Link href={`/admin/clientes/${o.clienteId}`} className="font-medium text-noche hover:underline">
            {o.cliente}
          </Link>
          {o.empresa && <span>{o.empresa}</span>}
          <span>{fechaHora(o.creado)}</span>
          <span className="inline-flex text-cielo-profundo" aria-label={`${o.valoracion} de 5`}>
            {Array.from({ length: o.valoracion }, (_, k) => (
              <Star key={k} size={14} fill="currentColor" aria-hidden />
            ))}
          </span>
        </div>
        <span className={`rounded-full px-3 py-1 text-[13px] font-medium ${tonos[o.estado]}`}>{etiquetas[o.estado]}</span>
      </div>
      {o.red && (
        <p className="text-[14px] text-pizarra">
          Sobre la publicación de {nombresRed[o.red]}: «{o.publicacion?.slice(0, 80)}»
        </p>
      )}
      <p className="text-[16px] leading-[1.6] whitespace-pre-line">{o.texto}</p>
      <AdminForm action={moderarOpinion}>
        <input type="hidden" name="id" value={o.id} />
        <div className="grid gap-5 sm:grid-cols-[200px_1fr]">
          <Field label="Estado">
            <Select name="estado" defaultValue={o.estado === "pendiente" ? "aprobada" : o.estado}>
              <option value="aprobada">Publicar</option>
              <option value="pendiente">Dejar pendiente</option>
              <option value="rechazada">Rechazar</option>
            </Select>
          </Field>
          <Field label="Respuesta pública (opcional)">
            <Textarea name="respuesta" rows={2} defaultValue={o.respuesta} maxLength={1200} placeholder="¡Gracias por confiar en nosotros!" />
          </Field>
        </div>
      </AdminForm>
      <div className="flex justify-end border-t border-borde pt-4">
        <DeleteButton action={eliminarOpinion} id={o.id} label="Eliminar opinión" />
      </div>
    </Panel>
  ));
}
