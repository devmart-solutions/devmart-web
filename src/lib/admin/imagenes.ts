import "server-only";
import { del, put } from "@vercel/blob";

// Subida de imágenes del panel a Vercel Blob. Solo la llaman server actions que ya pasaron
// por requireAdmin(); aquí se valida el archivo en el servidor (no se confía en el accept del input).

export const MAX_IMAGEN = 4 * 1024 * 1024;

const tipos = {
  "image/jpeg": { ext: "jpg", firma: (b: Uint8Array) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  "image/png": { ext: "png", firma: (b: Uint8Array) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 },
  "image/webp": {
    ext: "webp",
    firma: (b: Uint8Array) =>
      String.fromCharCode(...b.slice(0, 4)) === "RIFF" && String.fromCharCode(...b.slice(8, 12)) === "WEBP",
  },
} as const;

/** Archivo del campo, o null si no se eligió ninguno. */
export function archivoDe(fd: FormData, campo: string) {
  const f = fd.get(campo);
  return f instanceof File && f.size > 0 ? f : null;
}

/** Valida y sube la imagen. Devuelve la URL pública o un mensaje de error. */
export async function subirImagen(file: File, carpeta: string): Promise<{ url: string } | { error: string }> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return { error: "Falta BLOB_READ_WRITE_TOKEN: conecta Vercel Blob al proyecto." };
  if (file.size > MAX_IMAGEN) return { error: "Imagen: máximo 4 MB." };
  const tipo = tipos[file.type as keyof typeof tipos];
  const bytes = new Uint8Array(await file.arrayBuffer());
  // El tipo declarado por el navegador se contrasta con la firma real del archivo.
  if (!tipo || !tipo.firma(bytes)) return { error: "Imagen: usa JPG, PNG o WebP." };
  const blob = await put(`${carpeta}/imagen.${tipo.ext}`, Buffer.from(bytes), {
    access: "public",
    addRandomSuffix: true,
    contentType: file.type,
  });
  return { url: blob.url };
}

/** Borra una imagen anterior de Blob; si falla, no impide guardar. */
export async function borrarImagen(url: string | null | undefined) {
  // Las rutas de /public (ilustraciones incluidas en el sitio) no viven en Blob.
  if (!url?.startsWith("https://") || !process.env.BLOB_READ_WRITE_TOKEN) return;
  await del(url).catch((err) => console.error("No se pudo borrar la imagen anterior", err));
}
