import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AvisoPortal, TarjetaAcceso } from "@/components/portal/TarjetaAcceso";
import { abrirRegistro } from "@/lib/auth/cliente";
import { ConfirmarForm } from "./ConfirmarForm";

export const metadata: Metadata = { title: "Confirmar cuenta", referrer: "no-referrer" };

// El enlace del correo abre esta pantalla y la cuenta se crea con un clic (POST), para que los
// antivirus de correo que abren los enlaces por su cuenta no la activen.
export default function ConfirmarPage({ searchParams }: PageProps<"/portal/registro/confirmar">) {
  return (
    <TarjetaAcceso titulo="Confirma tu cuenta" intro="Un clic más y ya puedes entrar a tu portal.">
      <Suspense fallback={<div className="h-14 animate-pulse rounded-full bg-nube" aria-label="Cargando" />}>
        <Confirmar searchParams={searchParams} />
      </Suspense>
    </TarjetaAcceso>
  );
}

async function Confirmar({ searchParams }: Pick<PageProps<"/portal/registro/confirmar">, "searchParams">) {
  const { token } = await searchParams;
  const t = typeof token === "string" ? token : "";
  const registro = await abrirRegistro(t);
  if (!registro) {
    return (
      <div className="flex flex-col gap-5">
        <AvisoPortal tono="error">El enlace venció. Vuelve a registrarte para recibir uno nuevo.</AvisoPortal>
        <Link href="/portal/registro" className="btn-primary w-full">
          Registrarme de nuevo
        </Link>
      </div>
    );
  }
  return <ConfirmarForm token={t} nombre={registro.nombre.split(" ")[0]} email={registro.email} />;
}
