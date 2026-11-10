// Contenido del sitio. Los textos marcados como «pendiente» deben confirmarse con DevMart.

export type Servicio = {
  slug: string;
  titulo: string;
  resumen: string;
  descripcion: string;
  entregables: string[];
  tecnologias: string[];
};

export const servicios: Servicio[] = [
  {
    slug: "desarrollo-web",
    titulo: "Desarrollo web",
    resumen: "Sitios y aplicaciones web rápidas, claras y fáciles de administrar.",
    descripcion:
      "Desde una página para presentar tu negocio hasta una aplicación web completa con usuarios, pagos e integraciones. Diseño propio, adaptado a móvil y pensado para que te encuentren en Google.",
    entregables: [
      "Prototipo navegable antes de programar",
      "Sitio adaptado a móvil, tableta y escritorio",
      "SEO técnico básico y analítica",
      "Publicación en tu dominio",
    ],
    tecnologias: ["Next.js", "React", "TypeScript", "Tailwind CSS"],
  },
  {
    slug: "apps-moviles",
    titulo: "Apps móviles",
    resumen: "Aplicaciones para Android e iOS con una sola base de código.",
    descripcion:
      "Llevamos tu idea al bolsillo de tus clientes: apps que funcionan en Android e iOS, conectadas a tu propio servidor y listas para publicar en las tiendas.",
    entregables: [
      "Prototipo navegable de las pantallas clave",
      "App para Android e iOS",
      "Servidor y base de datos (si la app lo necesita)",
      "Acompañamiento en la publicación en las tiendas",
    ],
    tecnologias: ["React Native", "Expo", "Node.js", "TypeScript"],
  },
  {
    slug: "tiendas-en-linea",
    titulo: "Tiendas en línea",
    resumen: "Vende por internet con catálogo, carrito y pagos en Colombia.",
    descripcion:
      "Tiendas a la medida de tu catálogo y tu forma de vender: pagos con pasarelas colombianas como Wompi, inventario, pedidos y un panel para administrarlo todo sin depender de nadie.",
    entregables: [
      "Catálogo, carrito y proceso de compra",
      "Integración con pasarela de pagos (p. ej. Wompi)",
      "Panel para productos, pedidos e inventario",
      "Correos de confirmación al cliente",
    ],
    tecnologias: ["React", "Node.js / Express", "MySQL", "Wompi"],
  },
  {
    slug: "software-a-medida",
    titulo: "Software a medida",
    resumen: "Herramientas hechas para cómo trabaja tu negocio, no al revés.",
    descripcion:
      "Cuando las hojas de cálculo y las apps genéricas ya no alcanzan: sistemas internos, automatizaciones e integraciones entre las herramientas que ya usas.",
    entregables: [
      "Levantamiento de procesos y requisitos",
      "Prototipo navegable",
      "Desarrollo por etapas con entregas revisables",
      "Documentación y entrega del código",
    ],
    tecnologias: ["TypeScript", "Node.js", "PostgreSQL / MySQL", "APIs REST"],
  },
  {
    slug: "paneles-administrativos",
    titulo: "Paneles administrativos",
    resumen: "Controla tu operación desde un solo lugar, con datos claros.",
    descripcion:
      "Paneles para gestionar clientes, pedidos, inventario o reservas, con roles de usuario, reportes y exportación de datos.",
    entregables: [
      "Gestión de usuarios y permisos",
      "Tablas, filtros y búsqueda",
      "Reportes y exportación a Excel/CSV",
      "Respaldo de la información",
    ],
    tecnologias: ["Next.js", "React", "Node.js", "MySQL / PostgreSQL"],
  },
];

export type Proyecto = {
  slug: string;
  cliente: string;
  tipo: string;
  resumen: string;
  stack: string[];
  url?: string;
  urlLabel?: string;
  reto: string;
  solucion: string[];
  resultado: string;
  /** «produccion»: sitio real publicado; «prototipo»: prototipo navegable. */
  estado: "produccion" | "prototipo";
  /** Captura subida desde el panel (Vercel Blob). */
  imagen?: string;
  imagenAlt?: string;
};

