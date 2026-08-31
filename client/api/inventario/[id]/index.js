import { supabase } from "../../_lib/supabaseClient.js";
import { mapRow } from "../../_lib/inventario.js";

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === "PATCH") {
    const cambios = {};
    const body = req.body || {};

    if (body.stock !== undefined) {
      const stock = Number(body.stock);
      if (!Number.isFinite(stock)) {
        return res.status(400).json({ error: "El stock debe ser un número válido" });
      }
      cambios.stock = stock;
    }
    if (body.umbralBajo !== undefined) {
      const umbral = Number(body.umbralBajo);
      if (!Number.isFinite(umbral)) {
        return res.status(400).json({ error: "El umbral debe ser un número válido" });
      }
      cambios.umbral_bajo = umbral;
    }
    if (body.visibleEnKiosco !== undefined) {
      cambios.visible_en_kiosco = Boolean(body.visibleEnKiosco);
    }
    if (body.nombre !== undefined) {
      cambios.nombre = String(body.nombre).trim();
    }

    if (Object.keys(cambios).length === 0) {
      return res.status(400).json({ error: "No hay cambios que aplicar" });
    }
    cambios.actualizado_en = new Date().toISOString();

    const { data, error } = await supabase
      .from("inventario")
      .update(cambios)
      .eq("id", id)
      .select()
      .maybeSingle();

    if (error) return res.status(500).json({ error: error.message });
    if (!data) return res.status(404).json({ error: "Ingrediente no encontrado" });
    return res.status(200).json(mapRow(data));
  }

  if (req.method === "DELETE") {
    const { error } = await supabase.from("inventario").delete().eq("id", id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(204).end();
  }

  res.status(405).json({ error: "Método no permitido" });
}
