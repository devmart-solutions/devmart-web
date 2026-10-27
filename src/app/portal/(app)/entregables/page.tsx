import type { Metadata } from "next";
import Image from "next/image";
import { Suspense } from "react";
import { ArrowUpRight } from "lucide-react";
import { CabeceraPortal, CargandoPortal, Chip, SinObra, Tarjeta } from "@/components/portal/ui";
import { contextoPortal, entregablesDe, fechaCorta } from "@/lib/portal/datos";
import { RespuestaEntregable } from "./RespuestaEntregable";

export const metadata: Metadata = { title: "Entregables" };

export default function EntregablesPage({ searchParams }: PageProps<"/portal/entregables">) {
  return (
    <Suspense fallback={<CargandoPortal />}>
      <Entregables searchParams={searchParams} />
    </Suspense>
  );
}

async function Entregables({ searchParams }: Pick<PageProps<"/portal/entregables">, "searchParams">) {
  const { obra } = await searchParams;
  const ctx = await contextoPortal(obra);
  if (!ctx.obra) {
    return (
      <>
        <CabeceraPortal titulo="Entregables" ctx={ctx} ruta="/portal/entregables" />
        <SinObra />
      </>
    );
  }
  // Lo que espera la respuesta del cliente va primero; el resto, del más reciente al más antiguo.
  const entregables = (await entregablesDe(ctx)).sort((a, b) => Number(b.estado === "por_aprobar") - Number(a.estado === "por_aprobar"));

  return (
    <>
      <CabeceraPortal titulo="Entregables" ctx={ctx} ruta="/portal/entregables" />
      <p className="-mt-2 text-[15px] leading-[1.55] text-pizarra">
        Revisa cada entrega y apruébala o cuéntanos qué cambiar. Nos llega un aviso al instante.
      </p>
      {entregables.length === 0 ? (
        <Tarjeta>
          <p className="text-[15px] text-pizarra">Todavía no hay entregables. Te avisaremos por correo cuando subamos el primero.</p>
        </Tarjeta>
      ) : (
        <ul className="flex flex-col gap-4">
          {entregables.map((e) => (
            <li key={e.id}>
              <Tarjeta className="flex flex-col gap-4 overflow-hidden p-0! md:p-0!">
                {e.imagen && (
                  <div className="relative aspect-[16/10] bg-nube">
                    <Image src={e.imagen} alt={`Vista previa de ${e.titulo}`} fill sizes="(min-width: 720px) 688px, 100vw" className="object-cover" />
                  </div>
                )}
                <div className="flex flex-col gap-4 px-5 pb-5 md:px-6 md:pb-6 [&:first-child]:pt-5 md:[&:first-child]:pt-6">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-col gap-1">
                      <h2 className="font-medium">{e.titulo}</h2>
                      <span className="font-mono text-[12px] text-pizarra">
                        {e.version} · {fechaCorta(e.creado)}
                      </span>
                    </div>
                    <Chip estado={e.estado} />
                  </div>
                  {e.url && (
                    <a href={e.url} target="_blank" rel="noopener noreferrer" className="btn-secondary w-full sm:w-fit">
                      Abrir para revisar <ArrowUpRight size={18} strokeWidth={1.5} aria-hidden />
                    </a>
                  )}
                  {e.estado === "cambios_pedidos" && e.comentarioCliente && (
                    <p className="rounded-xl bg-[#FFF4ED] px-4 py-3 text-[14px] leading-[1.55] text-[#9A3412]">
                      <span className="font-semibold">Tus comentarios:</span> {e.comentarioCliente}
                    </p>
                  )}
                  {e.estado === "por_aprobar" && <RespuestaEntregable id={e.id} />}
                </div>
              </Tarjeta>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
