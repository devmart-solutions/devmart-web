import { Quote, Star } from "lucide-react";
import { Revelar } from "../Revelar";
import { TarjetaViva } from "../TarjetaViva";
import type { OpinionPublica } from "@/lib/comunidad";

/** Tarjetas de opiniones aprobadas con la respuesta de DevMart. */
export function Opiniones({ opiniones }: { opiniones: OpinionPublica[] }) {
  if (opiniones.length === 0) {
    return (
      <p className="rounded-card border border-dashed border-borde bg-blanco p-8 text-pizarra">
        Aún no hay opiniones publicadas. Si eres cliente, sé el primero en contar tu experiencia.
      </p>
    );
  }
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" style={{ perspective: "1000px" }}>
      {opiniones.map((o, i) => (
        <Revelar key={o.id} retraso={(i % 3) * 120} className="h-full">
          <TarjetaViva className="flex h-full flex-col gap-4 rounded-card border border-borde bg-blanco p-7">
            <div className="flex items-center justify-between">
              <span className="inline-flex gap-0.5 text-cielo" aria-label={`${o.valoracion} de 5 estrellas`}>
                {Array.from({ length: 5 }, (_, k) => (
                  <Star key={k} size={18} fill={k < o.valoracion ? "currentColor" : "none"} strokeWidth={1.5} aria-hidden />
                ))}
              </span>
              <Quote size={28} strokeWidth={1.25} className="text-cielo-tinte" aria-hidden />
            </div>
            <p className="text-[16px] leading-[1.6] text-pretty text-texto-cuerpo">{o.texto}</p>
            <div className="mt-auto flex items-center gap-3 border-t border-borde pt-4">
              <span className="flex size-10 items-center justify-center rounded-full bg-noche font-display text-sm font-bold text-cielo">
                {o.autor.slice(0, 1)}
              </span>
              <span className="flex flex-col">
                <span className="font-medium">{o.autor}</span>
                <span className="text-sm text-pizarra">Cliente de DevMart</span>
              </span>
            </div>
            {o.respuesta && (
              <p className="rounded-xl bg-nube px-4 py-3 text-[14px] leading-[1.55] text-texto-cuerpo">
                <span className="label-mono mb-1 block text-[11px] text-cielo-profundo">{"// Respuesta de DevMart"}</span>
                {o.respuesta}
              </p>
            )}
          </TarjetaViva>
        </Revelar>
      ))}
    </div>
  );
}
