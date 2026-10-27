"use client";

import Link from "next/link";
import { useActionState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { confirmarRegistroCliente, type PortalState } from "../../actions";
import { AvisoPortal } from "@/components/portal/TarjetaAcceso";

export function ConfirmarForm({ token, nombre, email }: { token: string; nombre: string; email: string }) {
  const [state, action, pending] = useActionState<PortalState, FormData>(confirmarRegistroCliente, {});
  return (
    <form action={action} className="flex flex-col gap-5">
      <AvisoPortal>
        Hola, {nombre}. Vas a activar la cuenta de <span className="font-medium">{email}</span>.
      </AvisoPortal>
      {state.error && (
        <>
          <AvisoPortal tono="error">{state.error}</AvisoPortal>
          <Link href="/portal/ingreso" className="btn-secondary w-full">
            Ir a entrar
          </Link>
        </>
      )}
      <input type="hidden" name="token" value={token} />
      {!state.error && (
        <button type="submit" disabled={pending} autoFocus className="btn-primary w-full disabled:opacity-70">
          {pending ? <Loader2 size={18} strokeWidth={1.5} className="animate-spin" aria-hidden /> : null}
          {pending ? "Activando…" : "Activar mi cuenta"}
          {!pending && <ArrowRight size={18} strokeWidth={1.5} aria-hidden />}
        </button>
      )}
    </form>
  );
}
