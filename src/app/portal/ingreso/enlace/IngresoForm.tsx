"use client";

import { useActionState } from "react";
import { Loader2, Mail } from "lucide-react";
import { solicitarAcceso, type PortalState } from "../../actions";
import { AvisoPortal, inputPortal } from "@/components/portal/TarjetaAcceso";

export function IngresoForm() {
  const [state, action, pending] = useActionState<PortalState, FormData>(solicitarAcceso, {});
  if (state.ok) return <AvisoPortal>{state.message}</AvisoPortal>;
  return (
    <form action={action} className="flex flex-col gap-5">
      {state.error && <AvisoPortal tono="error">{state.error}</AvisoPortal>}
      <label className="flex flex-col gap-2 text-[15px] font-medium text-noche">
        Email
        <input name="email" type="email" autoComplete="email" required maxLength={254} className={inputPortal} />
      </label>
      <button type="submit" disabled={pending} className="btn-primary w-full disabled:opacity-70">
        {pending ? <Loader2 size={18} strokeWidth={1.5} className="animate-spin" aria-hidden /> : <Mail size={18} strokeWidth={1.5} aria-hidden />}
        {pending ? "Enviando…" : "Enviarme el enlace"}
      </button>
    </form>
  );
}
