import { AdminForm } from "@/components/admin/AdminForm";
import { ImagenField } from "@/components/admin/ImagenField";
import { Checkbox, Field, Input, Panel, Textarea } from "@/components/admin/fields";
import { MarkdownEditor } from "@/components/admin/MarkdownEditor";
import { guardarPost } from "@/lib/admin/actions";

type PostEditable = {
  id: number;
  slug: string;
  titulo: string;
  resumen: string;
  categoria: string;
  fecha: string;
  lecturaMin: number;
  imagen: string | null;
  imagenAlt: string;
  cuerpo: string;
  publicado: boolean;
};

export function PostForm({ post }: { post?: PostEditable }) {
  const hoy = new Date().toLocaleDateString("en-CA", { timeZone: "America/Bogota" });
  return (
    <AdminForm action={guardarPost} submitLabel={post ? "Guardar cambios" : "Crear artículo"}>
      {post && <input type="hidden" name="id" value={post.id} />}
      <Panel className="flex flex-col gap-5">
        <Field label="Título">
          <Input name="titulo" defaultValue={post?.titulo} required maxLength={160} />
        </Field>
        <Field label="Resumen" hint="aparece en el listado y al compartir">
          <Textarea name="resumen" rows={2} defaultValue={post?.resumen} required maxLength={300} />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Categoría">
            <Input name="categoria" defaultValue={post?.categoria} required maxLength={40} placeholder="Guías" />
          </Field>
          <Field label="Fecha">
            <Input name="fecha" type="date" defaultValue={post?.fecha ?? hoy} required />
          </Field>
          <Field label="Minutos de lectura" hint="vacío = automático">
            <Input name="lecturaMin" type="number" min={1} max={120} defaultValue={post?.lecturaMin} />
          </Field>
          <Field label="Slug" hint="vacío = desde el título">
            <Input name="slug" defaultValue={post?.slug} maxLength={80} pattern="[a-z0-9]+(-[a-z0-9]+)*" className="font-mono text-[14px]" />
          </Field>
        </div>
        <Checkbox name="publicado" label="Publicado en el sitio" defaultChecked={post?.publicado ?? true} />
      </Panel>
      <Panel>
        <ImagenField
          name="imagen"
          altName="imagenAlt"
          quitarName="quitarImagen"
          actual={post?.imagen}
          alt={post?.imagenAlt}
          label="Portada (opcional)"
          aspect="aspect-[16/10]"
        />
      </Panel>
      <Panel>
        <MarkdownEditor name="cuerpo" defaultValue={post?.cuerpo} />
      </Panel>
    </AdminForm>
  );
}
