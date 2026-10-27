import Link from "next/link";
import type { ReactNode } from "react";
import type { ContextoPortal } from "@/lib/portal/datos";
import { whatsappHref } from "@/lib/site";

// Piezas compartidas de las pantallas del portal.

type Tono = "neutro" | "activo" | "ok" | "aviso";

const tonos: Record<Tono, string> = {
  neutro: "bg-nube text-pizarra",
  activo: "bg-cielo-tinte text-cielo-profundo",
  ok: "bg-[#E7F8EE] text-[#166534]",
  aviso: "bg-[#FFF4ED] text-[#9A3412]",
};

export const estadosPortal: Record<string, { label: string; tono: Tono }> = {
  pendiente: { label: "Pendiente", tono: "neutro" },
  en_curso: { label: "En curso", tono: "activo" },
  completada: { label: "Completada", tono: "ok" },
  por_aprobar: { label: "Por aprobar", tono: "activo" },
  aprobado: { label: "Aprobado", tono: "ok" },
  cambios_pedidos: { label: "Cambios pedidos", tono: "aviso" },
  pagado: { label: "Pagado", tono: "ok" },
  abierta: { label: "Abierta", tono: "activo" },
  en_revision: { label: "En revisión", tono: "aviso" },
  resuelta: { label: "Resuelta", tono: "ok" },
};

export function Chip({ estado, children }: { estado?: string; children?: ReactNode }) {
  const e = estado ? estadosPortal[estado] : undefined;
  return (
    <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 font-mono text-[11px] tracking-[0.06em] uppercase ${tonos[e?.tono ?? "neutro"]}`}>
      {children ?? e?.label ?? estado}
    </span>
  );
}

export function Tarjeta({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-[20px] border border-borde bg-blanco p-5 md:p-6 ${className}`}>{children}</section>;
}

export function BarraProgreso({ valor, etiqueta }: { valor: number; etiqueta: string }) {
  const v = Math.min(100, Math.max(0, Math.round(valor)));
  return (
    <div
      role="progressbar"
      aria-label={etiqueta}
      aria-valuenow={v}
      aria-valuemin={0}
      aria-valuemax={100}
      className="h-2.5 w-full overflow-hidden rounded-full bg-nube"
    >
      <div className="h-full rounded-full bg-cielo-profundo transition-[width] duration-500" style={{ width: `${v}%` }} />
    </div>
  );
}

/** Enlace dentro del portal que conserva la obra elegida cuando el cliente tiene varias. */
export function conObra(ruta: string, ctx: ContextoPortal) {
  return ctx.obra && ctx.obras.length > 1 ? `${ruta}?obra=${ctx.obra.id}` : ruta;
}

/** Título de pantalla con la obra activa y, si hay varias, el selector. */
export function CabeceraPortal({ titulo, ctx, ruta }: { titulo: string; ctx: ContextoPortal; ruta: string }) {
  return (
    <div className="flex flex-col gap-3">
      {ctx.obra && <span className="label-mono text-cielo-profundo">{`// ${ctx.obra.nombre}`}</span>}
      <h1 className="font-display text-[28px] leading-[1.08] font-bold tracking-[-0.045em] md:text-[34px]">{titulo}</h1>
      {ctx.obras.length > 1 && (
        <nav aria-label="Elegir proyecto" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          {ctx.obras.map((o) => (
            <Link
              key={o.id}
              href={`${ruta}?obra=${o.id}`}
              aria-current={o.id === ctx.obra?.id ? "page" : undefined}
              className="shrink-0 rounded-full border border-borde bg-blanco px-3.5 py-2 text-[14px] text-pizarra aria-[current=page]:border-noche aria-[current=page]:bg-noche aria-[current=page]:text-blanco"
            >
              {o.nombre}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}

/** Cuenta sin obras (p. ej. recién registrada): explica qué verá y cómo empezar. */
export function SinObra() {
  return (
    <Tarjeta className="flex flex-col items-center gap-4 text-center">
      <h2 className="h3-dm">Aún no hay un proyecto activo</h2>
      <p className="max-w-[460px] text-[15px] leading-[1.55] text-pizarra">
        Cuando empecemos a trabajar juntos, aquí verás el avance, los entregables y los pagos. ¿Tienes una idea? Cuéntanosla y te
        escribimos.
      </p>
      <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
        <a
          href={whatsappHref("Hola DevMart, acabo de crear mi cuenta en el portal y quiero contarles mi idea.")}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary"
        >
          Escribir por WhatsApp
        </a>
        <Link href="/contacto" className="btn-secondary">
          Contar mi idea
        </Link>
      </div>
    </Tarjeta>
  );
}

export function CargandoPortal() {
  return (
    <div className="flex flex-col gap-4" aria-label="Cargando">
      <div className="h-8 w-2/3 animate-pulse rounded-xl bg-blanco" />
      <div className="h-40 animate-pulse rounded-[20px] bg-blanco" />
      <div className="h-28 animate-pulse rounded-[20px] bg-blanco" />
    </div>
  );
}
