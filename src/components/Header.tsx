"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowUpRight, CircleUserRound, Menu, X } from "lucide-react";
import { HoraLocal } from "./HoraLocal";
import { Logo } from "./Logo";
import { nav, site } from "@/lib/site";

// Cabecera flotante: una cápsula separada de los bordes. Cada enlace lleva su índice en mono y la
// sección actual se marca con una cara del cubo (un rombo) en lugar de un subrayado.
export function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [lastPath, setLastPath] = useState(pathname);

  // Cerrar el menú al cambiar de página.
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header id="top" className="sticky top-0 z-40 px-4 pt-3 md:px-8 md:pt-4">
      <div
        className={`mx-auto flex h-14 max-w-[1344px] items-center justify-between gap-6 rounded-full border bg-blanco pr-1.5 pl-5 transition-[box-shadow,border-color] duration-200 md:h-16 md:pr-2 md:pl-6 ${
          scrolled ? "border-transparent shadow-[0_12px_40px_rgba(11,13,18,0.10)]" : "border-borde"
        }`}
      >
        <div className="flex items-center gap-[18px]">
          <Logo cubeSize={24} wordmarkSize={18} gap={10} />
          <span aria-hidden className="hidden h-6 w-px bg-borde xl:block" />
          <span className="hidden items-center gap-2 font-mono text-[11px] tracking-[0.1em] text-pizarra uppercase xl:flex">
            <span aria-hidden className="h-[7px] w-[7px] rounded-full bg-cielo-profundo shadow-[0_0_0_4px_var(--color-cielo-tinte)]" />
            <span className="sr-only">Hora en {site.city}:</span>
            CTG · <HoraLocal />
          </span>
        </div>

        <nav aria-label="Principal" className="hidden items-center gap-[30px] lg:flex">
          {nav.map((item, i) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className="group relative flex items-start gap-1 text-[15px] text-texto-cuerpo transition-colors hover:text-cielo-profundo aria-[current=page]:text-cielo-profundo"
            >
              <span className="font-mono text-[10px] leading-none text-niebla transition-colors group-hover:text-cielo-profundo group-aria-[current=page]:text-cielo-profundo">
                {String(i + 1).padStart(2, "0")}
              </span>
              {item.label}
              <span
                aria-hidden
                className="absolute -bottom-3 left-1/2 h-2 w-2 -translate-x-1/2 scale-y-[0.6] rotate-45 bg-cielo-profundo opacity-0 transition-opacity group-aria-[current=page]:opacity-100"
              />
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {/* Acceso de clientes al portal: icono en móvil, con texto desde md. */}
          <Link
            href="/portal"
            aria-label="Acceso para clientes"
            className="inline-flex h-11 min-w-11 items-center justify-center gap-2 rounded-full text-[15px] font-medium text-noche transition-colors hover:text-cielo-profundo md:h-12 md:border md:border-borde md:px-4 md:hover:border-cielo-profundo"
          >
            <CircleUserRound size={22} strokeWidth={1.5} aria-hidden />
            <span className="hidden md:inline">Acceder</span>
          </Link>
          <Link
            href="/contacto"
            className="group hidden h-12 items-center gap-3 rounded-full bg-noche pr-1.5 pl-5 text-[15px] font-semibold text-blanco transition-colors duration-150 hover:bg-cielo-profundo sm:flex"
          >
            Hablemos
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-cielo text-noche transition-transform duration-200 group-hover:rotate-45 motion-reduce:transition-none">
              <ArrowUpRight size={16} strokeWidth={2} aria-hidden />
            </span>
          </Link>
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full text-noche lg:hidden"
            aria-label="Abrir menú"
            aria-expanded={open}
            aria-controls="menu-movil"
            onClick={() => setOpen(true)}
          >
            <Menu size={24} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {open && (
        <div
          id="menu-movil"
          role="dialog"
          aria-modal="true"
          aria-label="Menú"
          className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-noche text-nube lg:hidden"
        >
          <div className="px-4 pt-3 md:px-8 md:pt-4">
            <div className="flex h-14 items-center justify-between rounded-full border border-white/15 pr-1.5 pl-5 md:h-16">
              <Logo variant="dark" cubeSize={22} wordmarkSize={17} gap={9} />
              <button
                type="button"
                autoFocus
                className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-nube text-noche"
                aria-label="Cerrar menú"
                onClick={() => setOpen(false)}
              >
                <X size={20} strokeWidth={1.5} />
              </button>
            </div>
          </div>

          <nav aria-label="Principal móvil" className="container-dm flex flex-col pt-4">
            {nav.map((item, i) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(item.href) ? "page" : undefined}
                className="flex items-baseline gap-4 border-b border-white/10 py-4 transition-colors hover:text-cielo aria-[current=page]:text-cielo"
              >
                <span className="font-mono text-xs text-cielo">{String(i + 1).padStart(2, "0")}</span>
                <span className="font-display text-[30px] font-bold tracking-[-0.045em]">{item.label}</span>
              </Link>
            ))}
          </nav>

          <div className="container-dm mt-auto flex flex-col gap-4 pt-10 pb-7">
            <Link href="/contacto" className="btn-primary w-full">
              Hablemos de tu idea
            </Link>
            <Link
              href="/portal"
              className="flex h-12 w-full items-center justify-center gap-2 rounded-full border border-white/20 text-[15px] font-medium text-nube transition-colors hover:border-cielo hover:text-cielo"
            >
              <CircleUserRound size={20} strokeWidth={1.5} aria-hidden /> Acceso para clientes
            </Link>
            <div className="flex items-center justify-between gap-4 font-mono text-xs text-niebla">
              {site.email ? <a href={`mailto:${site.email}`} className="hover:text-cielo">{site.email}</a> : <span />}
              <span>
                CTG · <HoraLocal />
              </span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
