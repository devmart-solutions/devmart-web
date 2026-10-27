import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft, Mail } from "lucide-react";
import { OAuthButtons } from "@/components/OAuthButtons";
import { AvisoPortal, TarjetaAcceso } from "@/components/portal/TarjetaAcceso";
import { leerSesionCliente } from "@/lib/auth/cliente";
import { oauthDisponible } from "@/lib/auth/oauth";
import { leerProspecto } from "@/lib/portal/prospecto";
import { LoginClienteForm } from "./LoginClienteForm";
import { ProspectoForm } from "./ProspectoForm";

export const metadata: Metadata = { title: "Entrar" };

const ERRORES: Record<string, string> = {
  sin_acceso: "Esa cuenta no tiene acceso al portal. Entra con el email con el que trabajas con nosotros o crea tu cuenta.",
  cancelado: "Cancelaste el acceso con Google o GitHub.",
  state: "El acceso tardó demasiado. Vuelve a intentarlo.",
  perfil: "No pudimos leer tu email del proveedor. Inténtalo de nuevo o entra con tu contraseña.",
  bloqueado: "Demasiados intentos. Espera 15 minutos antes de volver a intentarlo.",
  no_configurado: "El acceso con esa cuenta no está disponible en este momento. Entra con tu contraseña.",
  sin_configurar: "El portal aún no está disponible.",
  parametros: "Respuesta inválida del proveedor. Inténtalo de nuevo.",
};

export default function IngresoPage({ searchParams }: PageProps<"/portal/ingreso">) {
  return (
    <TarjetaAcceso titulo="Bienvenido a tu portal" intro="Entra para ver el avance de tu proyecto, los entregables y los pagos.">
      <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-nube" aria-label="Cargando" />}>
        <Opciones searchParams={searchParams} />
      </Suspense>
      <Link href="/" className="inline-flex w-fit items-center gap-2 text-[15px] text-pizarra hover:text-noche">
        <ArrowLeft size={18} strokeWidth={1.5} aria-hidden /> Volver al sitio
      </Link>
    </TarjetaAcceso>
  );
}

async function Opciones({ searchParams }: Pick<PageProps<"/portal/ingreso">, "searchParams">) {
  // Con la sesión abierta no hace falta volver a entrar.
  if (await leerSesionCliente()) redirect("/portal");

  const { error } = await searchParams;
  const codigo = Array.isArray(error) ? error[0] : error;
  const google = oauthDisponible("google");
  const github = oauthDisponible("github");

  // Entró con Google o GitHub y no es cliente: en vez de un error, la invitación a empezar un proyecto.
  const prospecto = codigo === "sin_acceso" ? await leerProspecto() : null;
  if (prospecto) {
    return (
      <div className="flex flex-col gap-5">
        <ProspectoForm nombre={prospecto.nombre} email={prospecto.email} />
        <p className="text-[14px] leading-[1.55] text-pizarra">
          ¿Ya trabajas con nosotros con otro email?{" "}
          <Link href="/portal/ingreso" className="font-medium text-cielo-profundo underline-offset-4 hover:underline">
            Entra con ese
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {codigo && <AvisoPortal tono="error">{ERRORES[codigo] ?? "Algo salió mal. Inténtalo de nuevo."}</AvisoPortal>}
      {(google || github) && (
        <>
          <OAuthButtons google={google} github={github} destino="portal" />
          <div className="flex items-center gap-3">
            <hr className="flex-1 border-borde" />
            <span className="text-[13px] text-pizarra">o con tu email</span>
            <hr className="flex-1 border-borde" />
          </div>
        </>
      )}
      <LoginClienteForm />
      <Link href="/portal/ingreso/enlace" className="btn-secondary w-full">
        <Mail size={18} strokeWidth={1.5} aria-hidden /> Entrar con un enlace a mi correo
      </Link>
      <p className="border-t border-borde pt-5 text-center text-[15px] text-pizarra">
        ¿Aún no tienes cuenta?{" "}
        <Link href="/portal/registro" className="font-medium text-cielo-profundo underline-offset-4 hover:underline">
          Créala aquí
        </Link>
      </p>
    </div>
  );
}
