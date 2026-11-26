import type { Metadata } from "next";
import { ProyectosLista } from "@/components/proyectos/ProyectosLista";
import { CtaFinal, PageHero } from "@/components/ui";
import { getProyectos } from "@/lib/data";

export const metadata: Metadata = {
  title: "Proyectos",
  description: "Casos de DevMart Solutions: tiendas en línea, apps móviles con IA y software a medida.",
};

export default async function ProyectosPage() {
  const proyectos = await getProyectos();

  return (
    <>
      <PageHero
        label="Proyectos"
        title="Ideas que ya son producto."
        intro="Cada caso cuenta el reto, la solución y el resultado. Proyectos en producción y prototipos navegables de DevMart y clientes."
      />
      <section className="bg-nube py-16 md:py-24">
        <div className="container-dm">
          <ProyectosLista proyectos={proyectos} />
        </div>
      </section>
      <CtaFinal title="¿Tu idea será el próximo caso? Hablemos." />
    </>
  );
}
