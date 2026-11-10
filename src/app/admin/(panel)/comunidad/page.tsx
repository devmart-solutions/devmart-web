import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AdminForm } from "@/components/admin/AdminForm";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { ImagenField } from "@/components/admin/ImagenField";
import { AdminHeader, Cargando, Checkbox, Field, Input, Panel, Select, Textarea } from "@/components/admin/fields";
import { eliminarPublicacion, guardarPublicacion } from "@/lib/admin/comunidad-actions";
import { listarPublicacionesAdmin } from "@/lib/admin/queries";
import { embedDe, nombresRed } from "@/lib/comunidad";
import { redesPublicacion } from "@/lib/db/schema";

export const metadata: Metadata = { title: "Comunidad" };

export default function ComunidadAdminPage() {
  return (
    <>
      <AdminHeader
        title="Comunidad"
        intro="Publicaciones de tus redes que salen en /comunidad. Los videos de YouTube y los artículos del blog entran solos; aquí enlazas lo de Instagram, TikTok, Facebook, LinkedIn o X."
      >
        <Link href="/comunidad" target="_blank" className="btn-secondary">
          Ver el muro
        </Link>
      </AdminHeader>
      <Suspense fallback={<Cargando />}>
        <Lista />
      </Suspense>
    </>
  );
}

type Publicacion = Awaited<ReturnType<typeof listarPublicacionesAdmin>>[number];

function Campos({ p }: { p?: Publicacion }) {
  return (
    <>
      {p && <input type="hidden" name="id" value={p.id} />}
      <div className="grid gap-5 sm:grid-cols-[160px_1fr_160px]">
        <Field label="Red">
          <Select name="red" defaultValue={p?.red ?? "instagram"}>
            {redesPublicacion.map((r) => (
              <option key={r} value={r}>
                {nombresRed[r]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Enlace de la publicación" hint="Copia el enlace con «Compartir → Copiar enlace»">
          <Input name="url" type="url" defaultValue={p?.url} required maxLength={500} placeholder="https://www.instagram.com/p/…" />
        </Field>
        <Field label="Fecha">
          <Input name="fecha" type="date" defaultValue={p?.fecha ?? new Date().toISOString().slice(0, 10)} required />
        </Field>
      </div>
      <Field label="Texto" hint="Lo que se lee en la tarjeta del muro (puedes pegar el texto de la publicación)">
        <Textarea name="texto" rows={3} defaultValue={p?.texto} required maxLength={600} />
      </Field>
      <ImagenField
        name="imagen"
        altName="imagenAlt"
        quitarName={p?.imagen ? "quitarImagen" : undefined}
        actual={p?.imagen}
        alt={p?.imagenAlt}
        label="Portada (opcional)"
        aspect="aspect-square"
      />
      <div className="flex flex-wrap gap-6">
        <Checkbox name="publicado" label="Visible en el muro" defaultChecked={p?.publicado ?? true} />
        <Checkbox name="destacada" label="Destacada" defaultChecked={p?.destacada ?? false} />
      </div>
    </>
  );
}

async function Lista() {
  const publicaciones = await listarPublicacionesAdmin();
  return (
    <>
      <Panel className="flex flex-col gap-4 border-2 border-dashed border-borde">
        <h2 className="h3-dm">Nueva publicación</h2>
        <AdminForm action={guardarPublicacion} submitLabel="Añadir al muro" resetOnSuccess>
          <Campos />
        </AdminForm>
      </Panel>
      {publicaciones.map((p) => (
        <Panel key={p.id} className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3 text-[14px] text-pizarra">
            <span className="font-medium text-noche">{nombresRed[p.red]}</span>
            <span className="font-mono">{p.fecha}</span>
            <span>{embedDe(p.red, p.url) ? "Se puede ver dentro del muro" : "Se abre en la red"}</span>
            {!p.publicado && <span className="rounded-full bg-nube px-2.5 py-0.5">Oculta</span>}
          </div>
          <AdminForm action={guardarPublicacion}>
            <Campos p={p} />
          </AdminForm>
          <div className="flex justify-end border-t border-borde pt-4">
            <DeleteButton action={eliminarPublicacion} id={p.id} label="Eliminar publicación" />
          </div>
        </Panel>
      ))}
    </>
  );
}
