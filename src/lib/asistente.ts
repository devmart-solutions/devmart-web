import { proceso, servicios } from "./content";
import { site, WHATSAPP_VISIBLE, whatsappHref } from "./site";

// Asistente del sitio: responde dudas frecuentes con el contenido del propio sitio.
// Funciona en modo heurístico ultrarrápido sin costo, con soporte para IA y captura de prospectos.

export type Enlace = { label: string; href: string; externo?: boolean };

export type Respuesta = {
  texto: string;
  enlaces?: Enlace[];
  sugerenciasSeguimiento?: string[];
  whatsappMensaje?: string;
  tipoAccion?: "formulario_contacto";
};

/** Botones de inicio sugeridos. */
export const sugerencias = [
  "¿Qué servicios ofrecen?",
  "¿Cuánto cuesta un proyecto?",
  "¿Cómo trabajan las etapas?",
  "¿Qué tecnologías usan?",
  "Ver proyectos reales",
  "Quiero cotizar mi idea",
];

export const saludo: Respuesta = {
  texto: `¡Hola! Soy el asistente virtual de **${site.name}**.\n\nPuedo responder tus dudas sobre nuestros servicios, metodologías, precios o tecnologías. ¿En qué te puedo ayudar hoy?`,
  sugerenciasSeguimiento: sugerencias,
  whatsappMensaje: "Hola DevMart, estuve en su sitio web y me gustaría hablar con un asesor.",
};

function enlacesContacto(mensajeWa?: string): Enlace[] {
  return [
    { label: `WhatsApp directo (${WHATSAPP_VISIBLE})`, href: whatsappHref(mensajeWa), externo: true },
    { label: "Formulario detallado de proyecto", href: "/contacto" },
    ...(site.email ? [{ label: site.email, href: `mailto:${site.email}`, externo: true }] : []),
  ];
}

type Intencion = {
  claves: string[];
  responder: () => Respuesta;
};

