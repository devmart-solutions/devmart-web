import { initBotId } from "botid/client/core";

// Vercel BotID: verificación invisible contra bots en los formularios (server actions = POST a la página).
initBotId({
  protect: [
    { path: "/contacto", method: "POST" },
    { path: "/admin/login", method: "POST" },
    { path: "/admin/login/recuperar", method: "POST" },
    { path: "/admin/login/nueva", method: "POST" },
    { path: "/portal/ingreso", method: "POST" },
    { path: "/comunidad", method: "POST" },
  ],
});
