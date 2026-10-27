import Link from "next/link";
import { ArrowUp } from "lucide-react";
import { CopyEmail } from "./CopyEmail";
import { Cube } from "./Cube";
import { HoraLocal } from "./HoraLocal";
import { SocialIcon } from "./SocialIcon";
import { servicios } from "@/lib/content";
import { coordenadas, nav, redes, site, WHATSAPP_VISIBLE, whatsappHref } from "@/lib/site";

// Pie como ficha técnica: cuatro columnas numeradas separadas por líneas finas y, al final,
// el wordmark a escala de cartel cortado por el borde inferior.
const enlacesExternos = { target: "_blank", rel: "noopener noreferrer" } as const;

function Columna({ n, titulo, children, className = "" }: { n: string; titulo: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex flex-col gap-[18px] border-white/15 py-7 ${className}`}>
      <span className="label-mono text-niebla">
        {n} / {titulo}
      </span>
      {children}
    </div>
  );
}

export function Footer() {
  return (
    <footer className="overflow-hidden bg-noche text-nube">
      <div className="container-dm grid items-end gap-10 pt-16 md:pt-24 lg:grid-cols-2 lg:gap-12">
        <div className="flex flex-col gap-5">
          <span className="label-mono text-cielo">{"// Estudio de software"}</span>
          <p className="max-w-[620px] font-display text-[34px] leading-[1.04] font-bold tracking-[-0.05em] text-balance md:text-[56px] md:leading-[1.02]">
            Software a medida desde Cartagena.
          </p>
        </div>

        <div className="flex flex-col gap-4 rounded-card border border-white/15 p-[22px] md:p-7">
          <span className="label-mono text-niebla">{"// Escríbenos"}</span>
          {site.email && (
            <div className="flex items-center justify-between gap-3">
              <a
                href={`mailto:${site.email}`}
                className="min-w-0 truncate font-display text-xl font-medium tracking-[-0.04em] transition-colors hover:text-cielo md:text-[30px]"
              >
                {site.email}
              </a>
              <span className="hidden md:block">
                <CopyEmail email={site.email} />
              </span>
              <span className="md:hidden">
                <CopyEmail email={site.email} compact />
              </span>
            </div>
          )}
          <a
            href={whatsappHref()}
            {...enlacesExternos}
            data-track-whatsapp="footer-numero"
            aria-label={`Escribir a DevMart Solutions por WhatsApp al ${WHATSAPP_VISIBLE}`}
            className="w-fit font-mono text-[15px] tracking-[0.04em] text-niebla transition-colors hover:text-cielo"
          >
            {WHATSAPP_VISIBLE}
          </a>
          <a href={whatsappHref()} data-track-whatsapp="footer" {...enlacesExternos} className="btn-primary w-full">
            <SocialIcon red="whatsapp" size={20} />
            Escríbenos por WhatsApp
          </a>
        </div>
      </div>

      <div className="container-dm mt-12 md:mt-[72px]">
        <div className="grid border-t border-white/15 sm:grid-cols-2 lg:grid-cols-4">
          <Columna n="01" titulo="Sitio" className="sm:pr-7">
            <ul className="grid grid-cols-2 gap-2.5 text-[17px] sm:grid-cols-1">
              {[...nav, { href: "/contacto", label: "Contacto" }, { href: "/portal", label: "Acceso clientes" }].map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="transition-colors hover:text-cielo">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </Columna>

          <Columna n="02" titulo="Hacemos" className="border-t sm:border-t-0 sm:border-l sm:pl-7 lg:pr-7">
            <ul className="flex flex-col gap-2.5 text-[17px] text-[#C9CFD8]">
              {servicios.map((s) => (
                <li key={s.slug}>
                  <Link href={`/servicios#${s.slug}`} className="transition-colors hover:text-cielo">
                    {s.titulo}
                  </Link>
                </li>
              ))}
            </ul>
          </Columna>

          <Columna n="03" titulo="Redes" className="border-t sm:pr-7 lg:border-t-0 lg:border-l lg:pl-7">
            <ul className="grid max-w-[240px] grid-cols-3 gap-2">
              {redes.map((r) => (
                <li key={r.red}>
                  <a
                    href={r.url}
                    {...enlacesExternos}
                    aria-label={`DevMart en ${r.label}`}
                    className="flex h-14 items-center justify-center rounded-xl border border-white/15 transition-colors duration-150 hover:border-cielo hover:bg-cielo hover:text-noche md:h-16"
                  >
                    <SocialIcon red={r.red} />
                  </a>
                </li>
              ))}
              <li>
                <a
                  href={whatsappHref()}
                  {...enlacesExternos}
                  data-track-whatsapp="footer-redes"
                  aria-label="Escribir a DevMart Solutions por WhatsApp"
                  className="flex h-14 items-center justify-center rounded-xl border border-white/15 transition-colors duration-150 hover:border-cielo hover:bg-cielo hover:text-noche md:h-16"
                >
                  <SocialIcon red="whatsapp" />
                </a>
              </li>
            </ul>
          </Columna>

          <Columna n="04" titulo="Estudio" className="border-t sm:border-l sm:pl-7 lg:border-t-0">
            <div className="flex flex-col gap-2.5 text-[17px]">
              <span>{site.city}, Colombia</span>
              <span className="font-mono text-[13px] text-niebla">{coordenadas}</span>
              <span className="flex items-center gap-2 font-mono text-[13px] text-niebla">
                <span aria-hidden className="h-[7px] w-[7px] rounded-full bg-cielo" />
                <HoraLocal /> · hora local
              </span>
            </div>
          </Columna>
        </div>
      </div>

      {/* Wordmark a escala de cartel: decorativo, el nombre ya está en el texto. */}
      <div aria-hidden className="container-dm mt-6 flex items-end gap-6 md:mt-10 md:gap-9">
        <span className="translate-y-[14%] font-display text-[17vw] leading-[0.8] font-bold tracking-[-0.065em] text-[#161B25] select-none lg:text-[14.5vw] xl:text-[200px]">
          devmart
        </span>
        <Cube size={190} variant="dark" className="mb-[2vw] hidden h-auto w-[12vw] max-w-[190px] shrink-0 lg:block" />
      </div>

      <div className="relative border-t border-white/15 bg-noche">
        <div className="container-dm flex flex-col gap-3 pt-6 pb-28 font-mono text-xs text-niebla md:flex-row md:items-center md:justify-between md:pr-24 md:pb-6">
          <span>© 2026 {site.name} · {site.city}</span>
          <Link href="/privacidad" className="transition-colors hover:text-cielo">
            Privacidad y cookies · Ley 1581 de 2012
          </Link>
          <a href="#top" className="flex items-center gap-2 text-nube transition-colors hover:text-cielo">
            Volver arriba <ArrowUp size={14} strokeWidth={1.5} aria-hidden />
          </a>
        </div>
      </div>
    </footer>
  );
}