const intenciones: Intencion[] = [
  // 1. Cotizar / Dejar datos (activa formulario)
  {
    claves: ["cotiz", "presupuest", "quiero cotizar", "cotizarme", "dejar mis datos", "contacto directo", "hablar con asesor", "me contacten"],
    responder: () => ({
      texto: "¡Excelente iniciativa! Puedes dejar tus datos directamente aquí en el chat para que el equipo revise tu idea y te contacte hoy mismo, o escribirnos por WhatsApp:",
      tipoAccion: "formulario_contacto",
      enlaces: [
        { label: "Ir al formulario completo", href: "/contacto" },
        { label: "Escribir a WhatsApp", href: whatsappHref("Hola DevMart, quiero solicitar una cotización para un proyecto."), externo: true },
      ],
      sugerenciasSeguimiento: ["¿Cuánto tarda un desarrollo?", "¿Qué formas de pago manejan?", "¿Qué tecnologías usan?"],
      whatsappMensaje: "Hola DevMart, quiero solicitar una cotización para mi proyecto.",
    }),
  },

  // 2. Precios y costos
  {
    claves: ["precio", "cuesta", "cuanto", "valor", "costo", "cobran", "tarifa", "barato", "caro", "rango"],
    responder: () => ({
      texto:
        "Cada desarrollo es a la medida de tu negocio, por lo que **no manejamos tarifas genéricas**.\n\n" +
        "• Diseñamos una propuesta con alcance claro y cotización cerrada por etapas.\n" +
        "• Disponemos de un cotizador interactivo en la sección de Precios para evaluar la complejidad de tu proyecto.",
      enlaces: [
        { label: "Abrir cotizador interactivo", href: "/precios" },
        { label: "Solicitar cotización personalizada", href: "/contacto" },
      ],
      sugerenciasSeguimiento: ["¿Cómo se divide el pago?", "¿Cuánto tarda un proyecto?", "Quiero cotizar mi idea"],
      whatsappMensaje: "Hola DevMart, me gustaría conocer una estimación de precio para mi proyecto.",
    }),
  },

  // 3. Formas de pago y etapas
  {
    claves: ["forma de pago", "formas de pago", "como se paga", "anticipo", "cuotas", "etapas de pago", "hitos", "bancolombia"],
    responder: () => ({
      texto:
        "Trabajamos con un **esquema transparente por entregas e hitos**:\n\n" +
        "• Generalmente un anticipo inicial para iniciar diseño y arquitectura (50%).\n" +
        "• El saldo restante contra entrega y aprobación final en producción.\n" +
        "• En proyectos grandes, dividimos en hitos mensuales verificables desde el **Portal de Clientes**.",
      enlaces: [
        { label: "Conocer nuestro proceso", href: "/nosotros" },
        { label: "Hablar con nosotros", href: "/contacto" },
      ],
      sugerenciasSeguimiento: ["¿Cuánto cuesta un proyecto?", "¿Qué pasa con el código fuente?", "Quiero cotizar mi idea"],
      whatsappMensaje: "Hola DevMart, tengo dudas sobre cómo estructuran los pagos por etapas.",
    }),
  },

  // 4. Tecnologías y Stack
  {
    claves: ["tecnologia", "tecnologias", "stack", "lenguaje", "framework", "react", "next", "typescript", "postgres", "node", "python", "aws", "tailwind"],
    responder: () => ({
      texto:
        "Utilizamos tecnologías modernas de alto rendimiento orientadas a velocidad y escalabilidad:\n\n" +
        "• **Frontend & Web:** Next.js, React, TypeScript y Tailwind CSS.\n" +
        "• **Backend & Base de datos:** Node.js, Serverless Postgres (Neon), Drizzle ORM, APIs REST y GraphQL.\n" +
        "• **Móvil:** React Native / Progressive Web Apps (PWA).\n" +
        "• **Infraestructura:** Vercel, AWS y Cloudflare con estándares de seguridad bancaria.",
      enlaces: [
        { label: "Ver casos construidos", href: "/proyectos" },
        { label: "Explorar servicios", href: "/servicios" },
      ],
      sugerenciasSeguimiento: ["¿El código es mío?", "Ver proyectos reales", "¿Optimizan para SEO y velocidad?"],
      whatsappMensaje: "Hola DevMart, quisiera saber más sobre las tecnologías que recomiendan para mi idea.",
    }),
  },

  // 5. Tiempos de entrega
  {
    claves: ["tiempo", "demora", "tarda", "cuando", "semana", "meses", "plazo", "rapido", "entrega", "cronograma"],
    responder: () => ({
      texto:
        "El tiempo varía según la envergadura del software:\n\n" +
        "• **Landing page o sitio web:** 1 a 3 semanas.\n" +
        "• **Tienda online o portal administrativo:** 3 a 6 semanas.\n" +
        "• **Software a medida o app móvil:** 6 a 12 semanas por etapas.\n\n" +
        "Siempre entregamos un **prototipo interactivo navegable** en los primeros días para que pruebes la experiencia.",
      enlaces: [{ label: "Planear mi cronograma", href: "/contacto" }],
      sugerenciasSeguimiento: ["¿Cómo es el proceso?", "¿Qué tecnologías usan?", "Quiero cotizar mi idea"],
      whatsappMensaje: "Hola DevMart, tengo un plazo específico y me gustaría validar tiempos de entrega.",
    }),
  },

  // 6. Proceso de trabajo
  {
    claves: ["proceso", "como trabajan", "trabajan", "etapa", "metodolog", "pasos", "desarrollo"],
    responder: () => ({
      texto: `Trabajamos con una metodología ágil en 4 fases:\n\n${proceso
        .map((p, i) => `**${i + 1}. ${p.titulo}:** ${p.texto}`)
        .join("\n\n")}\n\nAdemás, tendrás acceso a nuestro **Portal de Clientes** para aprobar entregables en tiempo real.`,
      enlaces: [
        { label: "Conocer más sobre el equipo", href: "/nosotros" },
        { label: "Empezar un proyecto", href: "/contacto" },
      ],
      sugerenciasSeguimiento: ["Ver proyectos reales", "¿Cuánto cuesta un proyecto?", "¿Qué tecnologías usan?"],
      whatsappMensaje: "Hola DevMart, me interesa conocer más sobre su metodología de trabajo.",
    }),
  },

  // 7. Confidencialidad y Propiedad del código
  {
    claves: ["codigo", "propiedad", "dueno", "derechos", "fuente", "nda", "confidencialidad", "contrato", "seguridad"],
    responder: () => ({
      texto:
        "**El código y los datos son 100% tuyos:**\n\n" +
        "• Firmamos acuerdo de confidencialidad (NDA) antes de comenzar si tu idea lo requiere.\n" +
        "• Al concluir el proyecto te entregamos el repositorio, accesos a servidores y documentación completa.\n" +
        "• No hay letras pequeñas ni dependencias cautivas con nosotros.",
      enlaces: [
        { label: "Política de privacidad y datos", href: "/privacidad" },
        { label: "Hablar con el equipo", href: "/contacto" },
      ],
      sugerenciasSeguimiento: ["¿Cómo se divide el pago?", "¿Qué tecnologías usan?", "Quiero cotizar mi idea"],
      whatsappMensaje: "Hola DevMart, me gustaría conversar sobre un proyecto con acuerdo de confidencialidad.",
    }),
  },

  // 8. E-commerce y pasarelas de pago
  {
    claves: ["pago", "wompi", "pasarela", "tarjeta", "pse", "nequi", "vender", "ecommerce", "e-commerce", "tienda", "bold"],
    responder: () => ({
      texto:
        "Desarrollamos tiendas online de alta conversión preparadas para Colombia y Latinoamérica:\n\n" +
        "• Integración con **Wompi, PSE, tarjetas de crédito, Nequi y Daviplata**.\n" +
        "• Catálogo interactivo con carrito rápido y panel para gestionar productos y despachos.\n" +
        "• Notificaciones automáticas por correo y WhatsApp.",
      enlaces: [
        { label: "Ver servicio de Tiendas en línea", href: "/servicios#tiendas-en-linea" },
        { label: "Cotizar mi tienda virtual", href: "/contacto?tipo=Tienda%20en%20l%C3%ADnea" },
      ],
      sugerenciasSeguimiento: ["¿Cuánto demora una tienda?", "¿Cuánto cuesta una tienda?", "Quiero cotizar mi idea"],
      whatsappMensaje: "Hola DevMart, quiero crear una tienda en línea con pagos por Wompi o PSE.",
    }),
  },

  // 9. SEO y posicionamiento
  {
    claves: ["seo", "posicionamiento", "google", "buscador", "visitas", "velocidad", "core web vitals"],
    responder: () => ({
      texto:
        "Todos nuestros desarrollos se construyen con **SEO técnico nativo**:\n\n" +
        "• Renderizado del lado del servidor (SSR) para indexación inmediata en Google.\n" +
        "• Metadatos dinámicos OpenGraph y microdatos schema.org.\n" +
        "• Velocidad de carga sobresaliente (Core Web Vitals en verde en Google PageSpeed).",
      enlaces: [
        { label: "Ver nuestros proyectos", href: "/proyectos" },
        { label: "Solicitar cotización", href: "/contacto" },
      ],
      sugerenciasSeguimiento: ["¿Qué tecnologías usan?", "Ver proyectos reales", "Quiero cotizar mi idea"],
      whatsappMensaje: "Hola DevMart, me interesa una web optimizada para posicionar en Google.",
    }),
  },

  // 10. Autonomía y gestión de contenidos (CMS / Paneles)
  {
    claves: ["administrar", "panel", "cambiar", "actualizar", "editar", "contenido", "cms", "autonomia", "fotos"],
    responder: () => ({
      texto:
        "Creamos **paneles de administración sencillos y a medida**:\n\n" +
        "• Puedes editar textos, fotos, precios o artículos del blog sin tocar una sola línea de código.\n" +
        "• Acceso seguro protegido con autenticación de dos factores (2FA).\n" +
        "• Sin la sobrecarga ni vulnerabilidades de plugins pesados de WordPress.",
      enlaces: [
        { label: "Ver servicios de paneles", href: "/servicios#software-a-medida" },
        { label: "Hablar con un asesor", href: "/contacto" },
      ],
      sugerenciasSeguimiento: ["¿Cuánto cuesta un proyecto?", "¿Qué tecnologías usan?", "Quiero cotizar mi idea"],
      whatsappMensaje: "Hola DevMart, necesito un sitio web con panel autoadministrable.",
    }),
  },

  // 11. Rediseño y migración
  {
    claves: ["rediseño", "rediseno", "migrar", "actualizar web", "pagina vieja", "cambiar sitio", "wordpress"],
    responder: () => ({
      texto:
        "Modernizamos plataformas existentes sin perder tu posicionamiento:\n\n" +
        "• Auditoría de UX/UI y rendimiento de tu sitio actual.\n" +
        "• Migración de WordPress o sistemas antiguos a arquitecturas modernas (Next.js / React).\n" +
        "• Conservación de tus URLs y enlaces indexados en Google.",
      enlaces: [{ label: "Cuéntanos sobre tu sitio actual", href: "/contacto" }],
      sugerenciasSeguimiento: ["¿Cuánto tarda un proyecto?", "Ver proyectos reales", "Quiero cotizar mi idea"],
      whatsappMensaje: "Hola DevMart, tengo un sitio web actual que deseo rediseñar y modernizar.",
    }),
  },

  // 12. Portafolio y proyectos
  {
    claves: ["proyecto", "portafolio", "ejemplo", "caso", "cliente", "trabajos", "han hecho", "muestra"],
    responder: () => ({
      texto: "Puedes consultar casos reales con el reto de negocio, la solución tecnológica aplicada y los resultados alcanzados:",
      enlaces: [
        { label: "Explorar portafolio de proyectos", href: "/proyectos" },
        { label: "Ver servicios", href: "/servicios" },
      ],
      sugerenciasSeguimiento: ["¿Qué tecnologías usan?", "¿Cómo trabajan las etapas?", "Quiero cotizar mi idea"],
      whatsappMensaje: "Hola DevMart, estuve revisando sus proyectos y me interesa uno similar.",
    }),
  },

  // 13. Ubicación y trabajo a distancia
  {
    claves: ["donde", "ubicad", "cartagena", "ciudad", "oficina", "presencial", "remoto", "colombia", "bogota", "medellin"],
    responder: () => ({
      texto:
        `Nuestra sede principal está en **${site.city}, Colombia**, y trabajamos de manera ágil y 100% remota con empresas de toda Colombia y el exterior.\n\n` +
        "Coordinamos reuniones por Google Meet o Teams y compartimos avances semanales en el Portal.",
      enlaces: enlacesContacto("Hola DevMart, quisiera coordinar una llamada para presentar mi proyecto.").slice(0, 1),
      sugerenciasSeguimiento: ["¿Cómo es el proceso?", "Quiero cotizar mi idea", "Ver proyectos reales"],
      whatsappMensaje: "Hola DevMart, me gustaría agendar una reunión para hablar sobre un desarrollo.",
    }),
  },

  // 14. Servicios generales
  {
    claves: ["servicio", "hacen", "ofrecen", "web", "pagina", "app", "movil", "software", "sistema", "landing", "aplicacion"],
    responder: () => ({
      texto: `Construimos software moderno a medida:\n\n${servicios
        .map((s) => `• **${s.titulo}:** ${s.descripcion}`)
        .join("\n")}`,
      enlaces: [{ label: "Ver todos los servicios en detalle", href: "/servicios" }],
      sugerenciasSeguimiento: ["¿Cuánto cuesta un proyecto?", "¿Qué tecnologías usan?", "Quiero cotizar mi idea"],
      whatsappMensaje: "Hola DevMart, quiero información sobre los servicios de desarrollo.",
    }),
  },

  // 15. Soporte y mantenimiento
  {
    claves: ["soporte", "mantenimiento", "despues", "hosting", "dominio", "actualiz", "garantia"],
    responder: () => ({
      texto:
        "Al finalizar el desarrollo, no te dejamos solo:\n\n" +
        "• Brindamos garantía técnica posterior al lanzamiento.\n" +
        "• Te asesoramos con la configuración de dominio, hosting y certificados SSL.\n" +
        "• Ofrecemos planes de soporte continuo, evolución de funcionalidades y respaldos.",
      enlaces: enlacesContacto().slice(0, 2),
      sugerenciasSeguimiento: ["¿El código es mío?", "Quiero cotizar mi idea"],
      whatsappMensaje: "Hola DevMart, quisiera consultar sobre planes de mantenimiento y soporte.",
    }),
  },

  // 16. Contacto humano
  {
    claves: ["hablar", "humano", "persona", "whatsapp", "llamar", "contacto", "asesor", "correo", "email", "escribir", "numero", "telefono"],
    responder: () => ({
      texto: "¡Con gusto! Elige el canal que te resulte más cómodo para comunicarte con nuestro equipo:",
      enlaces: enlacesContacto(),
      sugerenciasSeguimiento: ["Quiero cotizar mi idea", "Ver proyectos reales", "¿Qué servicios ofrecen?"],
      whatsappMensaje: "Hola DevMart, deseo hablar directamente con un asesor sobre un proyecto.",
    }),
  },

  // 17. Saludo
  {
    claves: ["hola", "buenas", "buenos dias", "buenas tardes", "hey", "saludos", "que tal"],
    responder: () => ({
      texto: "¡Hola! Un gusto saludarte. ¿Tienes una idea o proyecto que te gustaría cotizar o conocer cómo lo construimos?",
      sugerenciasSeguimiento: ["¿Qué servicios ofrecen?", "¿Cuánto cuesta un proyecto?", "¿Cómo trabajan las etapas?"],
      whatsappMensaje: "Hola DevMart, quiero información sobre desarrollo de software.",
    }),
  },

  // 18. Despedida / Gracias
  {
    claves: ["gracias", "listo", "perfecto", "genial", "vale", "muchas gracias", "ok", "bien"],
    responder: () => ({
      texto: "¡A ti! Estamos a tu disposición para cuando desees dar el siguiente paso con tu idea.",
      enlaces: [{ label: "Empezar un proyecto", href: "/contacto" }],
      sugerenciasSeguimiento: ["Quiero cotizar mi idea", "Hablar con alguien"],
      whatsappMensaje: "Hola DevMart, estuve conversando con el asistente y quiero continuar por aquí.",
    }),
  },
];

const normalizar = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9ñ\s-]/g, " ");

/** Respuesta a una pregunta libre: la intención con más palabras clave encontradas. */
export function responder(pregunta: string): Respuesta {
  const texto = ` ${normalizar(pregunta)} `;
  let mejor: { puntos: number; i: Intencion } | null = null;
  for (const i of intenciones) {
    const puntos = i.claves.filter((c) => texto.includes(c)).length;
    if (puntos > 0 && (!mejor || puntos > mejor.puntos)) mejor = { puntos, i };
  }
  if (mejor) return mejor.i.responder();
  return {
    texto:
      "No estoy seguro de haber comprendido del todo esa pregunta. Nuestro equipo puede darte una respuesta detallada:",
    enlaces: enlacesContacto("Hola DevMart, tenía una duda en su sitio web que no encontré en el asistente."),
    sugerenciasSeguimiento: ["¿Qué servicios ofrecen?", "¿Cuánto cuesta un proyecto?", "Quiero cotizar mi idea"],
    whatsappMensaje: "Hola DevMart, tenía una consulta técnica que me gustaría revisar con ustedes.",
  };
}
