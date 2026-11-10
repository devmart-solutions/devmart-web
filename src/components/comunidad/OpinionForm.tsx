"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Loader2, Send, Star } from "lucide-react";
import { crearOpinion, type OpinionState } from "@/app/(sitio)/comunidad/actions";

const inputCls =
  "w-full rounded-xl border border-borde bg-blanco px-4 py-3 text-[16px] text-noche outline-none transition-colors focus:border-cielo-profundo";

/** Formulario para que un cliente con sesión cuente su experiencia. */
export function OpinionForm({ nombre, publicaciones }: { nombre: string; publicaciones: { id: number; etiqueta: string }[] }) {
  const [state, action, pending] = useActionState<OpinionState, FormData>(crearOpinion, {});
  const [valoracion, setValoracion] = useState(5);
  const [hover, setHover] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-5">
      <p className="text-[17px] text-pizarra">
        Hola, <span className="font-medium text-noche">{nombre.split(" ")[0]}</span>. ¿Cómo fue trabajar con nosotros?
      </p>
      {state.error && <p className="rounded-xl bg-[#FFF4ED] px-4 py-3 text-[15px] text-[#9A3412]">{state.error}</p>}
      {state.ok && <p className="rounded-xl bg-cielo-tinte px-4 py-3 text-[15px] text-noche">{state.message}</p>}

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-[15px] font-medium">Tu valoración</legend>
        <div className="flex gap-1" onPointerLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className="cursor-pointer" onPointerEnter={() => setHover(n)}>
              <input type="radio" name="valoracion" value={n} checked={valoracion === n} onChange={() => setValoracion(n)} className="peer sr-only" />
              <Star
                size={30}
                strokeWidth={1.5}
                fill={n <= (hover || valoracion) ? "currentColor" : "none"}
                className="text-cielo transition-transform duration-150 hover:scale-125 peer-focus-visible:outline-2 peer-focus-visible:outline-cielo-profundo"
                aria-hidden
              />
              <span className="sr-only">{n} de 5</span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="flex flex-col gap-2 text-[15px] font-medium">
        Tu opinión o experiencia
        <textarea name="texto" rows={4} required minLength={15} maxLength={1200} className={`${inputCls} resize-y leading-[1.55]`} />
      </label>

      {publicaciones.length > 0 && (
        <label className="flex flex-col gap-2 text-[15px] font-medium">
          ¿Sobre una publicación? <span className="font-normal text-pizarra">(opcional)</span>
          <select name="publicacionId" defaultValue="" className={inputCls}>
            <option value="">Sobre DevMart en general</option>
            {publicaciones.map((p) => (
              <option key={p.id} value={p.id}>
                {p.etiqueta}
              </option>
            ))}
          </select>
        </label>
      )}

      <button type="submit" disabled={pending} className="btn-primary w-full disabled:opacity-70 sm:w-fit">
        {pending ? <Loader2 size={18} className="animate-spin" aria-hidden /> : <Send size={18} aria-hidden />}
        {pending ? "Enviando…" : "Enviar opinión"}
      </button>
      <p className="text-sm text-pizarra">La revisamos antes de publicarla. En público solo aparece tu nombre y la inicial de tu apellido.</p>
    </form>
  );
}
