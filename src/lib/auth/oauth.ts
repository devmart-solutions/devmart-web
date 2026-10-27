import "server-only";
import { randomBytes, timingSafeEqual } from "node:crypto";
import { sealData, unsealData } from "iron-session";
import { cookies } from "next/headers";
import { siteUrl } from "@/lib/site";
import { adminConfig } from "./config";

// Acceso con Google y GitHub para el panel (/admin) y el portal de clientes (/portal).
// Flujo: /oauth/[provider]?destino=… → proveedor → /oauth/callback/[provider]
// Una sola URL de retorno por proveedor (GitHub solo admite una por app): el destino viaja en el
// `state`, un sello de iron-session (5 min, firmado con SESSION_SECRET) con un nonce aleatorio.
// El mismo nonce vive en una cookie del navegador que empezó el flujo, así un state solo vale en
// ese navegador y una sola vez.

export type OAuthProvider = "google" | "github";
export type OAuthDestino = "admin" | "portal";

const PROVEEDORES: readonly string[] = ["google", "github"] satisfies OAuthProvider[];

export const esProveedor = (p: string): p is OAuthProvider => PROVEEDORES.includes(p);
export const esDestino = (d: unknown): d is OAuthDestino => d === "admin" || d === "portal";

/** Pantalla de entrada de cada destino (a donde vuelve un error). */
export const entradaDe = (destino: OAuthDestino) => (destino === "portal" ? "/portal/ingreso" : "/admin/login");

/** URL de retorno que hay que registrar en Google Cloud y en la app OAuth de GitHub. */
export const oauthRedirectUri = (p: OAuthProvider) => `${siteUrl}/oauth/callback/${p}`;

type StateData = { nonce: string; destino: OAuthDestino; exp: number };

const STATE_TTL = 5 * 60; // 5 min in seconds

// SameSite=Lax (no Strict): the callback arrives as a top-level navigation from the provider.
const NONCE_COOKIE = "dm_oauth_nonce";
const nonceCookie = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/oauth",
};

function secret() {
  const s = adminConfig().sessionSecret;
  if (s.length < 32) throw new Error("Falta SESSION_SECRET.");
  return s;
}

/** Crea un `state` sellado para el parámetro OAuth (CSRF) y guarda su nonce en este navegador. */
export async function crearState(destino: OAuthDestino): Promise<string> {
  const data: StateData = { nonce: randomBytes(16).toString("hex"), destino, exp: Date.now() + STATE_TTL * 1000 };
  (await cookies()).set(NONCE_COOKIE, `${destino}.${data.nonce}`, { ...nonceCookie, maxAge: STATE_TTL });
  return sealData(data, { password: secret(), ttl: STATE_TTL });
}

/**
 * Valida que el `state` sea auténtico, no haya caducado y lo haya iniciado este navegador. Sirve una vez.
 * `destino` sale de la cookie aunque el state no valga, para devolver el error a la pantalla correcta.
 */
export async function validarState(state: string): Promise<{ ok: boolean; destino: OAuthDestino }> {
  const jar = await cookies();
  const [cookieDestino, guardado = ""] = (jar.get(NONCE_COOKIE)?.value ?? "").split(".");
  jar.set(NONCE_COOKIE, "", { ...nonceCookie, maxAge: 0 });
  const destino = esDestino(cookieDestino) ? cookieDestino : "admin";
  try {
    const data = await unsealData<Partial<StateData>>(state, { password: secret() });
    if (typeof data.nonce !== "string" || typeof data.exp !== "number" || data.exp <= Date.now()) return { ok: false, destino };
    if (data.destino !== destino) return { ok: false, destino };
    const a = Buffer.from(data.nonce);
    const b = Buffer.from(guardado);
    return { ok: a.length === b.length && timingSafeEqual(a, b), destino };
  } catch {
    return { ok: false, destino };
  }
}

/** URL del proveedor a la que se envía a la persona. */
export function authUrl(p: OAuthProvider, state: string): string {
  if (p === "google") {
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      redirect_uri: oauthRedirectUri(p),
      response_type: "code",
      scope: "openid email",
      state,
      access_type: "online",
      prompt: "select_account",
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  }
  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID ?? "",
    redirect_uri: oauthRedirectUri(p),
    scope: "user:email",
    state,
    allow_signup: "false",
  });
  return `https://github.com/login/oauth/authorize?${params}`;
}

/** Emails verificados de la cuenta (en minúsculas). Vacío si algo falla. */
export function emailsVerificados(p: OAuthProvider, code: string): Promise<string[]> {
  return p === "google" ? googleEmails(code) : githubEmails(code);
}

// ───────── Google ─────────

async function googleEmails(code: string): Promise<string[]> {
  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID ?? "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
        redirect_uri: oauthRedirectUri("google"),
        grant_type: "authorization_code",
      }),
    });
    if (!tokenRes.ok) return [];
    const tokenJson = (await tokenRes.json()) as { id_token?: string };
    if (!tokenJson.id_token) return [];
    // Decode the JWT payload (we already exchanged the code — no need to verify the signature here,
    // the token came directly from Google's token endpoint over HTTPS).
    const payload = JSON.parse(Buffer.from(tokenJson.id_token.split(".")[1], "base64url").toString()) as {
      email?: string;
      email_verified?: boolean;
    };
    if (!payload.email || !payload.email_verified) return [];
    return [payload.email.toLowerCase()];
  } catch {
    return [];
  }
}

// ───────── GitHub ─────────

async function githubEmails(code: string): Promise<string[]> {
  try {
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID ?? "",
        client_secret: process.env.GITHUB_CLIENT_SECRET ?? "",
        code,
        redirect_uri: oauthRedirectUri("github"),
      }),
    });
    if (!tokenRes.ok) return [];
    const tokenJson = (await tokenRes.json()) as { access_token?: string };
    if (!tokenJson.access_token) return [];

    const emailRes = await fetch("https://api.github.com/user/emails", {
      headers: { Authorization: `Bearer ${tokenJson.access_token}`, "User-Agent": "DevMart-Web" },
    });
    if (!emailRes.ok) return [];
    // Todos los verificados, no solo el principal: un cliente puede tener en GitHub otro email
    // principal distinto del que usa con nosotros.
    const emails = (await emailRes.json()) as { email: string; primary: boolean; verified: boolean }[];
    return emails.filter((e) => e.verified).map((e) => e.email.toLowerCase());
  } catch {
    return [];
  }
}

/** Verdadero si el proveedor está configurado con las variables de entorno correctas. */
export function oauthDisponible(provider: OAuthProvider): boolean {
  if (provider === "google") return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  if (provider === "github") return Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET);
  return false;
}
