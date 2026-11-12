import assert from "node:assert/strict";
import { test } from "node:test";
import { intercalar } from "./comunidad";
import { analizarRss, decodificar, esTecnologia, textoPlano } from "./noticias-rss";

const feed = `<rss><channel><title>Medio</title>
<item>
  <title><![CDATA[Nuevo chip  de IA ]]></title>
  <link>https://medio.com/tecnologia/nuevo-chip</link>
  <pubDate>Thu, 12 Nov 2026 15:15:25 +0100</pubDate>
  <description><![CDATA[<p><img src="https://img.medio.com/chip.jpg" alt="x"></p><p>El fabricante <strong>presentó</strong> su chip.</p><!-- BREAK -->]]></description>
</item>
<item>
  <title>Oferta del día</title>
  <link>https://medio.com/seleccion/oferta</link>
  <pubDate>Thu, 12 Nov 2026 10:00:00 +0000</pubDate>
  <description>Compra ya</description>
</item>
<item>
  <title>Sin fecha</title>
  <link>https://medio.com/a</link>
  <description>x</description>
</item>
<item>
  <title>Con media</title>
  <link>http://medio.com/inseguro</link>
  <pubDate>Thu, 12 Nov 2026 10:00:00 +0000</pubDate>
</item>
<item>
  <title>Caf&#x00E9; &amp; c&#243;digo</title>
  <link>https://medio.com/cafe</link>
  <pubDate>Wed, 11 Nov 2026 10:00:00 +0000</pubDate>
  <media:content url="https://img.medio.com/cafe.jpg" medium="image"/>
  <description>&lt;p&gt;Texto&lt;/p&gt;</description>
</item>
</channel></rss>`;

test("RSS: título, enlace, fecha ISO, extracto e imagen", () => {
  const [a, b, ...resto] = analizarRss(feed, /\/seleccion\//);
  assert.equal(resto.length, 0);
  assert.deepEqual(a, {
    titulo: "Nuevo chip de IA",
    url: "https://medio.com/tecnologia/nuevo-chip",
    fecha: "2026-11-12T14:15:25.000Z",
    resumen: "El fabricante presentó su chip.",
    imagen: "https://img.medio.com/chip.jpg",
  });
  assert.equal(b!.titulo, "Café & código");
  assert.equal(b!.imagen, "https://img.medio.com/cafe.jpg");
  assert.equal(b!.resumen, "Texto");
});

test("entidades numéricas y extracto recortado en palabra", () => {
  assert.equal(decodificar("m&#x00E1;s&#x20;barato"), "más barato");
  const largo = textoPlano("<p>" + "palabra ".repeat(60) + "</p>", 30);
  assert.ok(largo.length <= 31 && largo.endsWith("…") && !largo.includes("palab…"));
});

test("intercalar: una noticia cada tres propias y el resto al final", () => {
  assert.deepEqual(intercalar([1, 2, 3, 4, 5, 6, 7], ["a", "b", "c"] as never[]), [1, 2, 3, "a", 4, 5, 6, "b", 7, "c"]);
  assert.deepEqual(intercalar([], ["a"] as never[]), ["a"]);
});

test("solo pasan las noticias de tecnología", () => {
  assert.equal(esTecnologia({ titulo: "Jensen Huang renuncia como CEO de NVIDIA", resumen: "" }), true);
  assert.equal(esTecnologia({ titulo: "Un comando de Windows para liberar 10 GB", resumen: "" }), true);
  assert.equal(esTecnologia({ titulo: "Quedan 720 ejemplares de esta ave", resumen: "Un experimento con semen congelado" }), false);
  assert.equal(esTecnologia({ titulo: "Los propietarios no pagan cuotas de la comunidad", resumen: "La justicia lo confirma" }), false);
});
