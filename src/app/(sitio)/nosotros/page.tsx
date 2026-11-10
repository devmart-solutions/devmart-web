import type { Metadata } from "next";
import Image from "next/image";
import { Code2, Layers, MousePointerClick } from "lucide-react";
import { Cube } from "@/components/Cube";
import { Identidad } from "@/components/Identidad";
import { Revelar } from "@/components/Revelar";
import { TarjetaViva } from "@/components/TarjetaViva";
import { CtaFinal, Label, Num, SectionHead } from "@/components/ui";
import { proceso } from "@/lib/content";
import { getFotoEquipo } from "@/lib/data";

export const metadata: Metadata = {
  title: "Nosotros",
  description:
    "DevMart Solutions es un estudio de desarrollo de software a medida en Cartagena de Indias, fundado por Martín Elías García Zurique.",
};

const principios = [
  {
    icon: MousePointerClick,
    titulo: "Prototipo navegable primero",
    texto:
      "Antes de programar, recorres tu producto en un prototipo que puedes probar y compartir. Así decidimos juntos con algo real en la mano.",
  },
  {
    icon: Layers,
    titulo: "Entregas por etapas",
    texto:
      "Dividimos el trabajo en etapas cortas con entregas revisables. Ves el avance desde el principio y puedes ajustar el rumbo a tiempo.",
  },
  {
    icon: Code2,
    titulo: "El código es tuyo",
    texto:
      "Al final te entregamos el código, los accesos y la documentación. No dependes de nosotros para seguir creciendo.",
  },
];

export default function NosotrosPage() {
  return (
    <>
      <section className="container-dm grid grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] items-center gap-12 pt-12 pb-16 md:pt-[72px] md:pb-24">
        <div className="flex flex-col gap-7">
          <Label>Nosotros</Label>
          <h1 className="h1-hero">Convertimos ideas en producto.</h1>
          <p className="max-w-[520px] text-lg leading-[1.55] text-pizarra text-pretty">
            DevMart Solutions es un estudio de desarrollo de software a medida en Cartagena de
            Indias. Trabajamos con personas y negocios que tienen una idea y quieren verla
            funcionando: en la web, en el móvil o donde haga falta.
          </p>
        </div>
        <div className="cube-hover relative flex min-h-[320px] items-center justify-center overflow-hidden rounded-panel bg-cielo-tinte">
          <div aria-hidden className="aurora pointer-events-none absolute inset-0" />
          <Cube size={160} className="cube-float relative h-auto w-[130px] md:w-[160px]" />
        </div>
      </section>

      <Identidad />

      {/* Fundador */}
      <section className="bg-nube py-24">
        <div className="container-dm grid gap-12 lg:grid-cols-[1fr_1.4fr]">
          <FotoFundador />
          <div className="flex flex-col justify-center gap-5">
            <Label>Fundador</Label>
            <h2 className="h2-dm">Martín Elías García Zurique</h2>
            <p className="font-mono text-sm text-pizarra">Desarrollador web · Cartagena de Indias</p>
            <p className="max-w-[600px] text-[17px] leading-[1.6] text-texto-cuerpo text-pretty">
              Fundé DevMart para acompañar a quienes tienen una idea pero no saben por dónde
              empezar a construirla. Me encargo del proyecto de principio a fin: entiendo lo que
              necesitas, lo diseño contigo en un prototipo y lo desarrollo hasta dejarlo
              funcionando.
            </p>
            <p className="max-w-[600px] text-[17px] leading-[1.6] text-texto-cuerpo text-pretty">
              Trato directo, explicaciones sin tecnicismos y decisiones tomadas con tu negocio en
              mente.
            </p>
          </div>
        </div>
      </section>

      {/* Forma de trabajo */}
      <section className="py-24">
        <div className="container-dm flex flex-col gap-12">
          <Revelar>
            <SectionHead label="Cómo trabajamos" title="Tres reglas que no negociamos." />
          </Revelar>
          <div className="grid gap-6 md:grid-cols-3" style={{ perspective: "1000px" }}>
            {principios.map(({ icon: Icon, titulo, texto }, i) => (
              <Revelar key={titulo} retraso={i * 120} className="h-full">
              <TarjetaViva className="flex h-full flex-col gap-4 rounded-card border border-borde bg-blanco p-7">
                <Icon size={28} strokeWidth={1.5} className="text-cielo-profundo" aria-hidden />
                <h3 className="h3-dm">{titulo}</h3>
                <p className="text-base leading-[1.55] text-texto-cuerpo text-pretty">{texto}</p>
              </TarjetaViva>
              </Revelar>
            ))}
          </div>

          <ol className="mt-6 grid grid-cols-[repeat(auto-fit,minmax(min(100%,200px),1fr))] gap-8 border-t border-borde pt-7">
            {proceso.map((p, i) => (
              <li key={p.titulo} className="flex flex-col gap-2">
                <Num n={i + 1} />
                <span className="h3-dm">{p.titulo}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <CtaFinal />
    </>
  );
}

async function FotoFundador() {
  const foto = await getFotoEquipo();
  if (!foto) {
    return (
      <div
        className="placeholder-rayado flex aspect-[4/5] max-w-[420px] items-center justify-center rounded-panel font-mono text-xs text-pizarra"
        role="img"
        aria-label="Foto pendiente de Martín Elías García Zurique"
      >
        foto del fundador
      </div>
    );
  }
  return (
    <div className="relative aspect-[4/5] w-full max-w-[420px] overflow-hidden rounded-panel bg-cielo-tinte">
      <Image src={foto.url} alt={foto.alt} fill sizes="(min-width: 1024px) 420px, 100vw" className="object-cover" />
    </div>
  );
}
