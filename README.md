# DevMart Solutions · Sitio web

Sitio corporativo de **DevMart Solutions**, empresa de software a medida en Cartagena de Indias, Colombia, con panel de administración en `/admin`.

Construido con **Next.js 16** (App Router, Cache Components, React Compiler), **TypeScript**, **Tailwind CSS v4**, **Postgres en Neon** (con Drizzle ORM) y desplegado en **Vercel**.

## Empezar

```bash
npm install
vercel env pull .env.local                          # trae DATABASE_URL y demás variables de Vercel
npm run admin:setup -- --local --email tu@correo.com   # acceso al panel solo para desarrollo
npm run dev                                         # http://localhost:3000
```

Otros comandos:

| Comando | Qué hace |
| --- | --- |
| `npm run build` | Compila para producción |
| `npm run start` | Sirve la compilación de producción |
| `npm run lint` | Revisa el código con ESLint |
| `npm test` | Ejecuta las pruebas unitarias con Node.js y tsx |
| `npm run db:push` | Aplica `src/lib/db/schema.ts` a la base de datos |
| `npm run db:seed` | Copia el contenido inicial (blog, proyectos, precios) a la base de datos, sin duplicar |
| `npm run admin:setup` | Crea o cambia el acceso al panel (ver más abajo) |

> Next.js 16 cambia varias APIs respecto a versiones anteriores. Antes de tocar código, consulta la documentación incluida en `node_modules/next/dist/docs/` (ver `AGENTS.md`).

## Estructura

```
src/
  app/
    (sitio)/             Sitio público (Inicio, Servicios, Proyectos, Blog, Precios, Contacto…)
    admin/login/         Inicio de sesión del panel
    admin/(panel)/       Panel: resumen, mensajes, blog, proyectos, precios, actividad
    opengraph-image.tsx, sitemap.ts, robots.ts, apple-icon.tsx
  proxy.ts               Redirige /admin al login si no hay cookie de sesión
  instrumentation-client.ts  Vercel BotID en los formularios
  components/            Interfaz del sitio; components/admin/ para el panel
  content/blog/          Artículos iniciales en Markdown (semilla de la base de datos)
  lib/
    data.ts              Lectura del contenido público (con caché e invalidación por etiquetas)
    db/                  Conexión y esquema de la base de datos
    admin/               Consultas y acciones del panel
    auth/                Sesión, contraseña, 2FA y capa de acceso (requireAdmin)
    security.ts          Límite de intentos y registro de actividad
    site.ts              Nombre, ciudad, URL, email y WhatsApp
    content.ts, blog.ts  Contenido inicial y respaldo si no hay base de datos
scripts/                 seed.ts y admin-setup.ts
```

Los colores y estilos de marca (Noche, Cielo, Nube…) están definidos como tokens en `src/app/globals.css`.

## Panel de administración (`/admin`)

- **Mensajes**: cada envío del formulario de contacto queda guardado. Puedes marcar el estado (nuevo, en conversación, cerrado, descartado), añadir notas internas y responder por WhatsApp, email o teléfono.
- **Blog**: crear, editar, ocultar y eliminar artículos (Markdown con vista previa).
- **Proyectos** y **Precios**: editar los casos y las tarjetas de precios.
- **Actividad**: inicios de sesión (también los fallidos) y cada cambio.

Los cambios se publican al guardar: las páginas públicas están en caché y el panel las invalida (`updateTag`).

### Crear o cambiar el acceso

```bash
npm run admin:setup -- --email tu@correo.com
```

El script genera una contraseña segura y la muestra **una sola vez**, genera el secreto de verificación en dos pasos y muestra el código QR para Google Authenticator, Microsoft Authenticator o 1Password, y guarda solo el hash en `.env.local` y en Vercel (producción y preview). Después hay que volver a desplegar.

Ejecutarlo otra vez cambia la contraseña y cierra todas las sesiones abiertas. Opciones: `--local` (no toca Vercel) y `--sin-2fa`.

## Seguridad

