import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AvisoPortal, TarjetaAcceso } from "@/components/portal/TarjetaAcceso";
import { accesoVigente, MINIMO_PASSWORD_CLIENTE } from "@/lib/auth/cliente";
import { ClaveForm } from "./ClaveForm";

export const metadata: Metadata = { title: "Tu contraseña", referrer: "no-referrer" };

export default function ClavePage({ searchParams }: PageProps<"/portal/clave">) {
  return (
    <TarjetaAcceso titulo="Tu contraseña" intro="Elige la contraseña con la que vas a entrar a tu portal.">
      <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-nube" aria-label="Cargando" />}>
        <Formulario searchParams={searchParams} />
      </Suspense>
    </TarjetaAcceso>
  );
}

async function Formulario({ searchParams }: Pick<PageProps<"/portal/clave">, "searchParams">) {
  const { token } = await searchParams;
  const t = typeof token === "string" ? token : "";
  if (!(await accesoVigente(t))) {
    return (
      <div className="flex flex-col gap-5">
        <AvisoPortal tono="error">El enlace venció o ya se usó.</AvisoPortal>
        <Link href="/portal/recuperar" className="btn-primary w-full">
          Pedir un enlace nuevo
        </Link>
      </div>
    );
  }
  return <ClaveForm token={t} minimo={MINIMO_PASSWORD_CLIENTE} />;
}
