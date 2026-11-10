import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { eq } from "drizzle-orm";
import { LogIn } from "lucide-react";
import { Muro } from "@/components/comunidad/Muro";
import { OpinionForm } from "@/components/comunidad/OpinionForm";
import { Opiniones } from "@/components/comunidad/Opiniones";
import { Revelar } from "@/components/Revelar";
import { SocialIcon } from "@/components/SocialIcon";
import { CtaFinal, PageHero, SectionHead } from "@/components/ui";
import { leerSesionCliente } from "@/lib/auth/cliente";
import { getMuro, getOpcionesPublicacion, getOpiniones } from "@/lib/comunidad-datos";
import { db, schema } from "@/lib/db";
import { redes } from "@/lib/site";

export const metadata: Metadata = {
  title: "Comunidad",
  description:
    "Lo último de DevMart Solutions en YouTube, Instagram, TikTok y el blog, y lo que dicen nuestros clientes de trabajar con nosotros.",
};

export default async function ComunidadPage() {
  const [items, opiniones] = await Promise.all([getMuro(), getOpiniones()]);
  return (
    <>
      <PageHero
        label="Comunidad"
        title={
          <>
            Lo que publicamos y lo que <span className="resaltado">dicen de nosotros.</span>
          </>
        }
        intro="Videos, publicaciones y artículos de todas nuestras redes en un solo lugar, junto con las experiencias de nuestros clientes."
      >
        <ul className="flex flex-wrap gap-2">
          {redes.map((r, i) => (
            <Revelar como="li" key={r.red} retraso={i * 60}>
              <a
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`DevMart en ${r.label}`}
                className="flex size-12 items-center justify-center rounded-xl border border-borde transition-all duration-200 hover:-translate-y-1 hover:border-cielo hover:bg-cielo"
              >
                <SocialIcon red={r.red} />
              </a>
            </Revelar>
          ))}
        </ul>
      </PageHero>

      <section className="pb-24">
        <div className="container-dm">
          <Muro items={items} opiniones={opiniones} />
        </div>
      </section>

      <section id="opiniones" className="relative overflow-hidden bg-cielo-tinte py-24">
        <div aria-hidden className="aurora pointer-events-none absolute inset-0" />
        <div className="container-dm relative flex flex-col gap-12">
          <Revelar>
            <SectionHead label="Opiniones" title="Experiencias de nuestros clientes." />
          </Revelar>
          <Opiniones opiniones={opiniones.filter((o) => !o.publicacionId)} />

          <Revelar className="grid gap-10 rounded-card border border-borde bg-blanco p-8 md:p-10 lg:grid-cols-[1fr_1.3fr]">
            <div className="flex flex-col gap-3.5">
              <span className="label-mono text-cielo-profundo">{"// Tu turno"}</span>
              <h2 className="h2-dm">Cuéntanos tu experiencia.</h2>
              <p className="text-[17px] leading-[1.55] text-pizarra text-pretty">
                Si trabajaste con nosotros, tu opinión ayuda a otros negocios a decidir. También puedes comentar una de
                nuestras publicaciones.
              </p>
            </div>
            <Suspense fallback={<div className="h-48 animate-pulse rounded-panel bg-nube" />}>
              <Participar />
            </Suspense>
          </Revelar>
        </div>
      </section>

      <CtaFinal />
    </>
  );
}

/** Formulario para clientes con sesión; a los demás, el acceso al portal. */
async function Participar() {
  const clienteId = await leerSesionCliente();
  if (!clienteId) {
    return (
      <div className="flex flex-col items-start justify-center gap-4">
        <p className="text-[17px] leading-[1.55] text-texto-cuerpo">
          Las opiniones son solo de clientes, para que todo lo que leas aquí sea real. Entra al portal y vuelve a esta
          página.
        </p>
        <Link href="/portal/ingreso" className="btn-primary">
          <LogIn size={18} aria-hidden /> Entrar al portal
        </Link>
      </div>
    );
  }
  const [[cliente], publicaciones] = await Promise.all([
    db().select({ nombre: schema.clientes.nombre }).from(schema.clientes).where(eq(schema.clientes.id, clienteId)).limit(1),
    getOpcionesPublicacion(),
  ]);
  return <OpinionForm nombre={cliente?.nombre ?? ""} publicaciones={publicaciones} />;
}
