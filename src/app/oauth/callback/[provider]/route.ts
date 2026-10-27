import { NextResponse } from "next/server";
import { crearSesionCliente, cuentaDesdeOAuth } from "@/lib/auth/cliente";
import { credenciales } from "@/lib/auth/config";
import { entradaDe, esProveedor, oauthDisponible, perfilOAuth, validarState, type OAuthProvider, type PerfilOAuth } from "@/lib/auth/oauth";
import { crearPasoPendiente, createSession } from "@/lib/auth/session";
import { hasDb } from "@/lib/db";
import { avisarAdmin } from "@/lib/portal/avisos";
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

type Error = (code: string) => NextResponse;

export async function GET(req: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  const url = new URL(req.url);
  const state = url.searchParams.get("state") ?? "";
  const { ok, destino } = await validarState(state);
  const error: Error = (code) => NextResponse.redirect(new URL(`${entradaDe(destino)}?error=${code}`, siteUrl));

  if (!esProveedor(provider)) return error("proveedor");
  if (!oauthDisponible(provider)) return error("no_configurado");
  if (url.searchParams.get("error")) return error("cancelado");
  const code = url.searchParams.get("code");
  if (!code || !state) return error("parametros");
  if (!ok) return error("state");

  // Mismo límite que el login del panel (5 cada 15 min por conexión, 30 en total) o que pedir el
  // enlace del portal, según desde dónde se entra.
  const huella = await huellaCliente();
  const porCliente = destino === "admin" ? `login:${huella}` : `portal:${huella}`;
  const global = destino === "admin" ? (["login:global", 30] as const) : (["portal:global", 60] as const);
  if (!(await permitir(porCliente, 5, 900)) || !(await permitir(global[0], global[1], 900))) {
    await registrar(destino === "admin" ? "login.bloqueado" : "portal.bloqueado", huella);
    return error("bloqueado");
  }

  const perfil = await perfilOAuth(provider, code);
  if (perfil.emails.length === 0) return error("perfil");

  // La cuenta del administrador entra al panel venga de donde venga (con el código 2FA si lo hay).
  const cfg = await credenciales();
  if (cfg.ready && perfil.emails.includes(cfg.email)) return entrarAlPanel(provider, porCliente, Boolean(cfg.totpSecret));
  if (destino === "admin") {
    await registrar("login.oauth_email_incorrecto", `${provider}:${perfil.emails[0]}`);
    return error("email");
  }
  return entrarAlPortal(provider, perfil, error);
}

async function entrarAlPanel(p: OAuthProvider, porCliente: string, con2fa: boolean) {
  // La cuenta social sustituye a la contraseña, no a la verificación en dos pasos.
  if (con2fa) {
    await crearPasoPendiente();
    await registrar("login.oauth_paso_codigo", p);
    return irA("/admin/login?paso=codigo");
  }
  await reiniciar(porCliente);
  await createSession();
  await registrar("login.oauth", p);
  return irA("/admin");
}

async function entrarAlPortal(p: OAuthProvider, perfil: PerfilOAuth, error: Error) {
  if (!hasDb) return error("sin_configurar");

  // Cliente existente: entra. Nuevo: se le crea la cuenta (es su forma de registrarse).
  const cuenta = await cuentaDesdeOAuth(perfil.emails, perfil.nombre);
  if (cuenta.estado === "inactiva") return error("inactiva");

  // La cookie del portal es SameSite=Lax: sí viaja en la redirección.
  await crearSesionCliente(cuenta.clienteId);
  if (cuenta.estado === "creada") {
    await registrar("portal.registro", `cliente #${cuenta.clienteId} · ${p}`);
    await avisarAdmin(`Nuevo registro en el portal: ${perfil.nombre || perfil.emails[0]}`, [
      `Nombre: ${perfil.nombre || "(sin nombre)"}`,
      `Email: ${perfil.emails[0]} (verificado por ${p === "google" ? "Google" : "GitHub"})`,
      "",
      "Aún no tiene proyectos. Créale una obra desde el panel cuando empiecen a trabajar juntos.",
    ]);
  } else {
    await registrar("portal.ingreso", `cliente #${cuenta.clienteId} · ${p}`);
  }
  return NextResponse.redirect(new URL("/portal", siteUrl));
}
