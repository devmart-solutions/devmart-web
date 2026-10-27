"use client";

import Link from "next/link";
import { useEffect } from "react";
import { AlertCircle, RotateCcw } from "lucide-react";
import { WHATSAPP_VISIBLE, whatsappHref } from "@/lib/site";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Registro del error en consola (o servicio de observabilidad)
    console.error("Error capturado por límite de página:", error);
  }, [error]);

  return (
    <div className="container-dm flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <div className="flex max-w-[560px] flex-col items-center gap-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
          <AlertCircle size={36} strokeWidth={1.75} aria-hidden />
        </div>

        <span className="label-mono text-pizarra">{"// Error en la aplicación"}</span>

        <h1 className="h2-dm text-balance">
          Ocurrió un problema inesperado.
        </h1>

        <p className="text-base leading-[1.55] text-pizarra text-pretty">
          No pudimos completar la acción o cargar el contenido solicitado. Puedes intentar recargar la página o comunicarte directamente con nosotros.
        </p>

        {error.digest && (
          <p className="font-mono text-xs text-niebla">
            Código de referencia: {error.digest}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="btn-primary inline-flex items-center gap-2"
          >
            <RotateCcw size={16} aria-hidden />
            Reintentar
          </button>
          <Link href="/" className="btn-secondary">
            Ir al inicio
          </Link>
          <a
            href={whatsappHref("Hola, tuve un problema navegando en el sitio web de DevMart.")}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary"
          >
            Soporte por WhatsApp ({WHATSAPP_VISIBLE})
          </a>
        </div>
      </div>
    </div>
  );
}