| Medida | Dónde |
| --- | --- |
| Contraseña con hash scrypt y verificación en dos pasos (TOTP) | `src/lib/auth/` |
| Sesión en cookie cifrada (iron-session), `httpOnly`, `Secure`, `SameSite=Strict`, prefijo `__Host-`, 8 horas | `src/lib/auth/session.ts` |
| Cerrar sesión revoca todas las sesiones; cambiar la contraseña también | `session.ts` |
| Cada página y cada acción del panel verifica la sesión en el servidor (no solo el proxy) | `requireAdmin()` |
| Límite de intentos: login 5 cada 15 min por conexión y 30 en total; formulario 5 cada 10 min | `src/lib/security.ts` |
| Vercel BotID contra bots en login y formulario | `instrumentation-client.ts`, `src/lib/botid.ts` |
| Validación de toda la entrada del panel con zod; Markdown sin HTML crudo | `src/lib/admin/actions.ts`, `Markdown.tsx` |
| Cabeceras: CSP, HSTS, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy, COOP | `next.config.ts` |
| `/admin` fuera de buscadores (`noindex`, `robots.txt`) y sin caché compartida | `next.config.ts`, `robots.ts` |
| Las IP nunca se guardan en claro (solo una huella con sal) | `security.ts` |
| Dependabot (alertas y PR de seguridad) y CI con lint, compilación y `npm audit` | `.github/` |

Recomendado en el panel de Vercel: activar **BotID Deep Analysis** (Firewall → Configure) y dejar la **Deployment Protection** de las vistas previas activada.

## Variables de entorno

Ver `.env.example`.

| Variable | Para qué sirve |
| --- | --- |
| `DATABASE_URL`, `DATABASE_URL_UNPOOLED` | Base de datos Neon (las crea la integración de Vercel). Sin ellas el sitio usa el contenido estático y el panel no funciona. |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`, `ADMIN_TOTP_SECRET`, `SESSION_SECRET` | Acceso al panel. Las genera `npm run admin:setup`. |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` | Acceso con Google y GitHub al panel (después pide el código 2FA) y al portal (entra el cliente cuyo email verificado coincida; si no tiene cuenta, se le crea). URL de retorno: `<sitio>/oauth/callback/google` y `/oauth/callback/github`. Opcional. |
| `NEXT_PUBLIC_SITE_URL` | URL pública (sitemap, Open Graph, JSON-LD). Sin ella se usa `http://localhost:3000`. |
| `NEXT_PUBLIC_EMAIL` | Email de contacto que se muestra en el sitio. |
| `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL` | Aviso por email de cada mensaje (Resend). Opcional: los mensajes ya quedan en el panel. |
| `FORMSPREE_ENDPOINT` | Alternativa a Resend. |
| `NEXT_PUBLIC_GA_ID` | Google Analytics 4. Se carga solo si la persona acepta las cookies. |
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN`, `NEXT_PUBLIC_PLAUSIBLE_SRC` | Plausible (sin cookies, no muestra aviso). |

Las variables se incorporan al compilar: después de cambiarlas hay que volver a desplegar.

## Analítica y eventos

Además de las visitas, se registran estos eventos (en GA4 y Plausible):

| Evento | Cuándo |
| --- | --- |
| `whatsapp_click` | Clic en cualquier botón de WhatsApp (propiedad `ubicacion`) |
| `contact_submit` | Envío correcto del formulario (propiedad `tipo`) |
| `cotizador_enviado` | Envío del resumen del cotizador (propiedades `canal`, `tipo`, `nivel`) |

En Plausible hay que crear cada evento como *Goal* para verlo en el panel.

## Despliegue

Vercel despliega cada push a `main` a producción y cada rama a una vista previa. Producción: https://devmart-web-dun.vercel.app

Después de publicar con el dominio definitivo:

1. Define `NEXT_PUBLIC_SITE_URL` y vuelve a desplegar.
2. Verifica el dominio en [Google Search Console](https://search.google.com/search-console) y envía `https://<dominio>/sitemap.xml`.
3. Prueba los datos estructurados con el [Rich Results Test](https://search.google.com/test/rich-results).

## Pendientes

- Dominio, email y número de WhatsApp Business.
- Rangos de precios y de presupuesto del formulario (confirmar con DevMart).
- Capturas reales de proyectos y foto del equipo.
- Resultado real del caso Eliab Bohorquez Perfumería.
- Revisión legal de `/privacidad`.
