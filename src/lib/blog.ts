// Contenido inicial del blog (se copia a la base de datos con `npm run db:seed`).
// El cuerpo de cada artículo vive en src/content/blog/<slug>.md.

export type Post = {
  slug: string;
  titulo: string;
  resumen: string;
  categoria: string;
  /** Fecha ISO (AAAA-MM-DD). */
  fecha: string;
  lecturaMin: number;
  /** Portada del artículo (ruta de /public o URL de Blob). */
  imagen: string | null;
  imagenAlt: string;
};

export const posts: Post[] = [
  {
    slug: "como-preparar-tu-idea",
    titulo: "Cinco preguntas para preparar tu idea antes de hablar con un desarrollador",
    resumen:
      "No necesitas saber de tecnología. Con estas respuestas, la cotización es más precisa y el proyecto arranca mejor.",
    categoria: "Guías",
    fecha: "2026-10-16",
    lecturaMin: 4,
    imagen: "/blog/como-preparar-tu-idea.svg",
    imagenAlt: "Ilustración de una libreta con cinco preguntas y un bombillo encendido",
  },
  {
    slug: "web-app-movil-o-app-web",
    titulo: "¿Página web, aplicación web o app móvil? Cómo saber qué necesita tu negocio",
    resumen:
      "Las diferencias en lenguaje sencillo y una regla práctica para elegir sin gastar de más.",
    categoria: "Guías",
    fecha: "2026-09-30",
    lecturaMin: 5,
    imagen: "/blog/web-app-movil-o-app-web.svg",
    imagenAlt: "Ilustración de una página web, una aplicación web y una app móvil lado a lado",
  },
  {
    slug: "por-que-empezamos-con-un-prototipo",
    titulo: "Por qué empezamos cada proyecto con un prototipo navegable",
    resumen:
      "Ver y probar tu producto antes de programarlo ahorra tiempo, dinero y malentendidos. Así lo hacemos.",
    categoria: "Proceso",
    fecha: "2026-10-14",
    lecturaMin: 4,
    imagen: "/blog/por-que-empezamos-con-un-prototipo.svg",
    imagenAlt: "Ilustración de pantallas de un prototipo conectadas por flechas y un cursor",
  },
  {
    slug: "que-necesitas-para-vender-en-linea",
    titulo: "Qué necesitas para empezar a vender en línea en Colombia",
    resumen:
      "Catálogo, pagos, envíos y un panel para administrarlo: la lista corta antes de lanzar tu tienda.",
    categoria: "Tiendas en línea",
    fecha: "2026-10-07",
    lecturaMin: 5,
    imagen: "/blog/que-necesitas-para-vender-en-linea.svg",
    imagenAlt: "Ilustración de un carrito de compras, una tarjeta de pago y una caja de envío",
  },
];

const ilustraciones = new Map(posts.map((p) => [p.slug, p]));

/**
 * Portada de un artículo: la que tenga guardada o, si no tiene, la ilustración incluida
 * en el sitio para ese slug (así los artículos iniciales la muestran aunque no se haya re-sembrado la base).
 */
export function portadaDe(p: { slug: string; imagen: string | null; imagenAlt: string }) {
  if (p.imagen) return { imagen: p.imagen, imagenAlt: p.imagenAlt };
  const base = ilustraciones.get(p.slug);
  return base?.imagen ? { imagen: base.imagen, imagenAlt: base.imagenAlt } : { imagen: null, imagenAlt: "" };
}

export function formatFecha(iso: string) {
  return new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${iso}T00:00:00Z`));
}
