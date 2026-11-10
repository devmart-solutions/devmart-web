import type { MetadataRoute } from "next";
import { getPosts, getProyectos } from "@/lib/data";
import { siteUrl } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, proyectos] = await Promise.all([getPosts(), getProyectos()]);
  const pages = ["", "/servicios", "/proyectos", "/nosotros", "/blog", "/comunidad", "/precios", "/contacto", "/privacidad"];
  return [
    ...pages.map((p) => ({ url: `${siteUrl}${p}` })),
    ...proyectos.map((p) => ({ url: `${siteUrl}/proyectos/${p.slug}` })),
    ...posts.map((p) => ({ url: `${siteUrl}/blog/${p.slug}`, lastModified: p.fecha })),
  ];
}
