"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { CheckCircle2, RotateCcw, SendHorizontal, Sparkles, X } from "lucide-react";
import { Cube } from "./Cube";
import { SocialIcon } from "./SocialIcon";
import { consultarAsistenteAction, guardarLeadAsistenteAction } from "@/app/actions/asistente";
import { responder, saludo, type Respuesta } from "@/lib/asistente";
import { whatsappHref } from "@/lib/site";

type Mensaje = {
  de: "bot" | "tu";
  r: Respuesta;
  id: number;
};

let siguienteId = 1;

/** Botón flotante con el cubo de DevMart que abre un asistente interactivo inteligente. */
export function Asistente() {
  const [abierto, setAbierto] = useState(false);
  const [visto, setVisto] = useState(false);
  const [mensajes, setMensajes] = useState<Mensaje[]>([{ de: "bot", r: saludo, id: 0 }]);
  const [texto, setTexto] = useState("");
  const [escribiendo, setEscribiendo] = useState(false);
  const [ultimoMensajeWa, setUltimoMensajeWa] = useState(saludo.whatsappMensaje);

  const inputRef = useRef<HTMLInputElement>(null);
  const finRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierto) return;
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setAbierto(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [abierto]);

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [mensajes, escribiendo]);

  async function preguntar(pregunta: string) {
    const limpia = pregunta.trim().slice(0, 300);
    if (!limpia || escribiendo) return;

    setMensajes((m) => [...m, { de: "tu", r: { texto: limpia }, id: siguienteId++ }]);
    setTexto("");
    setEscribiendo(true);

    try {
      // Intento inteligente con IA en servidor (con fallback heurístico automático)
      const res = await consultarAsistenteAction(limpia);
      setMensajes((m) => [...m, { de: "bot", r: res, id: siguienteId++ }]);
      if (res.whatsappMensaje) setUltimoMensajeWa(res.whatsappMensaje);
    } catch {
      // Fallback local instantáneo si hay fallo de conexión
      const resLocal = responder(limpia);
      setMensajes((m) => [...m, { de: "bot", r: resLocal, id: siguienteId++ }]);
      if (resLocal.whatsappMensaje) setUltimoMensajeWa(resLocal.whatsappMensaje);
    } finally {
      setEscribiendo(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    preguntar(texto);
  }

  function reiniciarChat() {
    setMensajes([{ de: "bot", r: saludo, id: siguienteId++ }]);
    setUltimoMensajeWa(saludo.whatsappMensaje);
    setTexto("");
  }

  function abrir() {
    setAbierto((v) => !v);
    setVisto(true);
  }

  const ultimoMensajeBot = [...mensajes].reverse().find((m) => m.de === "bot");
  const chipsSugeridos = ultimoMensajeBot?.r.sugerenciasSeguimiento || [];

  return (
    <>
      {abierto && (
        <div
          id="asistente"
          role="dialog"
          aria-label="Asistente de DevMart"
          className="fixed inset-x-3 bottom-[calc(92px+env(safe-area-inset-bottom))] z-40 flex max-h-[min(590px,calc(100dvh-110px))] flex-col overflow-hidden rounded-[22px] bg-blanco shadow-[0_24px_60px_rgba(11,13,18,0.20)] sm:inset-x-auto sm:right-8 sm:bottom-[108px] sm:w-[390px]"
        >
          {/* Cabecera del chat */}
          <div className="flex items-center justify-between border-b border-white/10 bg-noche py-3.5 pr-2.5 pl-4 text-nube">
            <div className="flex items-center gap-3">
              <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#161B25]">
                <Cube size={20} variant="dark" />
                <span
                  aria-hidden
                  className="absolute top-1 right-1 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-noche"
                />
              </span>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-display text-[15px] font-bold tracking-[-0.03em]">Asistente DevMart</span>
                  <Sparkles size={13} className="text-cielo" aria-hidden />
                </div>
                <span className="font-mono text-[10px] tracking-[0.1em] text-niebla uppercase">
                  Software a medida · Cartagena
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={reiniciarChat}
                title="Reiniciar conversación"
                aria-label="Reiniciar conversación"
                className="flex h-9 w-9 items-center justify-center rounded-full text-niebla transition-colors hover:bg-white/10 hover:text-blanco"
              >
                <RotateCcw size={16} strokeWidth={1.75} aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => setAbierto(false)}
                aria-label="Cerrar asistente"
                className="flex h-9 w-9 items-center justify-center rounded-full text-niebla transition-colors hover:bg-white/10 hover:text-blanco"
              >
                <X size={18} strokeWidth={1.75} aria-hidden />
              </button>
            </div>
          </div>

          {/* Área de mensajes con scroll */}
          <div className="flex flex-1 flex-col gap-3.5 overflow-y-auto bg-nube p-4" aria-live="polite">
            {mensajes.map((m) => (
              <Burbuja key={m.id} m={m} onNavegar={() => setAbierto(false)} onPreguntar={preguntar} />
            ))}

            {/* Chips de sugerencias contextuales tras la última respuesta */}
            {!escribiendo && chipsSugeridos.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {chipsSugeridos.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => preguntar(s)}
                    className="rounded-full border border-borde bg-blanco px-3 py-1.5 text-left text-[13px] font-medium text-noche transition-all hover:border-cielo-profundo hover:bg-cielo-tinte"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {escribiendo && (
              <span
                className="flex w-fit items-center gap-1.5 rounded-2xl rounded-bl-sm border border-borde bg-blanco px-4 py-3 shadow-xs"
                aria-label="Escribiendo respuesta"
              >
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cielo-profundo" />
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cielo-profundo [animation-delay:150ms]" />
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cielo-profundo [animation-delay:300ms]" />
              </span>
            )}
            <div ref={finRef} />
          </div>

          {/* Botón rápido de WhatsApp contextual */}
          <div className="border-t border-borde bg-blanco px-3 pt-2.5">
            <a
              href={whatsappHref(ultimoMensajeWa)}
              target="_blank"
              rel="noopener noreferrer"
              data-track-whatsapp="asistente-boton"
              className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#25D366] text-[14px] font-semibold text-noche shadow-xs transition-colors hover:bg-[#1FB955]"
            >
              <SocialIcon red="whatsapp" size={18} />
              Hablar por WhatsApp con un asesor
            </a>
          </div>

          {/* Formulario de entrada */}
          <form onSubmit={onSubmit} className="flex gap-2 bg-blanco p-3">
            <input
              ref={inputRef}
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              maxLength={300}
              placeholder="Escribe tu duda o idea…"
              aria-label="Tu pregunta"
              className="h-11 min-w-0 flex-1 rounded-xl border border-borde px-3.5 text-[14px] text-noche placeholder:text-niebla focus:border-cielo-profundo focus:outline-none"
            />
            <button
              type="submit"
              aria-label="Enviar pregunta"
              disabled={!texto.trim() || escribiendo}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-noche text-blanco transition-colors hover:bg-cielo-profundo disabled:opacity-40"
            >
              <SendHorizontal size={18} strokeWidth={1.75} aria-hidden />
            </button>
          </form>
        </div>
      )}

      {/* Botón flotante para abrir/cerrar */}
      <div className="fixed right-[calc(1.25rem+env(safe-area-inset-right))] bottom-[calc(1.25rem+env(safe-area-inset-bottom))] z-40 md:right-8 md:bottom-8">
        <div className="flex items-center gap-3">
          {!visto && !abierto && (
            <button
              type="button"
              onClick={abrir}
              className="hidden items-center gap-2 rounded-full border border-borde bg-blanco py-2 pr-4 pl-3.5 text-[14px] font-medium text-noche shadow-[0_8px_24px_rgba(11,13,18,0.10)] transition-transform hover:scale-105 sm:flex"
            >
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              ¿Dudas? Pregúntame
            </button>
          )}
          <button
            type="button"
            onClick={abrir}
            aria-label={abierto ? "Cerrar asistente" : "Abrir asistente de DevMart"}
            aria-expanded={abierto}
            aria-controls="asistente"
            className="group flex h-[60px] w-[60px] items-center justify-center rounded-full border border-white/20 bg-noche shadow-[0_12px_32px_rgba(11,13,18,0.25)] transition-transform duration-150 hover:scale-105 motion-reduce:transition-none"
          >
            {abierto ? (
              <X size={24} strokeWidth={1.5} className="text-blanco" aria-hidden />
            ) : (
              <Cube size={26} variant="dark" className="transition-transform duration-300 group-hover:-translate-y-0.5" />
            )}
          </button>
        </div>
      </div>
    </>
  );
}

/** Renderiza texto formateando negritas (`**texto**`) y listas (`• `) */
function TextoFormateado({ texto }: { texto: string }) {
  const lineas = texto.split("\n");

  return (
    <div className="flex flex-col gap-1.5 leading-[1.55]">
      {lineas.map((linea, idx) => {
        const limpia = linea.trim();
        if (!limpia) return null;

        // Renderizado de negritas con regex
        const partes = linea.split(/(\*\*[^*]+\*\*)/g);
        const contenido = partes.map((p, i) => {
          if (p.startsWith("**") && p.endsWith("**")) {
            return (
              <strong key={i} className="font-semibold text-noche">
                {p.slice(2, -2)}
              </strong>
            );
          }
          return <span key={i}>{p}</span>;
        });

        if (limpia.startsWith("• ")) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-1">
              <span className="text-cielo-profundo select-none font-bold">•</span>
              <span className="flex-1">{contenido}</span>
            </div>
          );
        }

        return <p key={idx}>{contenido}</p>;
      })}
    </div>
  );
}

