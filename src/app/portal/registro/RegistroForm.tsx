"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Loader2, UserPlus } from "lucide-react";
import { registrarCliente, type PortalState } from "../actions";
import { AvisoPortal, CampoPortal, inputPortal } from "@/components/portal/TarjetaAcceso";

const opcional = <span className="text-[13px] font-normal text-pizarra">opcional</span>;

/** Crear la cuenta del portal (o activar la que creamos nosotros con ese email). */
export function RegistroForm({ minimo }: { minimo: number }) {
  const [state, action, pending] = useActionState<PortalState, FormData>(registrarCliente, {});
  if (state.ok) return <AvisoPortal>{state.message}</AvisoPortal>;
  return (
    <form action={action} className="flex flex-col gap-5">
      {state.error && <AvisoPortal tono="error">{state.error}</AvisoPortal>}
      <CampoPortal label="Nombre completo">
        <input name="nombre" autoComplete="name" required minLength={2} maxLength={120} className={inputPortal} />
      </CampoPortal>
      <CampoPortal label="Email">
        <input name="email" type="email" autoComplete="email" required maxLength={254} className={inputPortal} />
      </CampoPortal>
      <div className="grid gap-5 sm:grid-cols-2">
        <CampoPortal label="WhatsApp" extra={opcional}>
          <input name="telefono" type="tel" autoComplete="tel" maxLength={30} placeholder="+57 300 000 0000" className={inputPortal} />
        </CampoPortal>
        <CampoPortal label="Empresa" extra={opcional}>
          <input name="empresa" autoComplete="organization" maxLength={120} className={inputPortal} />
        </CampoPortal>
      </div>
      <CampoPortal label="Contraseña" extra={<span className="text-[13px] font-normal text-pizarra">mínimo {minimo} caracteres</span>}>
        <input name="password" type="password" autoComplete="new-password" required minLength={minimo} maxLength={200} className={inputPortal} />
      </CampoPortal>
      <CampoPortal label="Repite la contraseña">
        <input name="confirmacion" type="password" autoComplete="new-password" required minLength={minimo} maxLength={200} className={inputPortal} />
      </CampoPortal>
      <label className="flex items-start gap-3 text-[14px] leading-[1.55] text-pizarra">
        <input type="checkbox" name="acepto" required className="mt-1 h-4 w-4 accent-cielo-profundo" />
        <span>
          Acepto la{" "}
          <Link href="/privacidad" target="_blank" className="font-medium text-cielo-profundo underline-offset-4 hover:underline">
            política de privacidad
          </Link>
          .
        </span>
      </label>
      <button type="submit" disabled={pending} className="btn-primary w-full disabled:opacity-70">
        {pending ? <Loader2 size={18} strokeWidth={1.5} className="animate-spin" aria-hidden /> : <UserPlus size={18} strokeWidth={1.5} aria-hidden />}
        {pending ? "Creando…" : "Crear mi cuenta"}
      </button>
    </form>
  );
}
