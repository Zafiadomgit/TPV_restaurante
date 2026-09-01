import { supabase } from "../_lib/supabaseClient.js";
import { exigirRol } from "../_lib/auth.js";

function mapRow(row) {
  return { id: row.id, nombre: row.nombre, orden: row.orden };
}

export default async function handler(req, res) {
  if (!exigirRol(req, res, ["caja"])) return;

  const segmentos = req.query.id;
  const id = Array.isArray(segmentos) ? segmentos[0] : segmentos;

  if (!id) {
    if (req.method === "GET") {
      const { data, error } = await supabase
        .from("menu_categorias")
        .select("*")
        .order("orden", { ascending: true });
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json(data.map(mapRow));
    }

    if (req.method === "POST") {
      const { nombre } = req.body || {};
      if (!nombre || typeof nombre !== "string" || !nombre.trim()) {
        return res.status(400).json({ error: "El nombre de la categoría es obligatorio" });
      }

      const { count } = await supabase.from("menu_categorias").select("*", { count: "exact", head: true });

      const { data, error } = await supabase
        .from("menu_categorias")
        .insert({ nombre: nombre.trim(), orden: count ?? 0 })
        .select()
        .single();

      if (error) {
        if (error.code === "23505") {
          return res.status(409).json({ error: `Ya existe una categoría llamada "${nombre}"` });
        }
        return res.status(500).json({ error: error.message });
      }
      return res.status(201).json(mapRow(data));
    }

    return res.status(405).json({ error: "Método no permitido" });
  }

  if (req.method === "PATCH") {
    const cambios = {};
    const body = req.body || {};
    if (body.nombre !== undefined) {
      if (!body.nombre.trim()) {
        return res.status(400).json({ error: "El nombre de la categoría es obligatorio" });
      }
      cambios.nombre = body.nombre.trim();
    }
    if (body.orden !== undefined) cambios.orden = Number(body.orden);

    if (Object.keys(cambios).length === 0) {
      return res.status(400).json({ error: "No hay cambios que aplicar" });
    }

    const { data, error } = await supabase
      .from("menu_categorias")
      .update(cambios)
      .eq("id", id)
      .select()
      .maybeSingle();

    if (error) {
      if (error.code === "23505") {
        return res.status(409).json({ error: `Ya existe una categoría llamada "${cambios.nombre}"` });
      }
      return res.status(500).json({ error: error.message });
    }
    if (!data) return res.status(404).json({ error: "Categoría no encontrada" });
    return res.status(200).json(mapRow(data));
  }

  if (req.method === "DELETE") {
    // Al borrar la categoría se borran también sus productos (on delete
    // cascade en la base de datos) — la UI ya avisa de esto antes de
    // llamar aquí.
    const { error } = await supabase.from("menu_categorias").delete().eq("id", id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(204).end();
  }

  res.status(405).json({ error: "Método no permitido" });
}
