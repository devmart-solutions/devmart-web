import { site, siteUrl } from "./site";

type DatoFila = { etiqueta: string; valor: string };

type OpcionesPlantilla = {
  titulo: string;
  subtitulo?: string;
  cuerpo: string[];
  boton?: { texto: string; url: string };
  datos?: DatoFila[];
  pieNota?: string;
};

function escaparHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Genera un correo HTML moderno, responsive y compatible con la mayoría de clientes (Gmail, Outlook, Apple Mail).
 */
export function generarEmailHtml({
  titulo,
  subtitulo,
  cuerpo,
  boton,
  datos,
  pieNota,
}: OpcionesPlantilla): string {
  const parrafosHtml = cuerpo
    .map(
      (p) =>
        `<p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #2b313c;">${escaparHtml(p)}</p>`,
    )
    .join("");

  const datosHtml =
    datos && datos.length > 0
      ? `
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="width: 100%; margin: 20px 0; border-collapse: separate; border-spacing: 0; background-color: #f5f7fa; border-radius: 12px; border: 1px solid #dde2e9;">
      ${datos
        .map(
          (d, i) => `
        <tr>
          <td style="padding: 10px 16px; font-size: 13px; font-weight: 600; color: #4a5262; border-bottom: ${
            i === datos.length - 1 ? "none" : "1px solid #dde2e9"
          }; width: 35%;">${escaparHtml(d.etiqueta)}</td>
          <td style="padding: 10px 16px; font-size: 14px; color: #0b0d12; border-bottom: ${
            i === datos.length - 1 ? "none" : "1px solid #dde2e9"
          };">${escaparHtml(d.valor)}</td>
        </tr>
      `,
        )
        .join("")}
    </table>
  `
      : "";

  const botonHtml = boton
    ? `
    <div style="margin: 28px 0 24px 0; text-align: left;">
      <a href="${escaparHtml(boton.url)}" target="_blank" style="display: inline-block; background-color: #0b0d12; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 9999px; font-size: 14px; font-weight: 600; letter-spacing: -0.01em;">
        ${escaparHtml(boton.texto)} &rarr;
      </a>
      <p style="margin: 12px 0 0 0; font-size: 12px; color: #8a93a3; word-break: break-all;">
        Si el botón no funciona, copia este enlace en tu navegador:<br />
        <a href="${escaparHtml(boton.url)}" style="color: #1e8fd0;">${escaparHtml(boton.url)}</a>
      </p>
    </div>
  `
    : "";

  const pieNotaHtml = pieNota
    ? `<p style="margin: 20px 0 0 0; font-size: 12px; color: #8a93a3; line-height: 1.5;">${escaparHtml(pieNota)}</p>`
    : "";

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escaparHtml(titulo)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f7fa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="width: 100%; background-color: #f5f7fa; padding: 40px 16px;">
    <tr>
      <td align="center">
        <!-- Contenedor principal -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="max-width: 560px; width: 100%; background-color: #ffffff; border-radius: 16px; border: 1px solid #dde2e9; overflow: hidden; box-shadow: 0 4px 20px rgba(11, 13, 18, 0.04);">
          <!-- Cabecera -->
          <tr>
            <td style="padding: 28px 32px; background-color: #0b0d12; border-bottom: 3px solid #3ec1f3;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="width: 100%;">
                <tr>
                  <td>
                    <span style="color: #ffffff; font-size: 18px; font-weight: 700; letter-spacing: -0.02em;">${escaparHtml(site.name)}</span>
                    <span style="display: inline-block; margin-left: 8px; font-size: 11px; font-family: monospace; color: #3ec1f3; text-transform: uppercase;">// Cartagena</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Cuerpo -->
          <tr>
            <td style="padding: 36px 32px;">
              ${
                subtitulo
                  ? `<div style="font-family: monospace; font-size: 12px; color: #1e8fd0; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px;">${escaparHtml(subtitulo)}</div>`
                  : ""
              }
              <h1 style="margin: 0 0 20px 0; font-size: 22px; font-weight: 700; color: #0b0d12; letter-spacing: -0.03em;">${escaparHtml(titulo)}</h1>
              ${parrafosHtml}
              ${datosHtml}
              ${botonHtml}
              ${pieNotaHtml}
            </td>
          </tr>

          <!-- Pie -->
          <tr>
            <td style="padding: 20px 32px; background-color: #f5f7fa; border-top: 1px solid #dde2e9; font-size: 12px; color: #8a93a3; text-align: center;">
              <p style="margin: 0 0 4px 0;"><strong>${escaparHtml(site.name)}</strong> · Software a medida</p>
              <p style="margin: 0;">${site.city}, Colombia · <a href="${siteUrl}" style="color: #1e8fd0; text-decoration: none;">devmart.co</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** Plantilla para el enlace mágico del portal de clientes */
