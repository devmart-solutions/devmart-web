import { NextResponse, type NextRequest } from "next/server";
import { credenciales } from "@/lib/auth/config";
import { authUrl, crearState, entradaDe, esDestino, esProveedor, oauthDisponible } from "@/lib/auth/oauth";
import { hasDb } from "@/lib/db";
import { siteUrl } from "@/lib/site";

// Empieza el acceso con Google o GitHub. ?destino=portal para clientes; por defecto, el panel.
export async function GET(req: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  const pedido = req.nextUrl.searchParams.get("destino");
  const destino = esDestino(pedido) ? pedido : "admin";
  const error = (code: string) => NextResponse.redirect(new URL(`${entradaDe(destino)}?error=${code}`, siteUrl));

  if (!esProveedor(provider)) return error("proveedor");
  if (!oauthDisponible(provider)) return error("no_configurado");
  // Panel: sin contraseña creada la sesión no valdría (ver readSession). Portal: necesita la base de datos.
  if (destino === "admin" ? !(await credenciales()).ready : !hasDb) return error("sin_configurar");

  return NextResponse.redirect(authUrl(provider, await crearState(destino)));
}
