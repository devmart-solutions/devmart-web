import type { Metadata } from "next";
import { ProyectosLista } from "@/components/proyectos/ProyectosLista";
import { CtaFinal, Label } from "@/components/ui";
import { getProyectos } from "@/lib/data";

export const metadata: Metadata = {
  title: "Proyectos",
  description: "Casos de DevMart Solutions: tiendas en línea, apps móviles con IA y software a medida.",
};

export default async function ProyectosPage() {
  const proyectos = await getProyectos();
  const totalProduccion = proyectos.filter((p) => p.estado === "produccion").length;
  const totalPrototipos = proyectos.filter((p) => p.estado === "prototipo").length;

  return (
    <>
      <section className="container-dm pt-6 pb-8 md:pt-8 md:pb-10">
        <div className="relative overflow-hidden rounded-[22px] bg-noche px-7 py-9 text-blanco md:px-12 md:py-11">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-cielo/15 blur-3xl"
          />
          <div className="relative flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="flex flex-col gap-4">
              <Label className="text-cielo">Proyectos</Label>
              <h1 className="h1-hero max-w-[760px] text-blanco">
                Ideas que ya son <span className="text-cielo">producto.</span>
              </h1>
              <p className="max-w-[580px] text-base leading-[1.55] text-niebla text-pretty md:text-[17px]">
                Cada caso cuenta el reto, la solución y el resultado. Proyectos en producción y prototipos navegables de DevMart y clientes.
              </p>
            </div>
            <div className="flex flex-wrap gap-2.5 md:shrink-0">
              <span className="inline-flex items-center gap-2 rounded-full border border-blanco/15 bg-blanco/5 px-3.5 py-1.5 font-mono text-xs text-blanco">
                <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-cielo" />
                {totalProduccion} en producción
              </span>
              {totalPrototipos > 0 && (
                <a
                  href="#prototipos"
                  className="inline-flex items-center gap-2 rounded-full border border-blanco/15 bg-blanco/5 px-3.5 py-1.5 font-mono text-xs text-niebla transition hover:border-cielo/50 hover:text-blanco"
                >
                  {totalPrototipos} prototipos
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-borde bg-nube pt-10 pb-20 md:pt-12 md:pb-24">
        <div className="container-dm">
          <ProyectosLista proyectos={proyectos} />
        </div>
      </section>
      <CtaFinal title="¿Tu idea será el próximo caso? Hablemos." />
    </>
  );
}
