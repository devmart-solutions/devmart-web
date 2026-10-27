"use client";

import { useActionState } from "react";
import { Loader2, LockKeyhole } from "lucide-react";
import { establecerClave, type PortalState } from "../actions";
import { AvisoPortal, CampoPortal, inputPortal } from "@/components/portal/TarjetaAcceso";

export function ClaveForm({ token, minimo }: { token: string; minimo: number }) {
  const [state, action, pending] = useActionState<PortalState, FormData>(establecerClave, {});
  return (
    <form action={action} className="flex flex-col gap-5">
      {state.error && <AvisoPortal tono="error">{state.error}</AvisoPortal>}
      <input type="hidden" name="token" value={token} />
      <CampoPortal label="Contraseña nueva" extra={<span className="text-[13px] font-normal text-pizarra">mínimo {minimo} caracteres</span>}>
        <input name="password" type="password" autoComplete="new-password" required minLength={minimo} maxLength={200} autoFocus className={inputPortal} />
      </CampoPortal>
      <CampoPortal label="Repite la contraseña">
        <input name="confirmacion" type="password" autoComplete="new-password" required minLength={minimo} maxLength={200} className={inputPortal} />
      </CampoPortal>
      <button type="submit" disabled={pending} className="btn-primary w-full disabled:opacity-70">
        {pending ? <Loader2 size={18} strokeWidth={1.5} className="animate-spin" aria-hidden /> : <LockKeyhole size={18} strokeWidth={1.5} aria-hidden />}
        {pending ? "Guardando…" : "Guardar y entrar"}
      </button>
    </form>
  );
}
