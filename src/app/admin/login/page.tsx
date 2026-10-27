import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { credenciales } from "@/lib/auth/config";
import { oauthDisponible } from "@/lib/auth/oauth";
import { OAuthButtons } from "@/components/OAuthButtons";
import { LoginForm } from "./LoginForm";
import { Aviso, Tarjeta } from "./Tarjeta";

export const metadata: Metadata = { title: "Entrar" };

const ERRORES_OAUTH: Record<string, string> = {
  email: "La cuenta de Google o GitHub no coincide con el email del administrador.",
  cancelado: "Cancelaste el acceso con la cuenta social.",
  state: "El enlace expiró. Vuelve a intentarlo.",
  perfil: "No pudimos leer tu email del proveedor. Inténtalo de nuevo.",
  no_configurado: "El acceso con esa cuenta no está configurado en este momento.",
  sin_configurar: "El panel no está configurado (falta SESSION_SECRET o ADMIN_EMAIL).",
  parametros: "Respuesta inválida del proveedor. Inténtalo de nuevo.",
  bloqueado: "Demasiados intentos. Espera 15 minutos antes de volver a intentarlo.",
};

/** Un parámetro de la URL puede repetirse (`?a=1&a=2`): solo vale el primero. */
const param = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default function LoginPage({ searchParams }: PageProps<"/admin/login">) {
  return (
    <Tarjeta titulo="Bienvenido de vuelta" intro="Acceso solo para el equipo de DevMart.">
      <Suspense fallback={<div className="h-80 animate-pulse rounded-xl bg-nube" aria-label="Cargando" />}>
        <Acceso searchParams={searchParams} />
      </Suspense>
      <Link href="/" className="inline-flex w-fit items-center gap-2 text-[15px] text-pizarra hover:text-noche">
        <ArrowLeft size={18} strokeWidth={1.5} aria-hidden /> Volver al sitio
      </Link>
    </Tarjeta>
  );
}

async function Acceso({ searchParams }: Pick<PageProps<"/admin/login">, "searchParams">) {
  const [cfg, params] = await Promise.all([credenciales(), searchParams]);
  const error = param(params.error);
  const errorMsg = error ? (ERRORES_OAUTH[error] ?? "Algo salió mal. Inténtalo de nuevo.") : null;
  // Tras entrar con Google o GitHub falta el código de la app; la acción comprueba la cookie del paso.
  const pasoCodigo = param(params.paso) === "codigo" && Boolean(cfg.totpSecret);

  const tieneGoogle = oauthDisponible("google");
  const tieneGithub = oauthDisponible("github");
  const tieneOauth = tieneGoogle || tieneGithub;

  if (!cfg.base) {
    return (
      <Aviso>
        El panel aún no está configurado. Ejecuta <code className="font-mono">npm run admin:setup</code> y vuelve a desplegar.
      </Aviso>
    );
  }

  if (!cfg.ready) {
    return (
      <div className="flex flex-col gap-5">
        <Aviso>Todavía no hay contraseña. Te enviamos un enlace a tu correo para crearla.</Aviso>
        {errorMsg && <Aviso tono="error">{errorMsg}</Aviso>}
        <Link href="/admin/login/recuperar" className="btn-primary w-full">
          Crear mi contraseña
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {param(params.listo) === "1" && <Aviso tono="ok">Listo: tu contraseña nueva ya funciona. Entra con ella y el código de tu app.</Aviso>}
      {errorMsg && <Aviso tono="error">{errorMsg}</Aviso>}
      {tieneOauth && !pasoCodigo && (
        <>
          <OAuthButtons google={tieneGoogle} github={tieneGithub} destino="admin" />
          <div className="flex items-center gap-3">
            <hr className="flex-1 border-borde" />
            <span className="text-[13px] text-pizarra">o continúa con</span>
            <hr className="flex-1 border-borde" />
          </div>
        </>
      )}
      <LoginForm key={pasoCodigo ? "codigo" : "password"} conTotp={Boolean(cfg.totpSecret)} pasoInicial={pasoCodigo ? "codigo" : undefined} />
    </div>
  );
}
