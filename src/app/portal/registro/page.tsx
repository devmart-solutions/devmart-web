import type { Metadata } from "next";
import Link from "next/link";
import { OAuthButtons } from "@/components/OAuthButtons";
import { TarjetaAcceso } from "@/components/portal/TarjetaAcceso";
import { MINIMO_PASSWORD_CLIENTE } from "@/lib/auth/cliente";
import { oauthDisponible } from "@/lib/auth/oauth";
import { RegistroForm } from "./RegistroForm";

export const metadata: Metadata = { title: "Crear cuenta" };

export default function RegistroPage() {
  const google = oauthDisponible("google");
  const github = oauthDisponible("github");
  return (
    <TarjetaAcceso
      titulo="Crea tu cuenta"
      intro="Si ya trabajamos juntos, usa el email que nos diste: verás tu proyecto apenas confirmes la cuenta."
    >
      {(google || github) && (
        <div className="flex flex-col gap-5">
          <OAuthButtons google={google} github={github} destino="portal" />
          <div className="flex items-center gap-3">
            <hr className="flex-1 border-borde" />
            <span className="text-[13px] text-pizarra">o con tus datos</span>
            <hr className="flex-1 border-borde" />
          </div>
        </div>
      )}
      <RegistroForm minimo={MINIMO_PASSWORD_CLIENTE} />
      <p className="border-t border-borde pt-5 text-center text-[15px] text-pizarra">
        ¿Ya tienes cuenta?{" "}
        <Link href="/portal/ingreso" className="font-medium text-cielo-profundo underline-offset-4 hover:underline">
          Entra aquí
        </Link>
      </p>
    </TarjetaAcceso>
  );
}
