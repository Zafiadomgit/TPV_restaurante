import { supabase } from "../_lib/supabaseClient.js";
import { exigirRol } from "../_lib/auth.js";

function mapRow(row) {
  return {
    id: row.id,
    categoriaId: row.categoria_id,
    nombre: row.nombre,
    nombreEn: row.nombre_en || null,
    descripcion: row.descripcion || "",
    descripcionEn: row.descripcion_en || null,
    precio: Number(row.precio),
    modificadores: row.modificadores || null,
    activo: row.activo,
    orden: row.orden,
  };
}

function slugify(texto) {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Una opción nunca debe poder abaratar el producto por su cuenta —
// "quitar un ingrediente" es gratis (0€), nunca un descuento con
// precioExtra negativo. La única forma soportada de bajar el precio es
// precioSiTodoQuitado en el propio paso (ver orders/index.js y
// Personalizar.jsx), que también se valida aquí: si está presente debe
// ser un número finito y no negativo.
function modificadoresValidos(modificadores) {
  if (!modificadores) return true;
  if (!Array.isArray(modificadores)) return false;
  return modificadores.every(
    (paso) =>
      Array.isArray(paso.opciones) &&
      paso.opciones.every((o) => Number.isFinite(o.precioExtra) && o.precioExtra >= 0) &&
      (paso.precioSiTodoQuitado === undefined ||
        (Number.isFinite(paso.precioSiTodoQuitado) && paso.precioSiTodoQuitado >= 0))
  );
}

// Productos y su detalle comparten un único archivo (una sola función
// serverless) para no superar el límite de 12 funciones del plan Hobby
// de Vercel — el producto a editar/borrar se identifica por
// ?id=<slug> en la query string, no por un segmento de ruta, porque
// las rutas dinámicas tipo [[...id]] son una convención de Next.js que
// este proyecto (sin framework) no usa.
export default async function handler(req, res) {
  if (!exigirRol(req, res, ["caja"])) return;

  const { id } = req.query;

  if (!id) {
    if (req.method === "GET") {
      // Lista completa (incluye inactivos) para la pantalla de gestión —
      // GET /api/menu ya filtra los inactivos para el kiosco.
      const { data, error } = await supabase
        .from("menu_productos")
        .select("*")
        .order("orden", { ascending: true });
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json(data.map(mapRow));
    }

    if (req.method === "POST") {
      const { categoriaId, nombre, nombreEn, descripcion, descripcionEn, precio, modificadores } = req.body || {};

      if (!categoriaId) {
        return res.status(400).json({ error: "La categoría es obligatoria" });
      }
      if (!nombre || typeof nombre !== "string" || !nombre.trim()) {
        return res.status(400).json({ error: "El nombre es obligatorio" });
      }
      const precioNumero = Number(precio);
      if (!Number.isFinite(precioNumero) || precioNumero < 0) {
        return res.status(400).json({ error: "El precio debe ser un número válido" });
      }
      if (!modificadoresValidos(modificadores)) {
        return res.status(400).json({ error: "Ninguna opción de personalización puede tener un precio negativo" });
      }

      const baseId = slugify(nombre);
      if (!baseId) {
        return res.status(400).json({ error: "No se pudo generar un identificador a partir del nombre" });
      }

      const { count } = await supabase
        .from("menu_productos")
        .select("*", { count: "exact", head: true })
        .eq("categoria_id", categoriaId);

      let productoId = baseId;
      let intento = 1;
      // Reintenta con sufijo si el id ya existe (ej. dos productos que se
      // llamarían igual en slug, como "Kebab" y "kebab!").
      for (;;) {
        const { data: existente } = await supabase
          .from("menu_productos")
          .select("id")
          .eq("id", productoId)
          .maybeSingle();
        if (!existente) break;
        intento += 1;
        productoId = `${baseId}-${intento}`;
      }

      const { data, error } = await supabase
        .from("menu_productos")
        .insert({
          id: productoId,
          categoria_id: categoriaId,
          nombre: nombre.trim(),
          nombre_en: nombreEn?.trim() || null,
          descripcion: descripcion || "",
          descripcion_en: descripcionEn || null,
          precio: precioNumero,
          modificadores: modificadores || null,
          orden: count ?? 0,
        })
        .select()
        .single();

      if (error) return res.status(500).json({ error: error.message });
      return res.status(201).json(mapRow(data));
    }

    return res.status(405).json({ error: "Método no permitido" });
  }

  if (req.method === "PATCH") {
    const cambios = {};
    const body = req.body || {};

    if (body.nombre !== undefined) {
      if (!body.nombre.trim()) {
        return res.status(400).json({ error: "El nombre es obligatorio" });
      }
      cambios.nombre = body.nombre.trim();
    }
    if (body.nombreEn !== undefined) cambios.nombre_en = body.nombreEn?.trim() || null;
    if (body.descripcion !== undefined) cambios.descripcion = body.descripcion;
    if (body.descripcionEn !== undefined) cambios.descripcion_en = body.descripcionEn || null;
    if (body.precio !== undefined) {
      const precioNumero = Number(body.precio);
      if (!Number.isFinite(precioNumero) || precioNumero < 0) {
        return res.status(400).json({ error: "El precio debe ser un número válido" });
      }
      cambios.precio = precioNumero;
    }
    if (body.categoriaId !== undefined) cambios.categoria_id = body.categoriaId;
    if (body.modificadores !== undefined) {
      if (!modificadoresValidos(body.modificadores)) {
        return res.status(400).json({ error: "Ninguna opción de personalización puede tener un precio negativo" });
      }
      cambios.modificadores = body.modificadores;
    }
    if (body.activo !== undefined) cambios.activo = Boolean(body.activo);
    if (body.orden !== undefined) cambios.orden = Number(body.orden);

    if (Object.keys(cambios).length === 0) {
      return res.status(400).json({ error: "No hay cambios que aplicar" });
    }
    cambios.actualizado_en = new Date().toISOString();

    const { data, error } = await supabase
      .from("menu_productos")
      .update(cambios)
      .eq("id", id)
      .select()
      .maybeSingle();

    if (error) return res.status(500).json({ error: error.message });
    if (!data) return res.status(404).json({ error: "Producto no encontrado" });
    return res.status(200).json(mapRow(data));
  }

  if (req.method === "DELETE") {
    // No afecta a pedidos ya hechos: orders.items guarda una copia
    // congelada del producto en el momento del pedido, no una referencia.
    const { error } = await supabase.from("menu_productos").delete().eq("id", id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(204).end();
  }

  res.status(405).json({ error: "Método no permitido" });
}
