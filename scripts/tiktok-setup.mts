// Conecta la cuenta de TikTok (@devmart.co) para que sus videos entren solos al muro /comunidad.
// Se hace una vez (y otra si pasan 365 días sin que el sitio lea TikTok):
//   1. abre en el navegador el enlace que muestra el script e inicia sesión con @devmart.co,
//   2. TikTok te lleva a TIKTOK_REDIRECT_URI (puede dar 404, no importa): copia la dirección completa,
//   3. pégala aquí. El script cambia el código por el refresh token y lo guarda en la tabla `ajustes`.
// No muestra ningún token en pantalla.
//
// Uso:  npm run tiktok:setup
// Necesita en .env.local: TIKTOK_CLIENT_KEY, TIKTOK_CLIENT_SECRET, TIKTOK_REDIRECT_URI y DATABASE_URL.
import { randomBytes } from "node:crypto";
import { createInterface } from "node:readline/promises";
import nextEnv from "@next/env";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../src/lib/db/schema";

nextEnv.loadEnvConfig(process.cwd());
const { TIKTOK_CLIENT_KEY: clientKey, TIKTOK_CLIENT_SECRET: clientSecret, TIKTOK_REDIRECT_URI: redirectUri, DATABASE_URL: dbUrl } =
  process.env;
const faltan = Object.entries({ TIKTOK_CLIENT_KEY: clientKey, TIKTOK_CLIENT_SECRET: clientSecret, TIKTOK_REDIRECT_URI: redirectUri, DATABASE_URL: dbUrl })
  .filter(([, v]) => !v)
  .map(([k]) => k);
if (faltan.length) {
  console.error(`Faltan en .env.local: ${faltan.join(", ")}`);
  process.exit(1);
}

const CLAVE = "tiktok_refresh"; // la misma que CLAVE_TIKTOK_REFRESH en src/lib/tiktok.ts
const state = randomBytes(16).toString("hex");
const auth = new URL("https://www.tiktok.com/v2/auth/authorize/");
auth.search = new URLSearchParams({
  client_key: clientKey!,
  scope: "user.info.basic,video.list",
  response_type: "code",
  redirect_uri: redirectUri!,
  state,
}).toString();

console.log("\n1. Abre este enlace e inicia sesión con @devmart.co:\n");
console.log(`   ${auth}\n`);
const rl = createInterface({ input: process.stdin, output: process.stdout });
const vuelta = (await rl.question("2. Pega aquí la dirección completa a la que te llevó TikTok:\n   ")).trim();
rl.close();

let params: URLSearchParams;
try {
  params = new URL(vuelta).searchParams;
} catch {
  console.error("Eso no es una dirección válida.");
  process.exit(1);
}
if (params.get("error")) {
  console.error(`TikTok devolvió un error: ${params.get("error")} ${params.get("error_description") ?? ""}`);
  process.exit(1);
}
if (params.get("state") !== state) {
  console.error("La dirección no corresponde a este intento (state distinto). Vuelve a ejecutar el script.");
  process.exit(1);
}
const code = params.get("code");
if (!code) {
  console.error("La dirección no trae el parámetro code.");
  process.exit(1);
}

const res = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({
    client_key: clientKey!,
    client_secret: clientSecret!,
    code,
    grant_type: "authorization_code",
    redirect_uri: redirectUri!,
  }),
});
const tok = (await res.json()) as {
  access_token?: string;
  refresh_token?: string;
  refresh_expires_in?: number;
  scope?: string;
  error?: string;
  error_description?: string;
};
if (!res.ok || !tok.refresh_token || !tok.access_token) {
  console.error(`No se pudo obtener el token: ${tok.error ?? res.status} ${tok.error_description ?? ""}`);
  process.exit(1);
}
if (!tok.scope?.includes("video.list")) {
  console.error(`La autorización no incluye video.list (scopes: ${tok.scope}). Revisa los scopes de la app.`);
  process.exit(1);
}

const db = drizzle(neon(dbUrl!), { schema });
await db
  .insert(schema.ajustes)
  .values({ clave: CLAVE, valor: tok.refresh_token })
  .onConflictDoUpdate({ target: schema.ajustes.clave, set: { valor: tok.refresh_token } });
const dias = Math.round((tok.refresh_expires_in ?? 0) / 86400);
console.log(`\n✓ Refresh token guardado en ajustes (${CLAVE}), válido ${dias} días.`);

// Prueba: cuántos videos ve la API.
const lista = await fetch("https://open.tiktokapis.com/v2/video/list/?fields=id", {
  method: "POST",
  headers: { Authorization: `Bearer ${tok.access_token}`, "Content-Type": "application/json" },
  body: JSON.stringify({ max_count: 20 }),
});
const videos = ((await lista.json()) as { data?: { videos?: unknown[] } }).data?.videos ?? [];
console.log(`✓ La API devuelve ${videos.length} videos de la cuenta.`);
console.log("  El muro los mostrará en la próxima hora (o al reiniciar `npm run dev`).");
