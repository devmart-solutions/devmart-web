"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { WHATSAPP_VISIBLE, whatsappHref } from "@/lib/site";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Error global de aplicación:", error);
  }, [error]);

  return (
    <html lang="es">
      <body className="flex min-h-screen flex-col items-center justify-center bg-[#0b0d12] px-6 py-12 text-[#ffffff] font-sans antialiased">
        <div className="flex max-w-[500px] flex-col items-center gap-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#1e8fd0]/20 text-[#3ec1f3]">
            <AlertTriangle size={36} strokeWidth={1.75} aria-hidden />
          </div>

          <span className="font-mono text-xs tracking-wider text-[#3ec1f3] uppercase">
            {"// Error Crítico"}
          </span>

          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Algo no funcionó correctamente
          </h1>

          <p className="text-sm leading-relaxed text-[#8a93a3]">
            Ocurrió un error en la carga base del sitio. Intenta reiniciar la aplicación o contáctanos por WhatsApp.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => reset()}
              className="inline-flex items-center gap-2 rounded-full bg-[#3ec1f3] px-6 py-3 text-sm font-semibold text-[#0b0d12] hover:bg-[#3ec1f3]/90 transition-colors"
            >
              <RotateCcw size={16} aria-hidden />
              Recargar sitio
            </button>
            <a
              href={whatsappHref("Hola, el sitio web de DevMart experimentó un error crítico.")}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-[#8a93a3]/30 px-6 py-3 text-sm font-medium text-white hover:bg-white/10 transition-colors"
            >
              WhatsApp ({WHATSAPP_VISIBLE})
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
