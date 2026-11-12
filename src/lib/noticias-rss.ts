// Lectura de feeds RSS 2.0 de medios de tecnología, sin dependencias (se prueba con tsx --test).

export type Noticia = {
  titulo: string;
  url: string;
  /** Fecha ISO completa. */
  fecha: string;
  /** Extracto en texto plano, recortado. */
  resumen: string;
  imagen: string | null;
};

const LARGO_RESUMEN = 220;

/** Decodifica entidades HTML con nombre y numéricas (&#x00E1;, &#225;). */
export function decodificar(s: string): string {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h: string) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d: string) => String.fromCodePoint(Number(d)))
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

const sinCdata = (s: string) => s.replace(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/, "$1");

function campo(xml: string, etiqueta: string): string {
  const crudo = xml.match(new RegExp(`<${etiqueta}(?:\\s[^>]*)?>([\\s\\S]*?)</${etiqueta}>`))?.[1] ?? "";
  return sinCdata(crudo).trim();
}

/** Texto plano a partir del HTML de la descripción: sin etiquetas, comentarios ni espacios de más. */
export function textoPlano(html: string, max = LARGO_RESUMEN): string {
  const texto = decodificar(
    html
      .replace(/<!--[\s\S]*?-->/g, " ")
      .replace(/<(script|style|figure)[\s\S]*?<\/\1>/gi, " ")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/\s+/g, " ")
    .trim();
  if (texto.length <= max) return texto;
  const corte = texto.slice(0, max);
  return `${corte.slice(0, corte.lastIndexOf(" ") > 0 ? corte.lastIndexOf(" ") : max).replace(/[\s,.;:]+$/, "")}…`;
}

const httpsValida = (u: string | undefined) => {
  if (!u) return null;
  try {
    const url = new URL(decodificar(u));
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
};

/** Imagen de la noticia: media:content, enclosure de imagen o la primera <img> de la descripción. */
function imagenDe(item: string, descripcion: string): string | null {
  const media = item.match(/<media:(?:content|thumbnail)[^>]*\surl="([^"]+)"/)?.[1];
  const enclosure = item.match(/<enclosure[^>]*\surl="([^"]+)"[^>]*type="image\//)?.[1];
  const img = descripcion.match(/<img[^>]*\ssrc="([^"]+)"/)?.[1];
  return httpsValida(media) ?? httpsValida(enclosure) ?? httpsValida(img);
}

/** Vocabulario que delata una noticia de tecnología (los medios generalistas mezclan otros temas). */
// Límites de palabra que entienden tildes y ñ (\b de JS solo conoce ASCII).
const palabras = (lista: string, flags: string) => new RegExp(`(?<![\p{L}\d])(?:${lista})(?![\p{L}\d])`, flags);

/** Marcas y siglas: distinguen mayúsculas para no confundir «Meta» con «meta» o «IA» con «ía». */
const MARCAS = palabras(
  "IA|ChatGPT|OpenAI|Gemini|Copilot|Android|iPhone|iOS|Apple|Google|Microsoft|Windows|Linux|macOS|Meta|WhatsApp|Instagram|TikTok|YouTube|NVIDIA|Nvidia|AMD|Intel|Qualcomm|Samsung|Xiaomi|GPU|PC|Chrome|Firefox|5G|Bluetooth|Netflix|Spotify|Tesla|SpaceX|USB|SSD",
  "u",
);

/** Vocabulario general de tecnología. */
const TERMINOS = palabras(
  "inteligencia artificial|algoritmos?|apps?|aplicaci[oó]n(es)?|software|programaci[oó]n|programador(es)?|c[oó]digo|desarrollador(es)?|chips?|procesador(es)?|smartphones?|m[oó]vil(es)?|port[aá]til(es)?|ordenador(es)?|tablets?|internet|web|navegador(es)?|la nube|servidor(es)?|ciberseguridad|hackers?|ciberataques?|contraseñas?|robots?|rob[oó]tica|startups?|tecnol[oó]gic[oa]s?|tecnolog[ií]as?|digital(es)?|wifi|blockchain|criptomonedas?|videojuegos?|consolas?|streaming|sat[eé]lites?|drones?|comandos?|bater[ií]as?",
  "iu",
);

export const esTecnologia = (n: Pick<Noticia, "titulo" | "resumen">) => {
  const texto = `${n.titulo} ${n.resumen}`;
  return MARCAS.test(texto) || TERMINOS.test(texto);
};

/**
 * Analiza un feed RSS 2.0. Descarta los artículos sin enlace https o sin fecha válida,
 * y los que coinciden con `excluir` (secciones de ofertas, por ejemplo).
 */
export function analizarRss(xml: string, excluir?: RegExp): Noticia[] {
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].flatMap(([, item]) => {
    const url = httpsValida(campo(item, "link"));
    const fecha = new Date(campo(item, "pubDate"));
    const titulo = decodificar(campo(item, "title")).replace(/\s+/g, " ").trim();
    if (!url || !titulo || Number.isNaN(fecha.getTime()) || excluir?.test(url)) return [];
    // Sin CDATA, el HTML de la descripción llega escapado (&lt;p&gt;).
    const cruda = campo(item, "description");
    const descripcion = /&lt;[a-z!/]/i.test(cruda) ? decodificar(cruda) : cruda;
    return [{ titulo, url, fecha: fecha.toISOString(), resumen: textoPlano(descripcion), imagen: imagenDe(item, descripcion) }];
  });
}
