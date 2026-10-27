"use client";

import { useActionState } from "react";
import { Loader2, Send } from "lucide-react";
import { registrarProspecto, type PortalState } from "../actions";
import { AvisoPortal, inputPortal } from "@/components/portal/TarjetaAcceso";

/** Para quien entró con Google o GitHub sin ser cliente: deja sus datos con un clic. */
export function ProspectoForm({ nombre, email }: { nombre: string; email: string }) {
  const [state, action, pending] = useActionState<PortalState, FormData>(registrarProspecto, {});
  if (state.ok) return <AvisoPortal>{state.message}</AvisoPortal>;
  return (
    <form action={action} className="flex flex-col gap-4 rounded-[18px] border border-borde bg-nube p-5">
      <div className="flex flex-col gap-1">
        <h2 className="font-medium">¿Quieres empezar un proyecto con nosotros?</h2>
        <p className="text-[14px] leading-[1.55] text-pizarra">
          Aún no tienes un proyecto activo. Déjanos tus datos y te escribimos a <span className="font-medium text-noche">{email}</span>.
        </p>
      </div>
      {state.error && <AvisoPortal tono="error">{state.error}</AvisoPortal>}
      <label className="flex flex-col gap-2 text-[15px] font-medium text-noche">
        Nombre
        <input name="nombre" defaultValue={nombre} required minLength={2} maxLength={100} autoComplete="name" className={inputPortal} />
      </label>
      <label className="flex flex-col gap-2 text-[15px] font-medium text-noche">
        Tu idea <span className="text-[13px] font-normal text-pizarra">opcional</span>
        <textarea name="idea" rows={3} maxLength={2000} placeholder="Cuéntanos en pocas palabras qué quieres construir" className={`${inputPortal} resize-y leading-[1.55]`} />
      </label>
      <button type="submit" disabled={pending} className="btn-primary w-full disabled:opacity-70">
        {pending ? <Loader2 size={18} strokeWidth={1.5} className="animate-spin" aria-hidden /> : <Send size={18} strokeWidth={1.5} aria-hidden />}
        {pending ? "Enviando…" : "Quiero que me contacten"}
      </button>
    </form>
  );
}
