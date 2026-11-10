import { Flag, Target, Telescope } from "lucide-react";
import { Revelar } from "./Revelar";
import { TarjetaViva } from "./TarjetaViva";
import { SectionHead } from "./ui";
import { identidad } from "@/lib/content";

const iconos = { mision: Target, vision: Telescope, objetivo: Flag } as const;

/** Misión, visión y objetivo de DevMart en tarjetas que reaccionan al cursor. */
export function Identidad({ id = "identidad" }: { id?: string }) {
  return (
    <section id={id} className="relative overflow-hidden bg-cielo-tinte py-24">
      <div aria-hidden className="aurora pointer-events-none absolute inset-0" />
      <div className="container-dm relative flex flex-col gap-12">
        <Revelar>
          <SectionHead
            label="Identidad"
            title="Lo que nos mueve."
            intro="Tres ideas guían cada proyecto que hacemos, desde la primera conversación hasta la entrega."
          />
        </Revelar>
        <div className="grid gap-6 md:grid-cols-3" style={{ perspective: "1000px" }}>
          {identidad.map((item, i) => {
            const Icon = iconos[item.clave];
            return (
              <Revelar key={item.clave} retraso={i * 120} className="h-full">
                <TarjetaViva className="flex h-full flex-col gap-5 rounded-card border border-borde bg-blanco p-8">
                  <div className="flex items-center justify-between">
                    <span className="icono-pulso flex size-14 items-center justify-center rounded-2xl bg-cielo text-noche">
                      <Icon size={26} strokeWidth={1.75} aria-hidden />
                    </span>
                    <span className="font-display text-[44px] leading-none font-bold tracking-[-0.05em] text-cielo-tinte [-webkit-text-stroke:1.5px_var(--color-cielo)]">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <span className="label-mono text-cielo-profundo">{`// ${item.titulo}`}</span>
                  <h3 className="h3-dm text-pretty">{item.frase}</h3>
                  <p className="text-base leading-[1.6] text-texto-cuerpo text-pretty">{item.texto}</p>
                </TarjetaViva>
              </Revelar>
            );
          })}
        </div>
      </div>
    </section>
  );
}
