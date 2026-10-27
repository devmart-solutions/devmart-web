"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChartNoAxesGantt, House, LifeBuoy, PackageCheck, Wallet } from "lucide-react";

const items = [
  { href: "/portal", label: "Inicio", icon: House },
  { href: "/portal/avance", label: "Avance", icon: ChartNoAxesGantt },
  { href: "/portal/entregables", label: "Entregas", icon: PackageCheck },
  { href: "/portal/pagos", label: "Pagos", icon: Wallet },
  { href: "/portal/soporte", label: "Soporte", icon: LifeBuoy },
];

/** Barra inferior del portal (móvil primero). Conserva la obra elegida (?obra=). */
export function BarraPortal() {
  const pathname = usePathname();
  const obra = useSearchParams().get("obra");
  return <Barra activo={(href) => (href === "/portal" ? pathname === href : pathname.startsWith(href))} obra={obra} />;
}

export function BarraPortalFallback() {
  return <Barra activo={() => false} obra={null} />;
}

function Barra({ activo, obra }: { activo: (href: string) => boolean; obra: string | null }) {
  return (
    <nav
      aria-label="Portal"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-borde bg-blanco pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="mx-auto grid max-w-[720px] grid-cols-5">
        {items.map(({ href, label, icon: Icon }) => (
          <li key={href}>
            <Link
              href={obra ? `${href}?obra=${encodeURIComponent(obra)}` : href}
              aria-current={activo(href) ? "page" : undefined}
              className="flex h-16 flex-col items-center justify-center gap-1 text-[12px] font-medium text-pizarra transition-colors hover:text-noche aria-[current=page]:text-cielo-profundo"
            >
              <Icon size={22} strokeWidth={1.5} aria-hidden />
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
