import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight, CalendarDays, FileCheck2, LifeBuoy, Wallet } from "lucide-react";
import { BarraProgreso, CabeceraPortal, CargandoPortal, Chip, conObra, SinObra, Tarjeta } from "@/components/portal/ui";
import {
  avanceGeneral,
  contextoPortal,
  diasHasta,
  entregablesDe,
  etapasDe,
  fechaCorta,
  pagosDe,
  pesos,
  solicitudesDe,
} from "@/lib/portal/datos";

export const metadata: Metadata = { title: "Inicio" };

export default function PortalInicio({ searchParams }: PageProps<"/portal">) {
  return (
    <Suspense fallback={<CargandoPortal />}>
      <Inicio searchParams={searchParams} />
    </Suspense>
  );
}

function textoEntrega(dias: number | null, fecha: string | null) {
  if (dias === null) return { grande: "—", detalle: "Fecha de entrega por definir" };
  if (dias > 1) return { grande: `${dias} días`, detalle: `para la entrega estimada · ${fechaCorta(fecha)}` };
  if (dias === 1) return { grande: "Mañana", detalle: `entrega estimada · ${fechaCorta(fecha)}` };
  if (dias === 0) return { grande: "Hoy", detalle: "es la entrega estimada" };
  return { grande: `${-dias} días`, detalle: `desde la entrega estimada · ${fechaCorta(fecha)}` };
}

async function Inicio({ searchParams }: Pick<PageProps<"/portal">, "searchParams">) {
  const { obra: obraParam } = await searchParams;
  const ctx = await contextoPortal(obraParam);
  const saludo = `Hola, ${ctx.cliente.nombre.split(" ")[0] || "bienvenido"}`;
  if (!ctx.obra) {
    return (
      <>
        <CabeceraPortal titulo={saludo} ctx={ctx} ruta="/portal" />
        <SinObra />
      </>
    );
  }

  const [etapas, entregables, pagos, solicitudes] = await Promise.all([etapasDe(ctx), entregablesDe(ctx), pagosDe(ctx), solicitudesDe(ctx)]);
  const avance = avanceGeneral(etapas);
  const entrega = textoEntrega(diasHasta(ctx.obra.fechaEntregaEstimada), ctx.obra.fechaEntregaEstimada);
  const proxima = etapas.find((e) => e.estado === "en_curso") ?? etapas.find((e) => e.estado === "pendiente");
  const porAprobar = entregables.filter((e) => e.estado === "por_aprobar").length;
  const pendiente = pagos.filter((p) => p.estado === "pendiente").reduce((s, p) => s + p.monto, 0);
  const abiertas = solicitudes.filter((s) => s.estado !== "resuelta").length;

  return (
    <>
      <CabeceraPortal titulo={saludo} ctx={ctx} ruta="/portal" />

      {porAprobar > 0 && (
        <Link
          href={conObra("/portal/entregables", ctx)}
          className="flex items-center gap-4 rounded-[20px] bg-noche p-5 text-blanco transition-opacity hover:opacity-90"
        >
          <FileCheck2 size={24} strokeWidth={1.5} className="shrink-0 text-cielo" aria-hidden />
          <span className="flex flex-1 flex-col">
            <span className="font-medium">{porAprobar === 1 ? "Tienes 1 entrega por revisar" : `Tienes ${porAprobar} entregas por revisar`}</span>
            <span className="text-[14px] text-niebla">Apruébala o cuéntanos qué cambiar para seguir avanzando.</span>
          </span>
          <ArrowRight size={20} strokeWidth={1.5} className="shrink-0" aria-hidden />
        </Link>
      )}

      <Tarjeta className="flex flex-col gap-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-[14px] text-pizarra">{ctx.obra.tipo}</span>
            <h2 className="h3-dm">{ctx.obra.nombre}</h2>
          </div>
          <Chip>{ctx.obra.estado}</Chip>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between">
            <span className="text-[15px] font-medium">Avance general</span>
            <span className="font-display text-[28px] font-bold tracking-[-0.04em]">{avance}%</span>
          </div>
          <BarraProgreso valor={avance} etiqueta="Avance general del proyecto" />
        </div>
        <div className="grid gap-4 border-t border-borde pt-5 sm:grid-cols-2">
          <div className="flex items-start gap-3">
            <CalendarDays size={22} strokeWidth={1.5} className="mt-0.5 shrink-0 text-cielo-profundo" aria-hidden />
            <div className="flex flex-col">
              <span className="font-display text-xl font-bold tracking-[-0.04em]">{entrega.grande}</span>
              <span className="text-[14px] text-pizarra">{entrega.detalle}</span>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <ArrowRight size={22} strokeWidth={1.5} className="mt-0.5 shrink-0 text-cielo-profundo" aria-hidden />
            <div className="flex flex-col">
              <span className="text-[14px] text-pizarra">Próximo paso</span>
              <span className="font-medium">{proxima ? proxima.nombre : etapas.length ? "Todo listo" : "Lo definimos contigo"}</span>
            </div>
          </div>
        </div>
        <Link href={conObra("/portal/avance", ctx)} className="btn-secondary w-full sm:w-fit">
          Ver la línea de tiempo
        </Link>
      </Tarjeta>

      <div className="grid gap-3 sm:grid-cols-3">
        <Acceso
          href={conObra("/portal/entregables", ctx)}
          icono={<FileCheck2 size={22} strokeWidth={1.5} aria-hidden />}
          titulo="Entregables"
          valor={porAprobar > 0 ? `${porAprobar} por aprobar` : entregables.length === 1 ? "1 en total" : `${entregables.length} en total`}
          destacado={porAprobar > 0}
        />
        <Acceso
          href={conObra("/portal/pagos", ctx)}
          icono={<Wallet size={22} strokeWidth={1.5} aria-hidden />}
          titulo="Pagos"
          valor={pendiente > 0 ? `${pesos(pendiente)} pendiente` : "Al día"}
        />
        <Acceso
          href={conObra("/portal/soporte", ctx)}
          icono={<LifeBuoy size={22} strokeWidth={1.5} aria-hidden />}
          titulo="Soporte"
          valor={abiertas === 1 ? "1 abierta" : abiertas > 1 ? `${abiertas} abiertas` : "Sin solicitudes abiertas"}
        />
      </div>
    </>
  );
}

function Acceso({ href, icono, titulo, valor, destacado = false }: { href: string; icono: React.ReactNode; titulo: string; valor: string; destacado?: boolean }) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-4 rounded-[20px] border p-5 transition-colors ${
        destacado ? "border-cielo-profundo bg-cielo-tinte" : "border-borde bg-blanco hover:border-niebla"
      }`}
    >
      <span className="text-cielo-profundo">{icono}</span>
      <span className="flex min-w-0 flex-col">
        <span className="font-medium">{titulo}</span>
        <span className="truncate text-[14px] text-pizarra">{valor}</span>
      </span>
    </Link>
  );
}