export function emailEnlacePortalCliente({
  nombre,
  url,
  minutos,
}: {
  nombre: string;
  url: string;
  minutos: number;
}) {
  const subject = "Tu enlace de acceso al portal · DevMart";
  const text = `Hola, ${nombre}.\n\nPara ingresar a tu portal de proyectos en DevMart, abre este enlace (válido por ${minutos} minutos y de un solo uso):\n\n${url}\n\nSi no lo solicitaste, puedes ignorar este mensaje.\n\n--\nDevMart Solutions\nCartagena, Colombia`;
  const html = generarEmailHtml({
    titulo: "Acceso a tu portal de proyectos",
    subtitulo: "// Portal de clientes",
    cuerpo: [
      `Hola, ${nombre}.`,
      `Haz clic en el botón siguiente para ingresar a tu espacio en DevMart. Podrás revisar avances, entregables, pagos y soporte de tu proyecto.`,
    ],
    boton: { texto: "Entrar a mi portal", url },
    pieNota: `Este enlace es de un solo uso y caduca en ${minutos} minutos por tu seguridad. Si no solicitaste este acceso, puedes ignorar este correo.`,
  });

  return { subject, text, html };
}

/** Plantilla para aviso de nuevo contacto en devmart.co */
export function emailNuevoContacto({
  nombre,
  email,
  telefono,
  tipo,
  presupuesto,
  descripcion,
}: {
  nombre: string;
  email: string;
  telefono: string;
  tipo: string;
  presupuesto: string;
  descripcion: string;
}) {
  const subject = `Nuevo mensaje de ${nombre} (${email})`;
  const text = `Nuevo mensaje desde devmart.co:\n\nNombre: ${nombre}\nEmail: ${email}\nTeléfono: ${telefono}\nTipo: ${tipo}\nPresupuesto: ${presupuesto}\n\nDescripción:\n${descripcion}\n\n--\nDevMart Solutions`;
  const html = generarEmailHtml({
    titulo: "Nuevo mensaje de contacto",
    subtitulo: "// Formulario devmart.co",
    cuerpo: [`Se ha recibido una nueva solicitud de cotización en el sitio web:`],
    datos: [
      { etiqueta: "Nombre", valor: nombre },
      { etiqueta: "Correo", valor: email },
      { etiqueta: "Teléfono", valor: telefono },
      { etiqueta: "Tipo de proyecto", valor: tipo },
      { etiqueta: "Presupuesto", valor: presupuesto },
      { etiqueta: "Descripción", valor: descripcion },
    ],
    boton: { texto: "Ver en panel de administración", url: `${siteUrl}/admin/mensajes` },
  });

  return { subject, text, html };
}

/** Plantilla para recuperación de contraseña de administrador */
export function emailRecuperarAdmin({ url, minutos }: { url: string; minutos: number }) {
  const subject = "Recuperar acceso al panel · DevMart";
  const text = `Solicitud para recuperar el acceso al panel de administración de DevMart.\n\nAbre este enlace para crear una contraseña nueva y un código QR nuevo (válido por ${minutos} minutos):\n\n${url}\n\nSi no lo solicitaste tú, ignora este mensaje.\n\n--\nDevMart Solutions`;
  const html = generarEmailHtml({
    titulo: "Recuperación de acceso al panel",
    subtitulo: "// Seguridad /admin",
    cuerpo: [
      "Hemos recibido una solicitud para restablecer el acceso al panel de administración de DevMart Solutions.",
      "Usa el botón a continuación para crear tu nueva contraseña y configurar tu aplicación de autenticación en dos pasos:",
    ],
    boton: { texto: "Crear nueva contraseña y 2FA", url },
    pieNota: `Este enlace caduca en ${minutos} minutos. Si no solicitaste restablecer el acceso, asegúrate de mantener tus credenciales a salvo y descarta este mensaje.`,
  });

  return { subject, text, html };
}

/** Enlace para entrar al panel sin contraseña (después se pide el código 2FA). */
export function emailEntrarAdmin({ url, minutos }: { url: string; minutos: number }) {
  const subject = "Tu enlace para entrar al panel · DevMart";
  const text = `Pediste entrar al panel de DevMart desde el acceso de clientes.

Abre este enlace (válido por ${minutos} minutos, un solo uso). Después te pediremos el código de tu app de autenticación:

${url}

Si no fuiste tú, ignora este mensaje: sin el código nadie puede entrar.

--
DevMart Solutions`;
  const html = generarEmailHtml({
    titulo: "Entrar al panel",
    subtitulo: "// Seguridad /admin",
    cuerpo: [
      "Pediste entrar al panel de DevMart desde el acceso de clientes.",
      "Usa el botón para continuar. Después te pediremos el código de tu app de autenticación.",
    ],
    boton: { texto: "Entrar al panel", url },
    pieNota: `Este enlace caduca en ${minutos} minutos y sirve una sola vez. Si no fuiste tú, ignora este mensaje: sin el código nadie puede entrar.`,
  });

  return { subject, text, html };
}

/** Plantilla para avisos de actividad en el portal (aprobaciones, soporte) */
export function emailAvisoPortal({
  titulo,
  obraNombre,
  lineas,
  url,
}: {
  titulo: string;
  obraNombre: string;
  lineas: string[];
  url?: string;
}) {
  const subject = `Aviso del portal: ${titulo}`;
  const text = `${titulo}\nProyecto: ${obraNombre}\n\n${lineas.join("\n")}${url ? `\n\nRevisar en: ${url}` : ""}\n\n--\nDevMart Solutions`;
  const html = generarEmailHtml({
    titulo,
    subtitulo: `// Proyecto: ${obraNombre}`,
    cuerpo: lineas,
    ...(url ? { boton: { texto: "Revisar en el portal", url } } : {}),
  });

  return { subject, text, html };
}