export const proyectos: Proyecto[] = [
  {
    slug: "eliab-bohorquez-perfumeria",
    cliente: "Eliab Bohorquez Perfumería",
    tipo: "Tienda en línea",
    estado: "prototipo",
    resumen: "Tienda en línea de perfumería con catálogo, carrito y pagos con Wompi.",
    stack: ["React", "Node.js / Express", "MySQL", "Wompi"],
    url: "https://eliabperfumes.netlify.app/",
    urlLabel: "Ver prototipo",
    reto:
      "La perfumería necesitaba vender por internet con un catálogo fácil de recorrer por categorías y un pago confiable para clientes en Colombia.",
    solucion: [
      "Prototipo navegable de la tienda para validar el recorrido de compra antes de programar.",
      "Catálogo por categorías, buscador, ficha de producto y bolsa de compras.",
      "Pago en línea con Wompi y pantallas de pago aprobado y rechazado.",
      "Panel administrativo para crear y editar productos.",
    ],
    // Pendiente: completar con datos reales del cliente cuando la tienda esté en producción.
    resultado:
      "El prototipo navegable está publicado y sirve como base para la versión en producción.",
  },
];

export type Precio = {
  tipo: string;
  descripcion: string;
  incluye: string[];
  /** Rango orientativo. null = pendiente de confirmar con DevMart (no inventar cifras). */
  rango: string | null;
  /** Opción preseleccionada en el formulario de contacto. */
  tipoFormulario: (typeof tiposProyecto)[number];
};

export const precios: Precio[] = [
  {
    tipo: "Landing page",
    descripcion: "Una página para presentar un producto, un servicio o una campaña.",
    incluye: ["Diseño a medida", "Formulario o botón de WhatsApp", "Adaptada a móvil", "Publicación"],
    rango: null,
    tipoFormulario: "Página web / landing",
  },
  {
    tipo: "Web corporativa",
    descripcion: "El sitio de tu empresa con varias secciones y blog opcional.",
    incluye: ["Varias páginas", "Blog administrable (opcional)", "SEO técnico básico", "Analítica"],
    rango: null,
    tipoFormulario: "Web corporativa",
  },
  {
    tipo: "Tienda en línea",
    descripcion: "Vende por internet con catálogo, carrito y pagos.",
    incluye: ["Catálogo y carrito", "Pasarela de pagos", "Panel de pedidos", "Inventario"],
    rango: null,
    tipoFormulario: "Tienda en línea",
  },
  {
    tipo: "App a medida",
    descripcion: "Aplicación web o móvil construida alrededor de tu proceso.",
    incluye: ["Levantamiento de requisitos", "Prototipo navegable", "Entregas por etapas", "Código tuyo"],
    rango: null,
    tipoFormulario: "Software a medida",
  },
];

export const proceso = [
  {
    titulo: "Idea",
    texto: "Nos cuentas qué necesitas. Definimos juntos el alcance, las prioridades y un presupuesto claro.",
  },
  {
    titulo: "Diseño",
    texto: "Primero un prototipo navegable: ves y pruebas tu producto antes de escribir una línea de código.",
  },
  {
    titulo: "Desarrollo",
    texto: "Construimos por etapas, con entregas que puedes revisar. Sin sorpresas al final.",
  },
  {
    titulo: "Lanzamiento",
    texto: "Publicamos, te acompañamos en el arranque y te entregamos el código: es tuyo.",
  },
];

export const tiposProyecto = [
  "Página web / landing",
  "Web corporativa",
  "Tienda en línea",
  "App móvil",
  "Software a medida",
  "Panel administrativo",
  "Aún no lo sé",
] as const;

// Rangos de presupuesto del formulario. Pendiente: confirmar los montos con DevMart.
export const presupuestos = [
  "Aún no lo tengo claro",
  "Menos de $3.000.000 COP",
  "$3.000.000 – $8.000.000 COP",
  "$8.000.000 – $20.000.000 COP",
  "Más de $20.000.000 COP",
] as const;

/** Misión, visión y objetivo de la empresa (página Nosotros y portada). */
export const identidad: { clave: "mision" | "vision" | "objetivo"; titulo: string; frase: string; texto: string }[] = [
  {
    clave: "mision",
    titulo: "Misión",
    frase: "Convertir ideas en software que funciona.",
    texto:
      "Acompañamos a personas y negocios desde la idea hasta el producto terminado: web, móvil o lo que haga falta. Con prototipo primero, entregas por etapas y explicaciones sin tecnicismos.",
  },
  {
    clave: "vision",
    titulo: "Visión",
    frase: "Ser el estudio de confianza para digitalizar negocios en Colombia.",
    texto:
      "Queremos que cualquier negocio, grande o pequeño, pueda tener tecnología a su medida. Desde Cartagena, reconocidos por cumplir lo que prometemos y por hablar claro.",
  },
  {
    clave: "objetivo",
    titulo: "Objetivo",
    frase: "Que cada cliente salga con un producto propio y listo para crecer.",
    texto:
      "Entregamos el código, los accesos y la documentación de todo lo que construimos. Tu producto queda funcionando, lo entiendes y no dependes de nosotros para seguir.",
  },
];
