import { ArrowUpRight } from "lucide-react";
import { Revelar } from "./Revelar";
import { SocialIcon } from "./SocialIcon";
import { VideoLigero } from "./VideoLigero";
import { SectionHead } from "./ui";
import { YOUTUBE_CANAL } from "@/lib/site";
import { getVideos } from "@/lib/youtube";

const fechaCorta = (iso: string) =>
  new Date(iso).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric", timeZone: "America/Bogota" });

/** Último video del canal en grande y los siguientes en miniatura. No se muestra si el feed no responde. */
export async function VideosYoutube() {
  const videos = await getVideos();
  if (videos.length === 0) return null;
  const [destacado, ...resto] = videos;

  return (
    <section className="py-24">
      <div className="container-dm flex flex-col gap-12">
        <Revelar className="flex flex-wrap items-end justify-between gap-6">
          <SectionHead
            label="YouTube"
            title="Tecnología explicada sin tecnicismos."
            intro="En nuestro canal te contamos cómo funciona lo que usas todos los días y cómo lo construimos."
          />
          <a href={YOUTUBE_CANAL.url} target="_blank" rel="noopener noreferrer" className="btn-secondary">
            <SocialIcon red="youtube" size={18} />
            Suscribirme
          </a>
        </Revelar>

        <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
          <Revelar className="flex flex-col gap-4">
            <VideoLigero id={destacado.id} titulo={destacado.titulo} />
            <span className="font-mono text-xs text-pizarra">{fechaCorta(destacado.fecha)}</span>
            <h3 className="h3-dm text-pretty">{destacado.titulo}</h3>
            {destacado.descripcion && (
              <p className="max-w-[640px] text-base leading-[1.55] text-texto-cuerpo text-pretty">{destacado.descripcion}</p>
            )}
          </Revelar>

          <ul className="flex flex-col gap-4">
            {resto.slice(0, 3).map((v, i) => (
              <Revelar como="li" key={v.id} retraso={i * 100}>
                <a
                  href={v.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group grid grid-cols-[140px_1fr] gap-4 rounded-panel p-2 transition-colors hover:bg-nube"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={v.miniatura} alt="" loading="lazy" className="aspect-video w-full rounded-lg object-cover" />
                  <span className="flex flex-col gap-1.5">
                    <span className="font-mono text-xs text-pizarra">{fechaCorta(v.fecha)}</span>
                    <span className="font-medium leading-snug text-pretty group-hover:text-cielo-profundo">{v.titulo}</span>
                  </span>
                </a>
              </Revelar>
            ))}
            {resto.length === 0 && (
              <Revelar como="li" className="flex h-full flex-col justify-center gap-4 rounded-card border border-dashed border-borde p-8">
                <span className="label-mono text-cielo-profundo">{"// Próximamente"}</span>
                <p className="text-base leading-[1.55] text-texto-cuerpo text-pretty">
                  Publicamos videos nuevos cada semana. Suscríbete y te avisamos del siguiente.
                </p>
                <a href={YOUTUBE_CANAL.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-medium text-cielo-profundo hover:underline">
                  Ver el canal <ArrowUpRight size={16} aria-hidden />
                </a>
              </Revelar>
            )}
          </ul>
        </div>
      </div>
    </section>
  );
}
