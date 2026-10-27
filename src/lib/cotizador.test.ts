import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { complejidad, tiposCotizador, funcionalidades, tamanos } from "./cotizador";

describe("Cotizador - Lógica de complejidad y opciones", () => {
  it("clasifica proyectos de hasta 3 puntos como Básico", () => {
    assert.deepEqual(complejidad(1), {
      nivel: "Básico",
      texto: "Un proyecto acotado que se puede lanzar rápido.",
    });
    assert.deepEqual(complejidad(3), {
      nivel: "Básico",
      texto: "Un proyecto acotado que se puede lanzar rápido.",
    });
  });

  it("clasifica proyectos entre 4 y 9 puntos como Intermedio", () => {
    assert.deepEqual(complejidad(4), {
      nivel: "Intermedio",
      texto: "Varias piezas que conviene planear por etapas.",
    });
    assert.deepEqual(complejidad(9), {
      nivel: "Intermedio",
      texto: "Varias piezas que conviene planear por etapas.",
    });
  });

  it("clasifica proyectos con 10 o más puntos como Avanzado", () => {
    assert.deepEqual(complejidad(10), {
      nivel: "Avanzado",
      texto: "Un producto completo: empezamos con un prototipo y entregas por etapas.",
    });
    assert.deepEqual(complejidad(25), {
      nivel: "Avanzado",
      texto: "Un producto completo: empezamos con un prototipo y entregas por etapas.",
    });
  });

  it("todos los tipos de proyecto tienen puntos válidos y formulario asignado", () => {
    assert.ok(tiposCotizador.length > 0);
    for (const tipo of tiposCotizador) {
      assert.ok(tipo.puntos > 0, `Tipo ${tipo.id} debe tener puntos positivos`);
      assert.ok(tipo.tipoFormulario.length > 0, `Tipo ${tipo.id} debe tener tipoFormulario`);
    }
  });

  it("todas las funcionalidades tienen puntos válidos", () => {
    assert.ok(funcionalidades.length > 0);
    for (const func of funcionalidades) {
      assert.ok(func.puntos > 0, `Funcionalidad ${func.id} debe tener puntos`);
    }
  });

  it("los tamaños de proyecto están ordenados por complejidad", () => {
    const orden = tamanos.map((t) => t.puntos);
    for (let i = 1; i < orden.length; i++) {
      assert.ok(orden[i] >= orden[i - 1], "El orden de puntos debe ser ascendente");
    }
  });
});
