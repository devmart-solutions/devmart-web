import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  generarEmailHtml,
  emailEnlacePortalCliente,
  emailNuevoContacto,
  emailRecuperarAdmin,
  emailAvisoPortal,
} from "./email-templates";

describe("Plantillas de email transaccional", () => {
  it("generarEmailHtml escapa caracteres especiales en HTML", () => {
    const html = generarEmailHtml({
      titulo: 'Proyecto <script>alert("xss")</script> & más',
      cuerpo: ["Línea con <tag> & comillas '"],
    });

    assert.ok(!html.includes("<script>"));
    assert.ok(html.includes("&lt;script&gt;"));
    assert.ok(html.includes("&amp;"));
    assert.ok(html.includes("DevMart Solutions"));
  });

  it("emailEnlacePortalCliente genera asunto, texto plano y HTML con enlace válido", () => {
    const res = emailEnlacePortalCliente({
      nombre: "Carlos",
      url: "https://devmart.co/portal/acceso?token=abc123xyz",
      minutos: 15,
    });

    assert.ok(res.subject.includes("portal"));
    assert.ok(res.text.includes("https://devmart.co/portal/acceso?token=abc123xyz"));
    assert.ok(res.text.includes("15 minutos"));
    assert.ok(res.html.includes("https://devmart.co/portal/acceso?token=abc123xyz"));
    assert.ok(res.html.includes("Carlos"));
  });

  it("emailNuevoContacto incluye los datos del prospecto", () => {
    const res = emailNuevoContacto({
      nombre: "María Gómez",
      email: "maria@empresa.com",
      telefono: "+573001234567",
      tipo: "App móvil",
      presupuesto: "$10M - $20M",
      descripcion: "Queremos crear una app para pedidos en Cartagena.",
    });

    assert.ok(res.subject.includes("María Gómez"));
    assert.ok(res.text.includes("App móvil"));
    assert.ok(res.html.includes("maria@empresa.com"));
    assert.ok(res.html.includes("+573001234567"));
  });

  it("emailRecuperarAdmin genera enlace seguro y aviso de caducidad", () => {
    const res = emailRecuperarAdmin({
      url: "https://devmart.co/admin/login/nueva?token=secret123",
      minutos: 30,
    });

    assert.ok(res.subject.includes("Recuperar"));
    assert.ok(res.html.includes("30 minutos"));
    assert.ok(res.html.includes("https://devmart.co/admin/login/nueva?token=secret123"));
  });

  it("emailAvisoPortal genera aviso con botón opcional al portal", () => {
    const res = emailAvisoPortal({
      titulo: "Nuevo entregable listo",
      obraNombre: "Plataforma Logística",
      lineas: ["Se ha subido la versión v2 del prototipo para tu revisión."],
      url: "https://devmart.co/portal/entregables",
    });

    assert.ok(res.subject.includes("Nuevo entregable listo"));
    assert.ok(res.html.includes("Plataforma Logística"));
    assert.ok(res.html.includes("https://devmart.co/portal/entregables"));
  });
});
