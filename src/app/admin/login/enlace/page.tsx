import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { tokenEntrarValido } from "@/lib/auth/cuenta";
import { Aviso, Tarjeta } from "../Tarjeta";
import { EnlaceForm } from "./EnlaceForm";

export const metadata: Metadata = { title: "Entrar", referrer: "no-referrer" };

// El enlace del correo abre esta pantalla y se gasta con un clic (POST), igual que el del portal.
export default function EnlacePage({ searchParams }: PageProps<"/admin/login/enlace">) {
  return (
    <Tarjeta titulo="Entrar al panel" intro="Tu enlace está listo. Después te pediremos el código de tu app.">
      <Suspense fallback={<div className="h-14 animate-pulse rounded-full bg-nube" aria-label="Cargando" />}>
        <Entrada searchParams={searchParams} />
      </Suspense>
    </Tarjeta>
  );
}

async function Entrada({ searchParams }: Pick<PageProps<"/admin/login/enlace">, "searchParams">) {
  const { token } = await searchParams;
  const t = typeof token === "string" ? token : "";
  if (!(await tokenEntrarValido(t))) {
    return (
      <div className="flex flex-col gap-5">
        <Aviso tono="error">El enlace venció o ya se usó.</Aviso>
        <Link href="/admin/login" className="btn-primary w-full">
          Entrar con mi contraseña
        </Link>
      </div>
    );
  }
  return <EnlaceForm token={t} />;
}
