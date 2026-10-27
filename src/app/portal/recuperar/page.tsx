import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { TarjetaAcceso } from "@/components/portal/TarjetaAcceso";
import { RecuperarForm } from "./RecuperarForm";

export const metadata: Metadata = { title: "Recuperar contraseña" };

export default function RecuperarPage() {
  return (
    <TarjetaAcceso
      titulo="Crea una contraseña nueva"
      intro="Escribe el email de tu cuenta y te enviamos un enlace. Si la cuenta la creamos nosotros, así creas tu primera contraseña."
    >
      <RecuperarForm />
      <Link href="/portal/ingreso" className="inline-flex w-fit items-center gap-2 text-[15px] text-pizarra hover:text-noche">
        <ArrowLeft size={18} strokeWidth={1.5} aria-hidden /> Volver a entrar
      </Link>
    </TarjetaAcceso>
  );
}
