"use client";

import { useActionState } from "react";
import { Loader2, Mail } from "lucide-react";
import { recuperarClave, type PortalState } from "../actions";
import { AvisoPortal, CampoPortal, inputPortal } from "@/components/portal/TarjetaAcceso";

export function RecuperarForm() {
  const [state, action, pending] = useActionState<PortalState, FormData>(recuperarClave, {});
  if (state.ok) return <AvisoPortal>{state.message}</AvisoPortal>;
  return (
    <form action={action} className="flex flex-col gap-5">
      {state.error && <AvisoPortal tono="error">{state.error}</AvisoPortal>}
      <CampoPortal label="Email">
        <input name="email" type="email" autoComplete="email" required maxLength={254} className={inputPortal} />
      </CampoPortal>
      <button type="submit" disabled={pending} className="btn-primary w-full disabled:opacity-70">
        {pending ? <Loader2 size={18} strokeWidth={1.5} className="animate-spin" aria-hidden /> : <Mail size={18} strokeWidth={1.5} aria-hidden />}
        {pending ? "Enviando…" : "Enviarme el enlace"}
      </button>
    </form>
  );
}