/** Componente de burbuja de mensaje con soporte para links y formulario embebido de prospectos */
function Burbuja({
  m,
  onNavegar,
  onPreguntar,
}: {
  m: Mensaje;
  onNavegar: () => void;
  onPreguntar: (p: string) => void;
}) {
  if (m.de === "tu") {
    return (
      <p className="max-w-[85%] self-end rounded-2xl rounded-br-sm bg-cielo px-3.5 py-2.5 text-[14px] leading-[1.5] text-noche shadow-xs">
        {m.r.texto}
      </p>
    );
  }

  return (
    <div className="flex max-w-[90%] flex-col gap-2.5 self-start rounded-2xl rounded-bl-sm border border-borde bg-blanco p-3.5 text-[14px] text-texto-cuerpo shadow-xs">
      <TextoFormateado texto={m.r.texto} />

      {/* Formulario de captura rápida integrado en el chat */}
      {m.r.tipoAccion === "formulario_contacto" && (
        <FormularioLeadChat onCompletado={() => onPreguntar("¡Listo, ya envié mis datos!")} />
      )}

      {/* Enlaces de navegación */}
      {m.r.enlaces && m.r.enlaces.length > 0 && (
        <div className="mt-1 flex flex-col gap-1 border-t border-borde/70 pt-2 text-[13px]">
          {m.r.enlaces.map((e) =>
            e.externo ? (
              <a
                key={e.href}
                href={e.href}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-cielo-profundo transition-colors hover:text-noche"
              >
                {e.label} &rarr;
              </a>
            ) : (
              <Link
                key={e.href}
                href={e.href}
                onClick={onNavegar}
                className="font-medium text-cielo-profundo transition-colors hover:text-noche"
              >
                {e.label} &rarr;
              </Link>
            ),
          )}
        </div>
      )}
    </div>
  );
}

