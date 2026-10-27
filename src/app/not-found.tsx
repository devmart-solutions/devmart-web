import Link from "next/link";
import { Cube } from "@/components/Cube";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { WHATSAPP_VISIBLE, whatsappHref } from "@/lib/site";

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="container-dm flex flex-1 flex-col items-center justify-center py-20 text-center">
        <div className="flex max-w-[620px] flex-col items-center gap-7">
          <div className="cube-hover flex h-36 w-36 items-center justify-center rounded-panel bg-cielo-tinte">
            <div className="cube-float">
              <Cube size={88} className="h-auto w-20" />
            </div>
          </div>

          <span className="label-mono text-cielo-profundo">{"// Error 404 · Página no encontrada"}</span>

          <h1 className="h1-hero text-balance">
            Esta ruta no existe o fue movida.
          </h1>

          <p className="text-lg leading-[1.55] text-pizarra text-pretty">
            El enlace que seguiste no está disponible. Puedes volver a la página principal o explorar nuestros proyectos.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link href="/" className="btn-primary">
              Volver al inicio
            </Link>
            <Link href="/proyectos" className="btn-secondary">
              Ver proyectos
            </Link>
            <a
              href={whatsappHref("Hola, estaba navegando en devmart.co y encontré un enlace roto.")}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary"
            >
              Avisar por WhatsApp ({WHATSAPP_VISIBLE})
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
