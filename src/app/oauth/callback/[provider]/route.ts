import { and, eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { crearSesionCliente } from "@/lib/auth/cliente";
import { credenciales } from "@/lib/auth/config";
import { emailsVerificados, entradaDe, esProveedor, oauthDisponible, validarState, type OAuthProvider } from "@/lib/auth/oauth";
import { crearPasoPendiente, createSession } from "@/lib/auth/session";
import { db, hasDb, schema } from "@/lib/db";
import { huellaCliente, permitir, registrar, reiniciar } from "@/lib/security";
import { siteUrl } from "@/lib/site";

/**
 * Las cookies del panel son SameSite=Strict y esta respuesta llega en una navegación que empezó en
 * el proveedor: una redirección HTTP seguiría siendo «cross-site» y el navegador no enviaría la
 * sesión recién creada. Una recarga desde una página propia sí es una navegación del mismo sitio.
 */
function irA(ruta: string) {
  const html = `<!doctype html><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=${ruta}"><title>Entrando…</title><a href="${ruta}">Continuar</a>`;
  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}

export async function GET(req: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  const url = new URL(req.url);
  const state = url.searchParams.get("state") ?? "";
  const { ok, destino } = await validarState(state);
  const error = (code: string) => NextResponse.redirect(new URL(`${entradaDe(destino)}?error=${code}`, siteUrl));

  if (!esProveedor(provider)) return error("proveedor");
  if (!oauthDisponible(provider)) return error("no_configurado");
  if (url.searchParams.get("error")) return error("cancelado");
  const code = url.searchParams.get("code");
  if (!code || !state) return error("parametros");
  if (!ok) return error("state");

  return destino === "admin" ? entrarAlPanel(provider, code, error) : entrarAlPortal(provider, code, error);
}

type Error = (code: string) => NextResponse;

async function entrarAlPanel(p: OAuthProvider, code: string, error: Error) {
  const cfg = await credenciales();
  if (!cfg.ready) return error("sin_configurar");

  // Mismo límite que el login con contraseña: 5 intentos cada 15 minutos por conexión y 30 en total.
  const huella = await huellaCliente();
  const porCliente = `login:${huella}`;
  if (!(await permitir(porCliente, 5, 900)) || !(await permitir("login:global", 30, 900))) {
    await registrar("login.bloqueado", huella);
    return error("bloqueado");
  }

  const emails = await emailsVerificados(p, code);
  if (emails.length === 0) return error("perfil");
  if (!emails.includes(cfg.email)) {
    await registrar("login.oauth_email_incorrecto", `${p}:${emails[0]}`);
    return error("email");
  }

  // La cuenta social sustituye a la contraseña, no a la verificación en dos pasos.
  if (cfg.totpSecret) {
    await crearPasoPendiente();
    await registrar("login.oauth_paso_codigo", p);
    return irA("/admin/login?paso=codigo");
  }

  await reiniciar(porCliente);
  await createSession();
  await registrar("login.oauth", p);
  return irA("/admin");
}

async function entrarAlPortal(p: OAuthProvider, code: string, error: Error) {
  if (!hasDb) return error("sin_configurar");

  // Mismo límite que pedir el enlace por correo.
  const huella = await huellaCliente();
  if (!(await permitir(`portal:${huella}`, 5, 900)) || !(await permitir("portal:global", 60, 900))) {
    return error("bloqueado");
  }

  const emails = await emailsVerificados(p, code);
  if (emails.length === 0) return error("perfil");

  const [cliente] = await db()
    .select({ id: schema.clientes.id })
    .from(schema.clientes)
    .where(and(inArray(schema.clientes.email, emails), eq(schema.clientes.activo, true)))
    .limit(1);
  if (!cliente) {
    await registrar("portal.oauth_sin_cliente", `${p}:${emails[0]}`);
    return error("sin_acceso");
  }

  // La cookie del portal es SameSite=Lax: sí viaja en la redirección.
  await crearSesionCliente(cliente.id);
  await registrar("portal.ingreso", `cliente #${cliente.id} · ${p}`);
  return NextResponse.redirect(new URL("/portal", siteUrl));
}
