import type { Metadata } from "next";
import { Suspense } from "react";
import { MessageCircle } from "lucide-react";
import { CabeceraPortal, CargandoPortal, Chip, SinObra, Tarjeta } from "@/components/portal/ui";
import { contextoPortal, fechaCorta, pagosDe, pesos } from "@/lib/portal/datos";
import { whatsappHref } from "@/lib/site";

export const metadata: Metadata = { title: "Pagos" };

export default function PagosPage({ searchParams }: PageProps<"/portal/pagos">) {
  return (
    <Suspense fallback={<CargandoPortal />}>
      <Pagos searchParams={searchParams} />
    </Suspense>
  );
}

async function Pagos({ searchParams }: Pick<PageProps<"/portal/pagos">, "searchParams">) {
  const { obra } = await searchParams;
  const ctx = await contextoPortal(obra);
  if (!ctx.obra) {
    return (
      <>
        <CabeceraPortal titulo="Pagos" ctx={ctx} ruta="/portal/pagos" />
        <SinObra />
      </>
    );
  }
  const pagos = await pagosDe(ctx);
  const proyecto = ctx.obra.nombre;
  const total = pagos.reduce((s, p) => s + p.monto, 0);
  const pagado = pagos.filter((p) => p.estado === "pagado").reduce((s, p) => s + p.monto, 0);

  return (
    <>
      <CabeceraPortal titulo="Pagos" ctx={ctx} ruta="/portal/pagos" />
      <div className="grid grid-cols-2 gap-3">
        <Tarjeta className="flex flex-col gap-1">
          <span className="text-[14px] text-pizarra">Pagado</span>
          <span className="font-display text-lg font-bold tracking-[-0.04em] break-words sm:text-xl md:text-2xl">{pesos(pagado)}</span>
        </Tarjeta>
        <Tarjeta className="flex flex-col gap-1">
          <span className="text-[14px] text-pizarra">Pendiente</span>
          <span className="font-display text-lg font-bold tracking-[-0.04em] break-words sm:text-xl md:text-2xl">{pesos(total - pagado)}</span>
        </Tarjeta>
      </div>

      {pagos.length === 0 ? (
        <Tarjeta>
          <p className="text-[15px] text-pizarra">Aún no hay pagos registrados para este proyecto.</p>
        </Tarjeta>
      ) : (
        <Tarjeta className="p-0! md:p-0!">
          <ul className="divide-y divide-borde">
            {pagos.map((p) => (
              <li key={p.id} className="flex flex-col gap-3 px-5 py-4 md:px-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col gap-1">
                    <span className="font-medium">{p.concepto}</span>
                    <span className="text-[13px] text-pizarra">
                      {p.estado === "pagado"
                        ? p.fechaPago
                          ? `Pagado el ${fechaCorta(p.fechaPago)}`
                          : "Pagado"
                        : p.fechaPago
                          ? `Fecha prevista: ${fechaCorta(p.fechaPago)}`
                          : "Por pagar"}
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className="font-display text-lg font-bold tracking-[-0.03em]">{pesos(p.monto)}</span>
                    <Chip estado={p.estado} />
                  </div>
                </div>
                {p.estado === "pendiente" && (
                  // Mientras llega el pago en línea (Wompi), el pago se coordina por WhatsApp.
                  <a
                    href={whatsappHref(`Hola DevMart, quiero coordinar el pago «${p.concepto}» (${pesos(p.monto)}) del proyecto ${proyecto}.`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary w-full sm:w-fit"
                  >
                    <MessageCircle size={18} strokeWidth={1.5} aria-hidden /> Coordinar este pago
                  </a>
                )}
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between border-t border-borde px-5 py-4 md:px-6">
            <span className="text-[15px] font-medium">Total del proyecto</span>
            <span className="font-display text-lg font-bold tracking-[-0.03em]">{pesos(total)}</span>
          </div>
        </Tarjeta>
      )}
      <p className="text-[13px] leading-[1.55] text-pizarra">
        ¿Dudas con un pago? Escríbenos desde Soporte y lo revisamos contigo.
      </p>
    </>
  );
}
