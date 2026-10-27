import type { ReactNode } from "react";
import { CubosEscalera } from "@/components/CubosEscalera";
import { Logo } from "@/components/Logo";

const ventajas = ["Avance", "Entregables", "Pagos", "Soporte"];

/**
 * Pantallas de acceso del portal (entrar, registrarse, recuperar la contraseña) en 60/40, igual que
 * las del panel: a la izquierda la escalera de cubos sobre Noche; a la derecha el
 * formulario. En móvil, solo el formulario.
 */
export function TarjetaAcceso({ titulo, intro, children }: { titulo: string; intro: ReactNode; children: ReactNode }) {
  return (
    <div className="grid min-h-screen bg-blanco lg:grid-cols-[3fr_2fr]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-noche px-14 py-10 text-nube lg:flex">
        <div className="flex items-center justify-between">
          <Logo variant="dark" cubeSize={24} wordmarkSize={18} gap={10} href="/" />
          <span className="font-mono text-[11px] tracking-[0.12em] text-niebla uppercase">Portal de clientes</span>
        </div>
        <CubosEscalera className="max-h-[48vh] w-[72%] max-w-[580px] self-center" />
        <div className="flex flex-col gap-[18px]">
          <span className="label-mono text-cielo">{"// Tu proyecto"}</span>
          <p className="max-w-[560px] font-display text-[40px] leading-[1.05] font-bold tracking-[-0.05em] text-balance">
            Míralo crecer, bloque a bloque.
          </p>
          <ol className="flex flex-wrap gap-x-7 gap-y-2 border-t border-white/15 pt-[18px] font-mono text-xs text-niebla">
            {ventajas.map((v, i) => (
              <li key={v}>
                <span className="text-cielo">{String(i + 1).padStart(2, "0")}</span> {v}
              </li>
            ))}
          </ol>
        </div>
      </aside>

      <main className="flex items-center justify-center px-5 py-12 md:px-12">
        <div className="flex w-full max-w-[400px] flex-col gap-7">
          <div className="flex items-center justify-between lg:hidden">
            <Logo cubeSize={24} wordmarkSize={18} gap={10} href="/" />
            <span className="font-mono text-[11px] tracking-[0.12em] text-pizarra uppercase">Portal</span>
          </div>
          <div className="flex flex-col gap-2">
            <h1 className="font-display text-[26px] leading-[1.1] font-bold tracking-[-0.045em] md:text-[30px]">{titulo}</h1>
            <p className="text-[15px] leading-[1.55] text-pizarra">{intro}</p>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}

export function AvisoPortal({ tono = "info", children }: { tono?: "info" | "error"; children: ReactNode }) {
  return (
    <p
      role={tono === "error" ? "alert" : "status"}
      className={`rounded-xl px-4 py-3 text-[15px] leading-[1.55] ${
        tono === "error" ? "border border-[#C2410C]/30 bg-[#FFF4ED] text-[#9A3412]" : "bg-cielo-tinte text-noche"
      }`}
    >
      {children}
    </p>
  );
}

export const inputPortal =
  "w-full rounded-xl border border-borde bg-blanco px-4 py-3.5 text-[16px] text-noche placeholder:text-niebla transition-colors hover:border-niebla focus:border-cielo-profundo focus:outline-none";

/** Etiqueta + campo de los formularios de acceso. */
export function CampoPortal({ label, extra, children }: { label: string; extra?: ReactNode; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-2 text-[15px] font-medium text-noche">
      <span className="flex items-baseline justify-between gap-3">
        {label}
        {extra}
      </span>
      {children}
    </label>
  );
}
