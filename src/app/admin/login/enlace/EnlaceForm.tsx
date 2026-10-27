"use client";

import { useActionState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { entrarConEnlace, type LoginState } from "../actions";
import { Aviso } from "../Tarjeta";

export function EnlaceForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(entrarConEnlace, {});
  return (
    <form action={action} className="flex flex-col gap-5">
      {state.error && <Aviso tono="error">{state.error}</Aviso>}
      <input type="hidden" name="token" value={token} />
      <button type="submit" disabled={pending} autoFocus className="btn-primary w-full disabled:opacity-70">
        {pending ? <Loader2 size={18} strokeWidth={1.5} className="animate-spin" aria-hidden /> : null}
        {pending ? "Comprobando…" : "Continuar"}
        {!pending && <ArrowRight size={18} strokeWidth={1.5} aria-hidden />}
      </button>
    </form>
  );
}
