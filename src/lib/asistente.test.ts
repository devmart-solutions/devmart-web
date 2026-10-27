import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { responder, sugerencias, saludo } from "./asistente";

describe("Asistente heurístico enriquecido", () => {
  it("contiene sugerencias iniciales y mensaje de saludo", () => {
    assert.ok(sugerencias.length >= 4);
    assert.ok(saludo.texto.includes("DevMart"));
    assert.ok(saludo.sugerenciasSeguimiento && saludo.sugerenciasSeguimiento.length > 0);
  });

  it("responde preguntas sobre precios y ofrece seguimiento", () => {
    const res = responder("¿Cuánto cuesta una página web?");
    assert.ok(res.texto.toLowerCase().includes("cotización") || res.texto.toLowerCase().includes("precios"));
    assert.ok(res.enlaces && res.enlaces.some((e) => e.href === "/precios"));
    assert.ok(res.sugerenciasSeguimiento && res.sugerenciasSeguimiento.length > 0);
  });

  it("activa formulario de cotización cuando el usuario quiere cotizar o dejar datos", () => {
    const res = responder("Quiero cotizar un proyecto para mi negocio");
    assert.equal(res.tipoAccion, "formulario_contacto");
    assert.ok(res.whatsappMensaje && res.whatsappMensaje.includes("cotización"));
  });

  it("responde sobre tecnologías y stack moderno", () => {
    const res = responder("¿Qué tecnologías o lenguajes usan?");
    assert.ok(res.texto.includes("Next.js") || res.texto.includes("React"));
    assert.ok(res.sugerenciasSeguimiento && res.sugerenciasSeguimiento.length > 0);
  });

  it("responde sobre propiedad del código y acuerdos de confidencialidad NDA", () => {
    const res = responder("¿Firman NDA o entregan el código fuente?");
    assert.ok(res.texto.toLowerCase().includes("código") && res.texto.toLowerCase().includes("100%"));
  });

  it("responde preguntas sobre SEO y posicionamiento en Google", () => {
    const res = responder("¿La página está optimizada para SEO y Google?");
    assert.ok(res.texto.includes("SEO"));
  });

  it("ofrece contacto directo para preguntas desconocidas", () => {
    const res = responder("xyz123 no entiendo nada de esto");
    assert.ok(res.texto.toLowerCase().includes("equipo"));
    assert.ok(res.enlaces && res.enlaces.length > 0);
  });
});