/** Formulario compacto para capturar leads directamente dentro de la burbuja */
function FormularioLeadChat({ onCompletado }: { onCompletado: () => void }) {
  const [nombre, setNombre] = useState("");
  const [contacto, setContacto] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  async function handleEnviar(e: FormEvent) {
    e.preventDefault();
    if (!nombre.trim() || !contacto.trim()) {
      setErrorMsg("Escribe tu nombre y tu contacto.");
      return;
    }
    setErrorMsg("");
    setEnviando(true);
    try {
      const res = await guardarLeadAsistenteAction({ nombre, contacto, mensaje });
      if (res.ok) {
        setEnviado(true);
        onCompletado();
      } else {
        setErrorMsg(res.mensaje);
      }
    } catch {
      setErrorMsg("Ocurrió un error. Intenta de nuevo.");
    } finally {
      setEnviando(false);
    }
  }

  if (enviado) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-[13px] text-emerald-800">
        <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />
        <span>¡Datos recibidos con éxito! Nos comunicaremos hoy mismo contigo.</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleEnviar} className="mt-1 flex flex-col gap-2 rounded-xl bg-nube p-3 border border-borde">
      <span className="text-[12px] font-semibold text-noche uppercase tracking-wider">
        {"// Déjanos tu idea"}
      </span>
      <input
        type="text"
        placeholder="Tu nombre *"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        className="h-9 rounded-lg border border-borde bg-blanco px-2.5 text-[13px] text-noche placeholder:text-niebla focus:border-cielo-profundo focus:outline-none"
      />
      <input
        type="text"
        placeholder="WhatsApp o Email *"
        value={contacto}
        onChange={(e) => setContacto(e.target.value)}
        className="h-9 rounded-lg border border-borde bg-blanco px-2.5 text-[13px] text-noche placeholder:text-niebla focus:border-cielo-profundo focus:outline-none"
      />
      <textarea
        rows={2}
        placeholder="Breve idea de tu proyecto (opcional)"
        value={mensaje}
        onChange={(e) => setMensaje(e.target.value)}
        className="resize-none rounded-lg border border-borde bg-blanco p-2.5 text-[13px] text-noche placeholder:text-niebla focus:border-cielo-profundo focus:outline-none"
      />
      {errorMsg && <span className="text-[12px] text-rose-600">{errorMsg}</span>}
      <button
        type="submit"
        disabled={enviando}
        className="flex h-9 items-center justify-center rounded-lg bg-noche text-[13px] font-semibold text-blanco transition-colors hover:bg-cielo-profundo disabled:opacity-50"
      >
        {enviando ? "Enviando…" : "Enviar para cotizar"}
      </button>
    </form>
  );
}
