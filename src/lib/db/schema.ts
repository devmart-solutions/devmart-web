import { boolean, date, index, integer, jsonb, pgTable, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const estadosMensaje = ["nuevo", "en_conversacion", "cerrado", "descartado"] as const;
export type EstadoMensaje = (typeof estadosMensaje)[number];

/** Un caso puede ser un sitio en producción o un prototipo navegable. */
export const estadosProyecto = ["produccion", "prototipo"] as const;
export type EstadoProyecto = (typeof estadosProyecto)[number];

/** Mensajes del formulario de contacto. */
export const mensajes = pgTable(
  "mensajes",
  {
    id: serial("id").primaryKey(),
    nombre: text("nombre").notNull(),
    email: text("email").notNull(),
    telefono: text("telefono").notNull(),
    tipo: text("tipo").notNull(),
    presupuesto: text("presupuesto").notNull(),
    descripcion: text("descripcion").notNull(),
    estado: text("estado").$type<EstadoMensaje>().notNull().default("nuevo"),
    notas: text("notas").notNull().default(""),
    creado: timestamp("creado", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("mensajes_estado_idx").on(t.estado), index("mensajes_creado_idx").on(t.creado)],
);

/** Artículos del blog. El cuerpo es Markdown. */
export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  titulo: text("titulo").notNull(),
  resumen: text("resumen").notNull(),
  categoria: text("categoria").notNull(),
  /** Fecha ISO (AAAA-MM-DD). */
  fecha: text("fecha").notNull(),
  lecturaMin: integer("lectura_min").notNull(),
  cuerpo: text("cuerpo").notNull(),
  publicado: boolean("publicado").notNull().default(true),
  actualizado: timestamp("actualizado", { withTimezone: true }).notNull().defaultNow(),
});

/** Casos de proyecto. */
export const proyectos = pgTable("proyectos", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  cliente: text("cliente").notNull(),
  tipo: text("tipo").notNull(),
  resumen: text("resumen").notNull(),
  stack: jsonb("stack").$type<string[]>().notNull().default([]),
  url: text("url"),
  urlLabel: text("url_label"),
  reto: text("reto").notNull(),
  solucion: jsonb("solucion").$type<string[]>().notNull().default([]),
  resultado: text("resultado").notNull(),
  estado: text("estado").$type<EstadoProyecto>().notNull().default("produccion"),
  /** Captura en Vercel Blob; null = se muestra el placeholder. */
  imagen: text("imagen"),
  imagenAlt: text("imagen_alt").notNull().default(""),
  orden: integer("orden").notNull().default(0),
  publicado: boolean("publicado").notNull().default(true),
  actualizado: timestamp("actualizado", { withTimezone: true }).notNull().defaultNow(),
});

/** Tarjetas de la página de precios. */
export const precios = pgTable("precios", {
  id: serial("id").primaryKey(),
  tipo: text("tipo").notNull(),
  descripcion: text("descripcion").notNull(),
  incluye: jsonb("incluye").$type<string[]>().notNull().default([]),
  /** Rango orientativo; null = «A cotizar». */
  rango: text("rango"),
  tipoFormulario: text("tipo_formulario").notNull(),
  orden: integer("orden").notNull().default(0),
});

/** Contadores para limitar intentos (login, formulario). La clave nunca guarda la IP en claro. */
export const limites = pgTable("limites", {
  clave: text("clave").primaryKey(),
  intentos: integer("intentos").notNull(),
  reinicio: timestamp("reinicio", { withTimezone: true }).notNull(),
});

