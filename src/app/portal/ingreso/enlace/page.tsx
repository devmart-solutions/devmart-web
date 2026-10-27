import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { TarjetaAcceso } from "@/components/portal/TarjetaAcceso";
import { IngresoForm } from "./IngresoForm";

export const metadata: Metadata = { title: "Entrar con un enlace" };

export default function EnlacePage() {
  return (
    <TarjetaAcceso
      titulo="Entrar sin contraseña"
      intro="Escribe el email de tu cuenta y te enviamos un enlace para entrar. Sirve una sola vez."
    >
      <IngresoForm />
      <Link href="/portal/ingreso" className="inline-flex w-fit items-center gap-2 text-[15px] text-pizarra hover:text-noche">
        <ArrowLeft size={18} strokeWidth={1.5} aria-hidden /> Entrar con mi contraseña
      </Link>
    </TarjetaAcceso>
  );
}
