import { redes, site, siteUrl, WHATSAPP_VISIBLE } from "@/lib/site";

// Datos estructurados del estudio. DevMart no es una sociedad registrada: se describe como un
// servicio profesional local (sin «Organization» ni datos legales), con teléfono y redes.
export function EstudioJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "@id": `${siteUrl}/#estudio`,
    name: site.name,
    url: siteUrl,
    logo: `${siteUrl}/logo-cube.svg`,
    description: site.description,
    telephone: WHATSAPP_VISIBLE,
    ...(site.email && { email: site.email }),
    ...(redes.length > 0 && { sameAs: redes.map((r) => r.url) }),
    address: {
      "@type": "PostalAddress",
      addressLocality: site.city,
      addressRegion: "Bolívar",
      addressCountry: "CO",
    },
    areaServed: { "@type": "Country", name: "Colombia" },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\u003c") }}
    />
  );
}

type BlogPostingProps = {
  titulo: string;
  resumen: string;
  fecha: string;
  slug: string;
  categoria?: string;
};

export function BlogPostingJsonLd({ titulo, resumen, fecha, slug, categoria }: BlogPostingProps) {
  const url = `${siteUrl}/blog/${slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: titulo,
    description: resumen,
    datePublished: fecha,
    dateModified: fecha,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
    url,
    ...(categoria && { articleSection: categoria }),
    author: {
      "@type": "Organization",
      name: site.name,
      url: siteUrl,
    },
    publisher: {
      "@type": "Organization",
      name: site.name,
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/logo-cube.svg`,
      },
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\u003c") }}
    />
  );
}

type ProyectoJsonLdProps = {
  cliente: string;
  resumen: string;
  slug: string;
  tipo: string;
  stack?: string[];
  urlProyecto?: string;
  imagen?: string;
};

export function ProyectoJsonLd({
  cliente,
  resumen,
  slug,
  tipo,
  stack = [],
  urlProyecto,
  imagen,
}: ProyectoJsonLdProps) {
  const url = `${siteUrl}/proyectos/${slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    additionalType: "https://schema.org/SoftwareApplication",
    name: `${cliente} · Caso de estudio`,
    headline: `${cliente} — ${tipo}`,
    description: resumen,
    url,
    genre: tipo,
    ...(keywordsFromStack(stack) && { keywords: keywordsFromStack(stack) }),
    ...(urlProyecto && { sameAs: urlProyecto }),
    ...(imagen && { image: imagen }),
    creator: {
      "@type": "Organization",
      name: site.name,
      url: siteUrl,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\u003c") }}
    />
  );
}

function keywordsFromStack(stack: string[]): string {
  return stack.join(", ");
}