/** Registro de actividad del panel (inicios de sesión, cambios). */
export const actividad = pgTable(
  "actividad",
  {
    id: serial("id").primaryKey(),
    accion: text("accion").notNull(),
    detalle: text("detalle").notNull().default(""),
    creado: timestamp("creado", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("actividad_creado_idx").on(t.creado)],
);

/** Ajustes internos (p. ej. desde cuándo son válidas las sesiones del panel). */
export const ajustes = pgTable("ajustes", {
  clave: text("clave").primaryKey(),
  valor: text("valor").notNull(),
});

/* ───────────── Portal de clientes ─────────────
   Datos privados de cada cliente. Nada de esto es público: el portafolio sigue en `proyectos`. */

export const estadosEtapa = ["pendiente", "en_curso", "completada"] as const;
export type EstadoEtapa = (typeof estadosEtapa)[number];

export const estadosEntregable = ["por_aprobar", "aprobado", "cambios_pedidos"] as const;
export type EstadoEntregable = (typeof estadosEntregable)[number];

export const estadosPago = ["pendiente", "pagado"] as const;
export type EstadoPago = (typeof estadosPago)[number];

export const estadosSolicitud = ["abierta", "en_revision", "resuelta"] as const;
export type EstadoSolicitud = (typeof estadosSolicitud)[number];

/**
 * Clientes con acceso al portal. Entran con email y contraseña (la crean al registrarse o al activar
 * la cuenta que les creó el administrador), con Google/GitHub o con un enlace a su email.
 */
export const clientes = pgTable("clientes", {
  id: serial("id").primaryKey(),
  nombre: text("nombre").notNull(),
  email: text("email").notNull().unique(),
  empresa: text("empresa").notNull().default(""),
  telefono: text("telefono").notNull().default(""),
  /** scrypt; vacío mientras el cliente no haya creado su contraseña. */
  passwordHash: text("password_hash").notNull().default(""),
  activo: boolean("activo").notNull().default(true),
  creado: timestamp("creado", { withTimezone: true }).notNull().defaultNow(),
});

/** Enlaces de acceso de un solo uso. Solo se guarda la huella (sha256) del token. */
export const accesosCliente = pgTable(
  "accesos_cliente",
  {
    id: serial("id").primaryKey(),
    clienteId: integer("cliente_id")
      .notNull()
      .references(() => clientes.id, { onDelete: "cascade" }),
    hash: text("hash").notNull().unique(),
    expira: timestamp("expira", { withTimezone: true }).notNull(),
    usado: timestamp("usado", { withTimezone: true }),
    creado: timestamp("creado", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("accesos_cliente_cliente_idx").on(t.clienteId)],
);

/** Proyecto privado de un cliente (lo que se construye para él). */
export const obras = pgTable(
  "obras",
  {
    id: serial("id").primaryKey(),
    clienteId: integer("cliente_id")
      .notNull()
      .references(() => clientes.id, { onDelete: "cascade" }),
    nombre: text("nombre").notNull(),
    tipo: text("tipo").notNull(),
    /** Texto libre corto: «En diseño», «En desarrollo», «Entregado»… */
    estado: text("estado").notNull().default("En curso"),
    /** AAAA-MM-DD */
    fechaEntregaEstimada: date("fecha_entrega_estimada"),
    creado: timestamp("creado", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("obras_cliente_idx").on(t.clienteId)],
);

export const etapas = pgTable(
  "etapas",
  {
    id: serial("id").primaryKey(),
    obraId: integer("obra_id")
      .notNull()
      .references(() => obras.id, { onDelete: "cascade" }),
    orden: integer("orden").notNull().default(0),
    nombre: text("nombre").notNull(),
    estado: text("estado").$type<EstadoEtapa>().notNull().default("pendiente"),
    porcentaje: integer("porcentaje").notNull().default(0),
    fecha: date("fecha"),
  },
  (t) => [index("etapas_obra_idx").on(t.obraId)],
);

export const entregables = pgTable(
  "entregables",
  {
    id: serial("id").primaryKey(),
    obraId: integer("obra_id")
      .notNull()
      .references(() => obras.id, { onDelete: "cascade" }),
    titulo: text("titulo").notNull(),
    version: text("version").notNull().default("v1"),
    /** Enlace para revisar (prototipo, sitio de prueba, documento). */
    url: text("url"),
    /** Captura en Vercel Blob. */
    imagen: text("imagen"),
    estado: text("estado").$type<EstadoEntregable>().notNull().default("por_aprobar"),
    comentarioCliente: text("comentario_cliente").notNull().default(""),
    creado: timestamp("creado", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("entregables_obra_idx").on(t.obraId)],
);

export const pagos = pgTable(
  "pagos",
  {
    id: serial("id").primaryKey(),
    obraId: integer("obra_id")
      .notNull()
      .references(() => obras.id, { onDelete: "cascade" }),
    concepto: text("concepto").notNull(),
    /** Pesos colombianos, sin decimales. */
    monto: integer("monto").notNull(),
    estado: text("estado").$type<EstadoPago>().notNull().default("pendiente"),
    /** AAAA-MM-DD; fecha en que se pagó (o se espera pagar). */
    fechaPago: date("fecha_pago"),
  },
  (t) => [index("pagos_obra_idx").on(t.obraId)],
);

export const solicitudes = pgTable(
  "solicitudes",
  {
    id: serial("id").primaryKey(),
    obraId: integer("obra_id")
      .notNull()
      .references(() => obras.id, { onDelete: "cascade" }),
    /** Consecutivo dentro de la obra (#1, #2…). */
    numero: integer("numero").notNull(),
    titulo: text("titulo").notNull(),
    detalle: text("detalle").notNull(),
    estado: text("estado").$type<EstadoSolicitud>().notNull().default("abierta"),
    /** Respuesta del administrador (visible en el portal). */
    respuesta: text("respuesta").notNull().default(""),
    creado: timestamp("creado", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("solicitudes_obra_idx").on(t.obraId), uniqueIndex("solicitudes_obra_numero_idx").on(t.obraId, t.numero)],
);
