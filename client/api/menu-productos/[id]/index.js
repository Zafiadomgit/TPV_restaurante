import { supabase } from "../../_lib/supabaseClient.js";

function mapRow(row) {
  return {
    id: row.id,
    categoriaId: row.categoria_id,
    nombre: row.nombre,
    descripcion: row.descripcion || "",
    precio: Number(row.precio),
    modificadores: row.modificadores || null,
    activo: row.activo,
    orden: row.orden,
  };
}

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === "PATCH") {
    const cambios = {};
    const body = req.body || {};

    if (body.nombre !== undefined) {
      if (!body.nombre.trim()) {
        return res.status(400).json({ error: "El nombre es obligatorio" });
      }
      cambios.nombre = body.nombre.trim();
    }
    if (body.descripcion !== undefined) cambios.descripcion = body.descripcion;
    if (body.precio !== undefined) {
      const precioNumero = Number(body.precio);
      if (!Number.isFinite(precioNumero) || precioNumero < 0) {
        return res.status(400).json({ error: "El precio debe ser un número válido" });
      }
      cambios.precio = precioNumero;
    }
    if (body.categoriaId !== undefined) cambios.categoria_id = body.categoriaId;
    if (body.modificadores !== undefined) cambios.modificadores = body.modificadores;
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
