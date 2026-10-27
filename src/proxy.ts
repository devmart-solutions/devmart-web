import { NextResponse, type NextRequest } from "next/server";
import { CLIENTE_COOKIE, SESSION_COOKIE } from "@/lib/auth/constants";

// Comprobación optimista: sin la cookie de sesión correspondiente, /admin y /portal llevan a su
// pantalla de entrada. La verificación real la hacen requireAdmin() y requireCliente() en cada
// página y acción.
const PORTAL_PUBLICO = ["/portal/ingreso", "/portal/acceso", "/portal/registro", "/portal/recuperar", "/portal/clave"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/portal" || pathname.startsWith("/portal/")) {
    // Entrar, registrarse, recuperar la contraseña y abrir un enlace no requieren sesión.
    if (PORTAL_PUBLICO.some((ruta) => pathname.startsWith(ruta))) return NextResponse.next();
    if (!request.cookies.has(CLIENTE_COOKIE)) return NextResponse.redirect(new URL("/portal/ingreso", request.url));
    return NextResponse.next();
  }

  // Entrar, recuperar la contraseña y crear una nueva no requieren sesión.
  if (pathname === "/admin/login" || pathname.startsWith("/admin/login/")) return NextResponse.next();
  if (!request.cookies.has(SESSION_COOKIE)) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/portal", "/portal/:path*"],
};
