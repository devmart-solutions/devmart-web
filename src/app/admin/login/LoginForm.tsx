"use client";

import Link from "next/link";
import { useActionState } from "react";
import { ArrowLeft, ArrowRight, Loader2, LockKeyhole } from "lucide-react";
import { iniciarSesion, type LoginState } from "./actions";
import { inputCls } from "./Tarjeta";

// Paso 1: email y contraseña. Paso 2 (si hay verificación en dos pasos): el código de la app.
// Tras entrar con Google o GitHub se empieza directamente en el paso 2.
export function LoginForm({ conTotp, pasoInicial }: { conTotp: boolean; pasoInicial?: "codigo" }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(iniciarSesion, pasoInicial ? { paso: pasoInicial } : {});
  const pasoCodigo = state.paso === "codigo";

  return (
    <form action={action} className="flex flex-col gap-5">
      {state.error && (
        <p role="alert" className="rounded-xl border border-[#C2410C]/30 bg-[#FFF4ED] px-4 py-3 text-[15px] text-[#9A3412]">
          {state.error}
        </p>
      )}

      {pasoCodigo ? (
        <>
          <input type="hidden" name="paso" value="codigo" />
          <p className="rounded-xl bg-cielo-tinte px-4 py-3 text-[15px] leading-[1.55] text-noche">
            {pasoInicial ? "Cuenta verificada." : "Contraseña correcta."} Ahora abre tu app de autenticación y escribe el código de 6 dígitos de DevMart.
          </p>
          <label className="flex flex-col gap-2 text-[15px] font-medium text-noche">
            Código de verificación
            <input
              name="codigo"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9 ]{6,7}"
              maxLength={7}
              required
              autoFocus
              placeholder="123 456"
              className={`${inputCls} font-mono tracking-[0.2em]`}
            />
            <span className="text-[13px] font-normal text-pizarra">Google Authenticator, Microsoft Authenticator o 1Password. Cambia cada 30 segundos.</span>
          </label>
        </>
      ) : (
        <>
          <label className="flex flex-col gap-2 text-[15px] font-medium text-noche">
            Email
            <input name="email" type="email" autoComplete="username" required className={inputCls} />
          </label>
          <div className="flex flex-col gap-2">
            <label className="flex flex-col gap-2 text-[15px] font-medium text-noche">
              Contraseña
              <input name="password" type="password" autoComplete="current-password" required className={inputCls} />
            </label>
            <Link href="/admin/login/recuperar" className="w-fit text-[14px] text-cielo-profundo hover:text-noche">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
        </>
      )}

      <button type="submit" disabled={pending} className="btn-primary mt-2 w-full disabled:opacity-70">
        {pending ? (
          <Loader2 size={18} strokeWidth={1.5} className="animate-spin" aria-hidden />
        ) : pasoCodigo || !conTotp ? (
          <LockKeyhole size={18} strokeWidth={1.5} aria-hidden />
        ) : null}
        {pending ? "Comprobando…" : pasoCodigo || !conTotp ? "Entrar" : "Continuar"}
        {!pending && !pasoCodigo && conTotp && <ArrowRight size={18} strokeWidth={1.5} aria-hidden />}
      </button>

      {pasoCodigo && (
        <a href="/admin/login" className="inline-flex w-fit items-center gap-2 text-[14px] text-pizarra hover:text-noche">
          <ArrowLeft size={16} strokeWidth={1.5} aria-hidden /> Usar otra cuenta
        </a>
      )}
    </form>
  );
}
