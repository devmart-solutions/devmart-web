import type { Metadata } from "next";
import { Suspense } from "react";
import { CabeceraPortal, CargandoPortal, Chip, SinObra, Tarjeta } from "@/components/portal/ui";
import { contextoPortal, fechaCorta, solicitudesDe } from "@/lib/portal/datos";
import { whatsappHref } from "@/lib/site";
import { NuevaSolicitud } from "./NuevaSolicitud";

export const metadata: Metadata = { title: "Soporte" };

export default function SoportePage({ searchParams }: PageProps<"/portal/soporte">) {
  return (
    <Suspense fallback={<CargandoPortal />}>
      <Soporte searchParams={searchParams} />
    </Suspense>
  );
}

async function Soporte({ searchParams }: Pick<PageProps<"/portal/soporte">, "searchParams">) {
  const { obra } = await searchParams;
  const ctx = await contextoPortal(obra);
  if (!ctx.obra) {
    return (
      <>
        <CabeceraPortal titulo="Soporte" ctx={ctx} ruta="/portal/soporte" />
        <SinObra />
      </>
    );
  }
  const solicitudes = await solicitudesDe(ctx);

  return (
    <>
      <CabeceraPortal titulo="Soporte" ctx={ctx} ruta="/portal/soporte" />
      <Tarjeta>
        <NuevaSolicitud obraId={ctx.obra.id} />
      </Tarjeta>
      <p className="-mt-2 text-[14px] leading-[1.55] text-pizarra">
        ¿Es urgente?{" "}
        <a
          href={whatsappHref(`Hola DevMart, tengo una solicitud urgente sobre el proyecto ${ctx.obra.nombre}.`)}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-cielo-profundo underline-offset-4 hover:underline"
        >
          Escríbenos por WhatsApp
        </a>
        .
      </p>

      <h2 className="h3-dm">Tus solicitudes</h2>
      {solicitudes.length === 0 ? (
        <Tarjeta>
          <p className="text-[15px] text-pizarra">Aún no has abierto solicitudes.</p>
        </Tarjeta>
      ) : (
        <ul className="flex flex-col gap-3">
          {solicitudes.map((s) => (
            <li key={s.id}>
              <Tarjeta className="flex flex-col gap-2">
                <div className="flex items-start justify-between gap-3">
                  <span className="font-medium">
                    <span className="font-mono text-[13px] text-pizarra">#{s.numero}</span> {s.titulo}
                  </span>
                  <Chip estado={s.estado} />
                </div>
                <p className="text-[14px] leading-[1.55] whitespace-pre-line text-pizarra">{s.detalle}</p>
                {s.respuesta && (
                  <div className="rounded-xl bg-cielo-tinte px-4 py-3 flex flex-col gap-1">
                    <span className="font-semibold text-[13px] text-cielo-profundo">Respuesta de DevMart</span>
                    <p className="text-[14px] leading-[1.55] whitespace-pre-line text-noche">{s.respuesta}</p>
                  </div>
                )}
                <span className="font-mono text-[12px] text-pizarra">{fechaCorta(s.creado)}</span>
              </Tarjeta>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
