"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Loader2, LockKeyhole } from "lucide-react";
import { iniciarSesionCliente, type PortalState } from "../actions";
import { AvisoPortal, CampoPortal, inputPortal } from "@/components/portal/TarjetaAcceso";

/** Entrar al portal con email y contraseña. */
export function LoginClienteForm() {
  const [state, action, pending] = useActionState<PortalState, FormData>(iniciarSesionCliente, {});
  return (
    <form action={action} className="flex flex-col gap-5">
      {state.error && <AvisoPortal tono="error">{state.error}</AvisoPortal>}
      <CampoPortal label="Email">
        <input name="email" type="email" autoComplete="username" required maxLength={254} className={inputPortal} />
      </CampoPortal>
      <CampoPortal
        label="Contraseña"
        extra={
          <Link href="/portal/recuperar" className="text-[14px] font-normal text-cielo-profundo hover:text-noche">
            ¿Olvidaste tu contraseña?
          </Link>
        }
      >
        <input name="password" type="password" autoComplete="current-password" required maxLength={200} className={inputPortal} />
      </CampoPortal>
      <button type="submit" disabled={pending} className="btn-primary mt-1 w-full disabled:opacity-70">
        {pending ? <Loader2 size={18} strokeWidth={1.5} className="animate-spin" aria-hidden /> : <LockKeyhole size={18} strokeWidth={1.5} aria-hidden />}
        {pending ? "Comprobando…" : "Entrar"}
      </button>
    </form>
  );
}
