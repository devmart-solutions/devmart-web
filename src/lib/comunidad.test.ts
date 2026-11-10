import assert from "node:assert/strict";
import { test } from "node:test";
import { embedDe, enlaceValido, nombrePublico } from "./comunidad";

test("Instagram: post y reel se convierten en su reproductor", () => {
  assert.equal(embedDe("instagram", "https://www.instagram.com/p/DAbc_12-x/"), "https://www.instagram.com/p/DAbc_12-x/embed");
  assert.equal(embedDe("instagram", "https://instagram.com/reel/XyZ123/?igsh=abc"), "https://www.instagram.com/reel/XyZ123/embed");
  assert.equal(embedDe("instagram", "https://www.instagram.com/devmart.co/"), null);
});

test("TikTok: solo enlaces de video con id numérico", () => {
  assert.equal(
    embedDe("tiktok", "https://www.tiktok.com/@devmart.co/video/7301234567890123456?lang=es"),
    "https://www.tiktok.com/embed/v2/7301234567890123456",
  );
  assert.equal(embedDe("tiktok", "https://www.tiktok.com/@devmart.co"), null);
});

test("YouTube: watch, youtu.be y shorts", () => {
  const e = "https://www.youtube-nocookie.com/embed/lR8igKWma2U";
  assert.equal(embedDe("youtube", "https://www.youtube.com/watch?v=lR8igKWma2U"), e);
  assert.equal(embedDe("youtube", "https://youtu.be/lR8igKWma2U"), e);
  assert.equal(embedDe("youtube", "https://www.youtube.com/shorts/lR8igKWma2U"), e);
});

test("el enlace debe ser https y de la red elegida", () => {
  assert.equal(enlaceValido("instagram", "https://www.tiktok.com/@devmart.co/video/1"), false);
  assert.equal(enlaceValido("tiktok", "http://www.tiktok.com/@devmart.co/video/1"), false);
  assert.equal(enlaceValido("tiktok", "https://evil.com/tiktok.com"), false);
  assert.equal(embedDe("linkedin", "https://www.linkedin.com/posts/devmart"), null);
  assert.equal(enlaceValido("linkedin", "https://www.linkedin.com/posts/devmart"), true);
});

test("nombre público con inicial del apellido", () => {
  assert.equal(nombrePublico("Ana maría López"), "Ana M.");
  assert.equal(nombrePublico("  Carlos  "), "Carlos");
});
